

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Unit, Skill, Trait, GameSettings, MinigameType } from '../types';
import { soundService } from '../services/soundService';
import MinigameController from './MinigameController';
import ResonanceOverlay from './ResonanceOverlay';

interface DamageEvent {
  id: number;
  value: number;
  unitId: string;
  isCrit?: boolean;
  offsetX: number; // For distinct popup positions
  offsetY: number;
}

interface BattleSceneProps {
  heroes: Unit[]; 
  waves: Unit[][];
  onVictory: () => void;
  onDefeat: () => void;
  onRetreat: () => void;
  stageName: string;
  shards: number;
  settings: GameSettings;
}

type ShakeIntensity = 'none' | 'light' | 'medium' | 'heavy';

const BattleScene: React.FC<BattleSceneProps> = ({ heroes, waves, onVictory, onDefeat, onRetreat, stageName, shards, settings }) => {
  const [currentWaveIndex, setCurrentWaveIndex] = useState(0);
  const [currentHeroes, setCurrentHeroes] = useState<Unit[]>(heroes.map(h => ({ ...h, statusEffects: [] })));
  const [currentEnemies, setCurrentEnemies] = useState<Unit[]>(waves[0].map(e => ({ ...e, statusEffects: [] })));
  
  const [turn, setTurn] = useState<'PLAYER' | 'ENEMY'>('PLAYER');
  const [activeHeroId, setActiveHeroId] = useState<string | null>(null);
  const [actedHeroIds, setActedHeroIds] = useState<Set<string>>(new Set());
  const [logs, setLogs] = useState<string[]>(["Battle protocols initialized.", `Sector manifest: Wave 1 detected.`]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRetreatConfirm, setShowRetreatConfirm] = useState(false);
  const [damageEvents, setDamageEvents] = useState<DamageEvent[]>([]);
  
  // Animation state
  const [attackingUnitId, setAttackingUnitId] = useState<string | null>(null);
  const [hitUnitId, setHitUnitId] = useState<string | null>(null);

  const [shakeIntensity, setShakeIntensity] = useState<ShakeIntensity>('none');
  const [activeMinigame, setActiveMinigame] = useState<MinigameType | null>(null);
  const [pendingAction, setPendingAction] = useState<{ skill: Skill, target: Unit } | null>(null);
  const [resonanceActive, setResonanceActive] = useState(false);
  const [resonanceCooldownTurns, setResonanceCooldownTurns] = useState(0);
  const [strengthBuffDuration, setStrengthBuffDuration] = useState(0);

  const eventIdCounter = useRef(0);
  const activeHero = currentHeroes.find(h => h.id === activeHeroId);

  useEffect(() => {
    if (turn === 'PLAYER') {
      setResonanceCooldownTurns(prev => Math.max(0, prev - 1));
    }
  }, [turn]);

  const addDamagePopup = (unitId: string, value: number, isCrit = false) => {
    const id = ++eventIdCounter.current;
    // Offset each popup slightly for visibility
    const offsetX = Math.random() * 40 - 20; // -20 to 20px
    const offsetY = Math.random() * 20 - 10; // -10 to 10px
    setDamageEvents(prev => [...prev, { id, unitId, value, isCrit, offsetX, offsetY }]);
    setTimeout(() => {
      setDamageEvents(prev => prev.filter(e => e.id !== id));
    }, 1200);
  };

  const triggerShake = (intensity: ShakeIntensity) => {
    if (!settings.screenShakeEnabled) return;
    setShakeIntensity(intensity);
    setTimeout(() => setShakeIntensity('none'), 400);
  };

  const checkEndState = useCallback((heroes: Unit[], enemies: Unit[]) => {
    if (enemies.every(e => e.hp <= 0)) {
      if (currentWaveIndex < waves.length - 1) {
        setIsProcessing(true);
        const nextIdx = currentWaveIndex + 1;
        setTimeout(() => {
          setCurrentWaveIndex(nextIdx);
          setCurrentEnemies(waves[nextIdx].map(e => ({ ...e, statusEffects: [] })));
          setActedHeroIds(new Set());
          setActiveHeroId(null);
          setTurn('PLAYER');
          setLogs(prev => [`WAVE ${nextIdx + 1} manifest!`, ...prev]);
          setIsProcessing(false);
        }, 1200);
        return false;
      }
      onVictory();
      return true;
    }
    if (heroes.every(h => h.hp <= 0)) {
      onDefeat();
      return true;
    }
    return false;
  }, [currentWaveIndex, waves, onVictory, onDefeat]);

  const useSkill = async (skill: Skill, target: Unit, multiplier: number = 1.0) => {
    if (isProcessing || !activeHero) return;
    setIsProcessing(true);
    setAttackingUnitId(activeHero.id);

    const isHeal = skill.type === 'HEAL';
    let powerMult = (skill.power / 10) * multiplier;
    if (strengthBuffDuration > 0) powerMult *= 3.0; // Reverted strength buff (was 2.5)

    // Smooth movement anticipation
    await new Promise(r => setTimeout(r, 150)); 

    if (isHeal) {
      const healAmt = Math.floor(activeHero.attack * powerMult);
      soundService.play('HEAL');
      setCurrentHeroes(prev => prev.map(h => h.id === target.id ? { ...h, hp: Math.min(h.maxHp, h.hp + healAmt) } : h));
      addDamagePopup(target.id, -healAmt);
    } else {
      const damage = Math.max(1, Math.floor((activeHero.attack * powerMult) - target.defense)); // Reverted defense effectiveness (was 0.5)
      soundService.play('SLASH');
      setHitUnitId(target.id);
      addDamagePopup(target.id, damage, isCrit(multiplier));
      triggerShake('medium');
      setCurrentEnemies(prev => {
        const next = prev.map(e => e.id === target.id ? { ...e, hp: Math.max(0, e.hp - damage) } : e);
        checkEndState(currentHeroes, next);
        return next;
      });
      setLogs(prev => [`${activeHero.name} strikes with ${skill.name}!`, ...prev]);
    }

    await new Promise(r => setTimeout(r, 450));
    setAttackingUnitId(null);
    setHitUnitId(null);
    setActedHeroIds(prev => new Set(prev).add(activeHero.id));
    setActiveHeroId(null);
    setIsProcessing(false);
    if (strengthBuffDuration > 0) setStrengthBuffDuration(prev => prev - 1);
  };

  const isCrit = (multiplier: number) => multiplier > 1.2 || Math.random() > 0.9; // NERFED: Lowered player crit chance (was 0.85)

  const handleActionClick = (skill: Skill, target: Unit) => {
    // BUFFED: Increased minigame frequency (was 0.15)
    if (Math.random() < 0.25) { 
      setPendingAction({ skill, target });
      const types: MinigameType[] = ['WIRES', 'DECRYPT', 'PURGE', 'RHYTHM', 'BALANCE', 'LINK', 'MATCH', 'DODGE'];
      setActiveMinigame(types[Math.floor(Math.random() * types.length)]);
    } else {
      useSkill(skill, target);
    }
  };

  const onMinigameFinish = (success: boolean) => {
    if (!pendingAction || !activeHero) return;

    if (success) {
      const bonusDamage = Math.floor(pendingAction.target.maxHp * 0.2); // NERFED: Minigame bonus damage (was 0.25)
      addDamagePopup(pendingAction.target.id, bonusDamage, true);
      triggerShake('heavy');
      setCurrentEnemies(prev => prev.map(e => e.id === pendingAction.target.id ? { ...e, hp: Math.max(0, e.hp - bonusDamage) } : e));
      useSkill(pendingAction.skill, pendingAction.target, 3.0); // Success multiplier
    } else {
      // Minigame failed: active hero takes damage
      soundService.play('DEFEAT'); // Negative feedback sound
      const heroDamage = Math.floor(activeHero.maxHp * 0.20); // 20% of hero's max HP
      addDamagePopup(activeHero.id, heroDamage);
      triggerShake('heavy');
      setCurrentHeroes(prev => {
        const next = prev.map(h => h.id === activeHero.id ? { ...h, hp: Math.max(0, h.hp - heroDamage) } : h);
        checkEndState(next, currentEnemies); // Check if hero defeat
        return next;
      });
      setLogs(prev => [`${activeHero.name} failed minigame and took ${heroDamage} damage!`, ...prev]);
      useSkill(pendingAction.skill, pendingAction.target, 0.75); // Failure multiplier (reduced damage to enemy)
    }
    setPendingAction(null);
    setActiveMinigame(null);
  };

  const executeEnemyTurn = useCallback(async () => {
    setIsProcessing(true);
    setTurn('ENEMY');
    
    const aliveEnemies = currentEnemies.filter(e => e.hp > 0);
    for (const enemy of aliveEnemies) {
      await new Promise(r => setTimeout(r, 800)); // Reverted enemy turn speed (was 600)
      const aliveHeroes = currentHeroes.filter(h => h.hp > 0);
      const targetHero = aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];
      if (!targetHero) break;

      setAttackingUnitId(enemy.id);
      const skill = enemy.skills[0];
      const damage = Math.max(1, Math.floor((enemy.attack * (skill.power / 10)) - targetHero.defense));
      
      await new Promise(r => setTimeout(r, 150));
      soundService.play('SLASH');
      setHitUnitId(targetHero.id);
      addDamagePopup(targetHero.id, damage);
      triggerShake('light');

      setCurrentHeroes(prev => {
        const next = prev.map(h => h.id === targetHero.id ? { ...h, hp: Math.max(0, h.hp - damage) } : h);
        checkEndState(next, currentEnemies);
        return next;
      });
      
      await new Promise(r => setTimeout(r, 350));
      setAttackingUnitId(null);
      setHitUnitId(null);
    }

    setActedHeroIds(new Set());
    setActiveHeroId(null);
    setTurn('PLAYER');
    setIsProcessing(false);
  }, [currentEnemies, currentHeroes, checkEndState]);

  useEffect(() => {
    const aliveHeroes = currentHeroes.filter(h => h.hp > 0);
    if (turn === 'PLAYER' && aliveHeroes.length > 0 && actedHeroIds.size === aliveHeroes.length && !isProcessing) {
      executeEnemyTurn();
    }
  }, [actedHeroIds, currentHeroes, turn, executeEnemyTurn, isProcessing]);

  useEffect(() => {
    if (turn === 'PLAYER' && !activeHeroId) {
      const firstReady = currentHeroes.find(h => h.hp > 0 && !actedHeroIds.has(h.id));
      if (firstReady) setActiveHeroId(firstReady.id);
    }
  }, [turn, activeHeroId, currentHeroes, actedHeroIds]);

  return (
    <div className={`w-full h-full bg-slate-950 flex flex-col relative overflow-hidden transition-all duration-300 ${shakeIntensity !== 'none' ? 'animate-shake' : ''}`}>
      {activeMinigame && <MinigameController onFinish={onMinigameFinish} type={activeMinigame} />}
      {resonanceActive && (
        <ResonanceOverlay onComplete={(taps) => {
          setResonanceActive(false);
          setResonanceCooldownTurns(12); // Reverted cooldown (was 5, then 10)
          const heal = taps * 30 + 200; // Reverted heal (was 50*500)
          setCurrentHeroes(prev => prev.map(h => h.hp > 0 ? { ...h, hp: Math.min(h.maxHp, h.hp + heal) } : h));
          if (taps >= 8) { setStrengthBuffDuration(3); triggerShake('heavy'); soundService.play('MAGIC'); } // Reverted strength buff duration (was 5)
        }} />
      )}
      
      <div className="absolute inset-0 bg-cover bg-center opacity-10 blur-2xl scale-110 void-flux" style={{ backgroundImage: 'url(https://picsum.photos/seed/v-battle/1920/1080)' }}></div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-transparent to-slate-950"></div>

      <header className="relative z-10 flex justify-between items-center p-6 bg-slate-900/40 border-b border-white/5 backdrop-blur-xl">
        <div className="flex gap-8 items-center">
          <div className="flex flex-col">
            <h2 className="text-xl font-cinzel text-white font-black tracking-[0.3em] uppercase truncate max-w-xs">{stageName}</h2>
            <div className="flex items-center gap-2 mt-1">
               <div className={`w-2 h-2 rounded-full ${turn === 'PLAYER' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 animate-pulse'}`}></div>
               <span className="text-[10px] text-slate-500 font-mono uppercase font-black tracking-widest">{turn} TURN</span>
            </div>
          </div>
        </div>
        <button onClick={() => resonanceCooldownTurns === 0 && setResonanceActive(true)} disabled={resonanceCooldownTurns > 0} className={`px-5 py-2.5 rounded-xl text-[10px] font-black font-cinzel tracking-widest border transition-all ${resonanceCooldownTurns === 0 ? 'bg-violet-600 border-violet-400 text-white animate-pulse shadow-[0_0_20px_rgba(139,92,246,0.5)]' : 'bg-slate-900 border-slate-800 text-slate-600 opacity-40'}`}>
          {resonanceCooldownTurns === 0 ? 'VOID SURGE READY' : `RECHARGING (${resonanceCooldownTurns})`}
        </button>
      </header>

      <div className="flex-1 relative z-10 flex flex-col md:flex-row items-center justify-center gap-12 p-8 overflow-y-auto custom-scrollbar">
        
        {/* Enemies */}
        <div className="flex flex-row md:flex-col gap-10 justify-center items-center">
          {currentEnemies.map((enemy) => (
            <div key={enemy.id} className={`relative flex flex-col md:flex-row-reverse items-center gap-6 transition-all duration-500 ${enemy.hp <= 0 ? 'opacity-20 grayscale scale-90' : 'animate-unit-idle'}`}>
              <div className={`w-28 h-28 md:w-36 md:h-36 rounded-[2.5rem] overflow-hidden border-2 border-red-500/20 shadow-2xl relative bg-slate-950 transition-transform ${attackingUnitId === enemy.id ? 'lunge-enemy' : ''} ${hitUnitId === enemy.id ? 'animate-hit' : ''}`}>
                <img src={enemy.sprite} className="w-full h-full object-cover" />
                {damageEvents.filter(e => e.unitId === enemy.id).map(e => (
                   <div 
                     key={e.id} 
                     className={`damage-popup absolute flex items-center justify-center font-black drop-shadow-lg ${e.isCrit ? 'text-amber-400 text-6xl' : 'text-white text-4xl'}`}
                     style={{ 
                       '--dx': `${e.offsetX}px`, 
                       '--dy-start': `0px`, 
                       '--dy-mid': `-50px`, 
                       '--dy-end': `-100px`, 
                       left: '50%', 
                       top: '50%',
                       transform: `translate(-50%, -50%) translate3d(${e.offsetX}px, ${e.offsetY}px, 0)` // Adjust initial position
                     } as React.CSSProperties}
                   >
                     {e.value < 0 ? `+${Math.abs(e.value)}` : `-${e.value}`}
                   </div>
                ))}
              </div>
              <div className="w-24 md:w-56 text-center md:text-right">
                <div className="mb-2">
                  <span className="text-[10px] font-black text-red-400 font-mono uppercase truncate block">{enemy.name}</span>
                  <div className="h-2 w-full bg-black/40 rounded-full mt-1.5 overflow-hidden border border-white/5">
                    <div className="h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-700" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:flex flex-col items-center justify-center w-24 h-24">
          <div className="text-slate-700 font-cinzel font-black text-2xl animate-pulse">VS</div>
        </div>

        {/* Heroes */}
        <div className="flex flex-row md:flex-col gap-10 justify-center items-center">
          {currentHeroes.map((hero) => (
            <div key={hero.id} className={`relative flex flex-col md:flex-row items-center gap-6 transition-all duration-500 ${hero.hp <= 0 ? 'opacity-20 grayscale scale-90' : activeHeroId === hero.id ? 'scale-110' : ''}`}>
              <div className={`w-28 h-28 md:w-36 md:h-36 rounded-[2rem] overflow-hidden border-2 transition-all duration-500 relative bg-slate-950 shadow-2xl ${activeHeroId === hero.id ? 'border-violet-500 shadow-[0_0_40px_rgba(139,92,246,0.4)]' : 'border-slate-800 opacity-80'} ${attackingUnitId === hero.id ? 'lunge-player' : ''} ${hitUnitId === hero.id ? 'animate-hit' : ''} animate-unit-idle`}>
                <img src={hero.sprite} className="w-full h-full object-cover" />
                {damageEvents.filter(e => e.unitId === hero.id).map(e => (
                   <div 
                     key={e.id} 
                     className={`damage-popup absolute flex items-center justify-center font-black drop-shadow-lg ${e.value < 0 ? 'text-emerald-400 text-5xl' : 'text-red-500 text-4xl'}`}
                     style={{ 
                       '--dx': `${e.offsetX}px`, 
                       '--dy-start': `0px`, 
                       '--dy-mid': `-50px`, 
                       '--dy-end': `-100px`, 
                       left: '50%', 
                       top: '50%',
                       transform: `translate(-50%, -50%) translate3d(${e.offsetX}px, ${e.offsetY}px, 0)` // Adjust initial position
                     } as React.CSSProperties}
                   >
                      {e.value < 0 ? `+${Math.abs(e.value)}` : `-${e.value}`}
                   </div>
                ))}
              </div>
              <div className="w-24 md:w-48 text-center md:text-left">
                <div className="mb-2">
                  <span className="text-[10px] font-black text-white font-mono uppercase truncate block">{hero.name}</span>
                  <div className="h-2 w-full bg-black/40 rounded-full mt-1.5 overflow-hidden border border-white/5">
                    <div className="h-full bg-gradient-to-r from-emerald-700 to-emerald-400 transition-all duration-700" style={{ width: `${(hero.hp / hero.maxHp) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="relative z-20 flex flex-col md:grid md:grid-cols-12 bg-slate-900 border-t border-white/5 md:h-52 backdrop-blur-3xl">
        <div className="md:col-span-4 p-5 md:p-8 border-b md:border-b-0 md:border-r border-white/5 overflow-y-auto custom-scrollbar flex flex-col-reverse bg-black/20">
          {logs.slice(0, 10).map((log, i) => (
            <div key={i} className={`text-[10px] py-1.5 font-mono ${i === 0 ? 'text-violet-400 font-bold' : 'text-slate-600'}`}>
              {log}
            </div>
          ))}
        </div>

        <div className="md:col-span-8 p-6 md:p-10 flex flex-col justify-center bg-gradient-to-r from-slate-900/50 to-transparent">
          {turn === 'PLAYER' && activeHero ? (
            <div className="flex gap-5 w-full overflow-x-auto no-scrollbar pb-2">
              {activeHero.skills.filter(s => s.unlocked).map((skill, idx) => (
                <button key={idx} onClick={() => {
                    const target = skill.type === 'HEAL' ? activeHero : currentEnemies.find(e => e.hp > 0);
                    if (target) handleActionClick(skill, target);
                  }}
                  className="group relative flex-1 min-w-[160px] px-8 py-5 bg-slate-950 border border-slate-800 rounded-3xl hover:border-violet-500 hover:scale-105 transition-all flex flex-col items-start active:scale-95 shadow-2xl hover:bg-violet-950/20"
                >
                  <span className="text-xs font-black font-cinzel text-white uppercase truncate mb-1.5 tracking-widest">{skill.name}</span>
                  <div className="flex justify-between w-full items-center">
                     <span className="text-[9px] text-slate-500 font-mono font-bold">POW {skill.power}</span>
                     <div className="flex items-center gap-2">
                        <i className={`fas ${skill.type === 'HEAL' ? 'fa-heart text-emerald-500' : 'fa-bolt text-violet-500'} text-xs opacity-60 group-hover:opacity-100 group-hover:scale-125 transition-all`}></i>
                     </div>
                  </div>
                  <div className="absolute inset-0 bg-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"></div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3">
               <div className="text-slate-600 font-cinzel text-xs tracking-[0.8em] uppercase font-black animate-pulse">Neural Recalibration</div>
               <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500/40 animate-[loading_1.5s_infinite]"></div>
               </div>
            </div>
          )}
        </div>
      </footer>
      <style>{`
        @keyframes loading {
          0% { width: 0; transform: translateX(0); }
          50% { width: 100%; transform: translateX(0); }
          100% { width: 0; transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default BattleScene;
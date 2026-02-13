
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
}

interface SlashEvent {
  id: number;
  unitId: string;
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
  const [slashEvents, setSlashEvents] = useState<SlashEvent[]>([]);
  const [showLogsMobile, setShowLogsMobile] = useState(false);

  const [shakeIntensity, setShakeIntensity] = useState<ShakeIntensity>('none');
  const [activeMinigame, setActiveMinigame] = useState<MinigameType | null>(null);
  const [pendingAction, setPendingAction] = useState<{ skill: Skill, target: Unit } | null>(null);
  const [resonanceActive, setResonanceActive] = useState(false);
  const [resonanceCooldownTurns, setResonanceCooldownTurns] = useState(0);
  const [strengthBuffDuration, setStrengthBuffDuration] = useState(0);

  const eventIdCounter = useRef(0);
  const activeHero = currentHeroes.find(h => h.id === activeHeroId);
  const retreatCost = 500;

  useEffect(() => {
    if (turn === 'PLAYER') {
      setResonanceCooldownTurns(prev => Math.max(0, prev - 1));
    }
  }, [turn]);

  const addDamagePopup = (unitId: string, value: number, isCrit = false) => {
    const id = ++eventIdCounter.current;
    setDamageEvents(prev => [...prev, { id, unitId, value, isCrit }]);
    setTimeout(() => {
      setDamageEvents(prev => prev.filter(e => e.id !== id));
    }, 1500);
  };

  const triggerShake = (intensity: ShakeIntensity) => {
    if (!settings.screenShakeEnabled) return;
    setShakeIntensity(intensity);
    setTimeout(() => setShakeIntensity('none'), 500);
  };

  const addSlashEffect = (unitId: string) => {
    const id = ++eventIdCounter.current;
    setSlashEvents(prev => [...prev, { id, unitId }]);
    setTimeout(() => {
      setSlashEvents(prev => prev.filter(e => e.id !== id));
    }, 600);
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
          setLogs(prev => [`WAVE ${nextIdx + 1} manifest in the void!`, ...prev]);
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

    const isHeal = skill.type === 'HEAL';
    let powerMult = (skill.power / 10) * multiplier;
    if (strengthBuffDuration > 0) powerMult *= 3.0; 

    if (isHeal) {
      const healAmt = Math.floor(activeHero.attack * powerMult);
      soundService.play('HEAL');
      setCurrentHeroes(prev => {
        const next = prev.map(h => h.id === target.id ? { ...h, hp: Math.min(h.maxHp, h.hp + healAmt) } : h);
        return next;
      });
      addDamagePopup(target.id, healAmt);
      setLogs(prev => [`${activeHero.name} resonates ${skill.name} -> ${target.name}.`, ...prev]);
    } else {
      const damage = Math.max(1, Math.floor((activeHero.attack * powerMult) - target.defense));
      soundService.play('SLASH');
      addSlashEffect(target.id);
      addDamagePopup(target.id, damage, multiplier > 1);
      triggerShake(damage > 100 ? 'heavy' : 'medium');
      setCurrentEnemies(prev => {
        const next = prev.map(e => e.id === target.id ? { ...e, hp: Math.max(0, e.hp - damage) } : e);
        checkEndState(currentHeroes, next);
        return next;
      });
      setLogs(prev => [`${activeHero.name} strikes with ${skill.name} -> ${target.name}!`, ...prev]);
    }

    setActedHeroIds(prev => new Set(prev).add(activeHero.id));
    setActiveHeroId(null);
    setIsProcessing(false);
    
    if (strengthBuffDuration > 0) {
      setStrengthBuffDuration(prev => prev - 1);
    }
  };

  const handleActionClick = (skill: Skill, target: Unit) => {
    if (Math.random() < 0.3) {
      setPendingAction({ skill, target });
      const types: MinigameType[] = ['WIRES', 'DECRYPT', 'PURGE', 'RHYTHM', 'BALANCE', 'LINK', 'MATCH', 'DODGE'];
      setActiveMinigame(types[Math.floor(Math.random() * types.length)]);
    } else {
      useSkill(skill, target);
    }
  };

  const onMinigameFinish = (success: boolean) => {
    if (pendingAction) {
      if (success) {
        const bonusDamage = Math.floor(pendingAction.target.maxHp * 0.15);
        addDamagePopup(pendingAction.target.id, bonusDamage, true);
        triggerShake('heavy');
        setCurrentEnemies(prev => {
          const next = prev.map(e => e.id === pendingAction.target.id ? { ...e, hp: Math.max(0, e.hp - bonusDamage) } : e);
          return next;
        });
      }
      useSkill(pendingAction.skill, pendingAction.target, success ? 2.5 : 0.8);
      setPendingAction(null);
    }
    setActiveMinigame(null);
  };

  const executeEnemyTurn = useCallback(async () => {
    setIsProcessing(true);
    setTurn('ENEMY');
    
    const aliveEnemies = currentEnemies.filter(e => e.hp > 0);
    for (const enemy of aliveEnemies) {
      await new Promise(r => setTimeout(r, 1000));
      const aliveHeroes = currentHeroes.filter(h => h.hp > 0);
      const targetHero = aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];
      if (!targetHero) break;

      const skill = enemy.skills[0];
      const damage = Math.max(1, Math.floor((enemy.attack * (skill.power / 10)) - targetHero.defense));
      
      soundService.play('SLASH');
      addSlashEffect(targetHero.id);
      addDamagePopup(targetHero.id, damage);
      triggerShake('light');

      setCurrentHeroes(prev => {
        const next = prev.map(h => h.id === targetHero.id ? { ...h, hp: Math.max(0, h.hp - damage) } : h);
        checkEndState(next, currentEnemies);
        return next;
      });
      setLogs(prev => [`${enemy.name} used ${skill.name} -> ${targetHero.name}`, ...prev]);
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
          setResonanceCooldownTurns(15);
          const heal = taps * 20 + 100;
          setCurrentHeroes(prev => prev.map(h => h.hp > 0 ? { ...h, hp: Math.min(h.maxHp, h.hp + heal) } : h));
          if (taps >= 10) { setStrengthBuffDuration(3); triggerShake('heavy'); soundService.play('MAGIC'); }
          setLogs(prev => [`Resonance Success! Party restored for ${heal} HP.`, ...prev]);
        }} />
      )}
      
      {/* Background Layer */}
      <div className="absolute inset-0 bg-cover bg-center opacity-10 blur-2xl scale-110 void-flux" style={{ backgroundImage: 'url(https://picsum.photos/seed/void-battle-core/1920/1080)' }}></div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-transparent to-slate-950"></div>

      {/* Battle Header */}
      <header className="relative z-10 flex justify-between items-center p-6 bg-slate-900/40 border-b border-white/5 backdrop-blur-xl">
        <div className="flex gap-8 items-center">
          <div className="flex flex-col">
            <h2 className="text-xl font-cinzel text-white font-black tracking-[0.3em] uppercase truncate max-w-xs">{stageName}</h2>
            <div className="flex items-center gap-2 mt-1">
               <div className={`w-2 h-2 rounded-full ${turn === 'PLAYER' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]'}`}></div>
               <span className="text-[10px] text-slate-500 font-mono uppercase font-black tracking-widest">{turn} TURN ACTIVE</span>
            </div>
          </div>
          <div className="glass px-5 py-2 rounded-xl flex items-center gap-3">
             <span className="text-[9px] font-black text-violet-400 font-mono uppercase tracking-widest">WAVE</span>
             <span className="text-xl font-mono font-bold text-white leading-none">{currentWaveIndex + 1} / {waves.length}</span>
          </div>
        </div>
        <div className="flex gap-3">
           <button 
              onClick={() => resonanceCooldownTurns === 0 && setResonanceActive(true)}
              disabled={resonanceCooldownTurns > 0}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black font-cinzel tracking-widest transition-all border ${resonanceCooldownTurns === 0 ? 'bg-violet-600 border-violet-400 text-white animate-pulse shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-600 opacity-40'}`}
           >
              {resonanceCooldownTurns === 0 ? 'ACTIVATE RESONANCE' : `RECHARGING (${resonanceCooldownTurns}T)`}
           </button>
           <button onClick={() => setShowRetreatConfirm(true)} className="px-5 py-2.5 border border-red-900/30 text-red-500 hover:bg-red-950/20 rounded-xl text-[10px] font-black font-cinzel tracking-widest transition-all">ABORT</button>
        </div>
      </header>

      {/* Battleground */}
      <div className="flex-1 relative z-10 flex flex-col md:flex-row items-center justify-center gap-12 p-8 overflow-y-auto custom-scrollbar">
        
        {/* Enemies side */}
        <div className="flex flex-row md:flex-col gap-8 justify-center items-center">
          {currentEnemies.map((enemy) => (
            <div key={enemy.id} className={`relative flex flex-col md:flex-row-reverse items-center gap-4 transition-all duration-700 ${enemy.hp <= 0 ? 'opacity-20 grayscale scale-90' : ''}`}>
              <div className="w-20 h-20 md:w-32 md:h-32 rounded-[2.5rem] overflow-hidden border-2 border-red-500/20 shadow-2xl relative bg-slate-950 group">
                <img src={enemy.sprite} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                {damageEvents.filter(e => e.unitId === enemy.id).map(e => (
                   <div key={e.id} className={`damage-popup absolute inset-0 flex items-center justify-center font-black ${e.isCrit ? 'text-amber-400 text-5xl' : 'text-white text-3xl'} drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]`}>
                     {e.value < 0 ? `+${Math.abs(e.value)}` : `-${e.value}`}
                   </div>
                ))}
              </div>
              <div className="w-24 md:w-56 text-center md:text-right">
                <div className="mb-2">
                  <span className="text-[10px] font-black text-red-400 font-mono uppercase truncate block">{enemy.name}</span>
                  <span className="text-[8px] font-mono text-slate-500">{Math.ceil(enemy.hp).toLocaleString()} / {enemy.maxHp.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-red-900/10">
                  <div className="h-full bg-gradient-to-l from-red-600 to-red-900 transition-all duration-700" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Center Stage */}
        <div className="hidden md:flex flex-col items-center justify-center w-24 h-24 rounded-full border border-white/5 bg-slate-900/20 relative">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-violet-500/10 animate-[spin_15s_linear_infinite]"></div>
          {strengthBuffDuration > 0 ? (
            <div className="flex flex-col items-center animate-bounce text-violet-400">
               <i className="fas fa-bolt-auto text-3xl"></i>
               <span className="text-[8px] font-black font-mono">BUFF: {strengthBuffDuration}T</span>
            </div>
          ) : (
            <span className="text-slate-700 font-cinzel font-black text-lg">VS</span>
          )}
        </div>

        {/* Heroes side */}
        <div className="flex flex-row md:flex-col gap-8 justify-center items-center">
          {currentHeroes.map((hero) => (
            <div key={hero.id} className={`relative flex flex-col md:flex-row items-center gap-4 transition-all duration-700 ${hero.hp <= 0 ? 'opacity-20 grayscale scale-90' : activeHeroId === hero.id ? 'scale-110' : ''}`}>
              <div className={`w-20 h-20 md:w-28 md:h-28 rounded-[2rem] overflow-hidden border-2 transition-all duration-500 relative bg-slate-950 ${activeHeroId === hero.id ? 'border-violet-500 shadow-[0_0_30px_rgba(139,92,246,0.3)]' : 'border-slate-800 opacity-60'}`}>
                <img src={hero.sprite} className="w-full h-full object-cover" />
                {damageEvents.filter(e => e.unitId === hero.id).map(e => (
                   <div key={e.id} className={`damage-popup absolute inset-0 flex items-center justify-center font-black ${e.value < 0 ? 'text-emerald-400 text-4xl' : 'text-red-500 text-3xl'} drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]`}>
                      {e.value < 0 ? `+${Math.abs(e.value)}` : `-${e.value}`}
                   </div>
                ))}
              </div>
              <div className="w-24 md:w-48 text-center md:text-left">
                <div className="mb-2">
                  <span className="text-[10px] font-black text-white font-mono uppercase truncate block">{hero.name}</span>
                  <span className="text-[8px] font-mono text-slate-500">{Math.ceil(hero.hp).toLocaleString()} / {hero.maxHp.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700" style={{ width: `${(hero.hp / hero.maxHp) * 100}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Combat HUD Footer */}
      <footer className="relative z-20 flex flex-col md:grid md:grid-cols-12 bg-slate-900 border-t border-white/5 md:h-48 backdrop-blur-3xl">
        
        {/* Mobile Log Controls */}
        <button 
           onClick={() => setShowLogsMobile(!showLogsMobile)}
           className="md:hidden w-full py-2 bg-black/40 flex items-center justify-center gap-3 text-[9px] font-black font-cinzel text-slate-500 uppercase tracking-widest"
        >
           <i className={`fas ${showLogsMobile ? 'fa-chevron-down' : 'fa-chevron-up'}`}></i>
           {showLogsMobile ? 'Minimize Intel' : 'Expand Intel'}
        </button>

        <div className={`${showLogsMobile ? 'h-40' : 'h-0'} md:h-full md:col-span-4 p-5 md:p-8 border-b md:border-b-0 md:border-r border-white/5 overflow-y-auto custom-scrollbar flex flex-col-reverse transition-all duration-300`}>
          {logs.map((log, i) => (
            <div key={i} className={`text-[10px] py-2 border-b border-white/5 font-mono ${i === 0 ? 'text-violet-400 font-bold' : 'text-slate-600 opacity-60'}`}>
              <span className="opacity-20 mr-3">[{new Date().toLocaleTimeString([], { second: '2-digit' })}]</span>
              {log}
            </div>
          ))}
        </div>

        <div className="md:col-span-8 p-6 md:p-10 flex flex-col justify-center bg-gradient-to-r from-slate-900/50 to-transparent">
          {turn === 'PLAYER' && activeHero ? (
            <div className="flex flex-col md:flex-row gap-10 items-center">
              <div className="flex flex-col items-center md:items-start w-full md:w-48 flex-shrink-0">
                <span className="text-[10px] font-black text-violet-500 uppercase tracking-[0.4em] font-mono mb-2">MANIFESTING</span>
                <span className="text-2xl font-cinzel text-white font-black truncate text-glow">{activeHero.name}</span>
              </div>
              <div className="grid grid-cols-2 lg:flex gap-4 w-full">
                {activeHero.skills.filter(s => s.unlocked).map((skill, idx) => (
                  <button 
                    key={idx}
                    onClick={() => {
                      const target = skill.type === 'HEAL' ? activeHero : currentEnemies.find(e => e.hp > 0);
                      if (target) handleActionClick(skill, target);
                    }}
                    className="group relative flex-1 px-6 py-4 bg-slate-950/60 border border-slate-800 rounded-2xl hover:border-violet-500 hover:bg-violet-900/20 transition-all flex flex-col items-start overflow-hidden active:scale-95 shadow-xl"
                  >
                    <span className="text-[10px] font-black font-cinzel text-white group-hover:text-violet-400 transition-colors uppercase truncate mb-1">
                      {skill.name}
                    </span>
                    <div className="flex justify-between w-full items-center">
                       <span className="text-[8px] text-slate-600 font-mono font-bold tracking-widest uppercase">POWER: {skill.power}</span>
                       <i className={`fas ${skill.type === 'HEAL' ? 'fa-heart text-emerald-500' : 'fa-bolt text-violet-500'} text-[10px] opacity-40 group-hover:opacity-100 transition-opacity`}></i>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-violet-600/20 group-hover:bg-violet-600 transition-all"></div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full gap-3">
               <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-600 animate-[loading_1.5s_infinite]"></div>
               </div>
               <div className="text-slate-600 font-cinzel text-[10px] tracking-[0.5em] uppercase font-black animate-pulse">Calculating Void Resistance...</div>
            </div>
          )}
        </div>
      </footer>

      {showRetreatConfirm && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-500">
           <div className="glass p-12 rounded-[3rem] border-red-500/30 max-w-sm text-center shadow-[0_0_100px_rgba(239,68,68,0.2)]">
              <i className="fas fa-person-running text-red-500 text-5xl mb-8 animate-bounce"></i>
              <h3 className="text-3xl font-cinzel text-white mb-4 uppercase font-black">Withdraw?</h3>
              <p className="text-slate-400 text-sm mb-10 italic leading-relaxed">"The singularity claims 500 Essence for failed expeditions. Return to Map?"</p>
              <div className="flex flex-col gap-4">
                 <button 
                   onClick={() => shards >= retreatCost ? onRetreat() : setShowRetreatConfirm(false)} 
                   className="w-full py-5 bg-red-600 hover:bg-red-500 text-white font-black font-cinzel rounded-2xl transition-all shadow-xl active:scale-95 uppercase tracking-widest"
                 >
                   Confirm Withdraw
                 </button>
                 <button 
                   onClick={() => setShowRetreatConfirm(false)}
                   className="w-full py-5 border border-slate-700 text-slate-500 hover:text-white font-black font-cinzel rounded-2xl transition-all active:scale-95 uppercase tracking-widest"
                 >
                   Stay and Fight
                 </button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        @keyframes loading {
          0% { width: 0; margin-left: 0; }
          50% { width: 100%; margin-left: 0; }
          100% { width: 0; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
};

export default BattleScene;

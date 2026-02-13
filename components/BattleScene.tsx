import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Unit, Skill, Trait, Ability, StatusEffect, GameSettings, MinigameType } from '../types';
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
  const [logs, setLogs] = useState<string[]>(["Timeline convergence established.", `WAVE 1 manifested.`]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRetreatConfirm, setShowRetreatConfirm] = useState(false);
  const [damageEvents, setDamageEvents] = useState<DamageEvent[]>([]);
  const [slashEvents, setSlashEvents] = useState<SlashEvent[]>([]);
  const [showLogsMobile, setShowLogsMobile] = useState(false);

  const [shakeIntensity, setShakeIntensity] = useState<ShakeIntensity>('none');

  const [activeMinigame, setActiveMinigame] = useState<MinigameType | null>(null);
  const [pendingAction, setPendingAction] = useState<{ skill: Skill, target: Unit } | null>(null);
  const lastMinigameType = useRef<MinigameType | null>(null);
  const minigamesThisTurnCount = useRef(0);

  const [resonanceActive, setResonanceActive] = useState(false);
  const [resonanceCooldownTurns, setResonanceCooldownTurns] = useState(0);
  
  const [strengthBuffActive, setStrengthBuffActive] = useState(false);
  const [strengthBuffDuration, setStrengthBuffDuration] = useState(0);

  const activeHero = currentHeroes.find(h => h.id === activeHeroId);
  const eventIdCounter = useRef(0);
  const retreatCost = 500;

  useEffect(() => {
    const handleRetreatToggle = () => {
      setShowRetreatConfirm(prev => !prev);
    };
    window.addEventListener('toggle-retreat-modal', handleRetreatToggle);
    return () => window.removeEventListener('toggle-retreat-modal', handleRetreatToggle);
  }, []);

  // Cooldown decrement at start of Player Turn
  useEffect(() => {
    if (turn === 'PLAYER') {
      setResonanceCooldownTurns(prev => Math.max(0, prev - 1));
    }
  }, [turn]);

  const isResonanceReady = resonanceCooldownTurns === 0;

  const addDamagePopup = (unitId: string, value: number, isCrit = false) => {
    const id = ++eventIdCounter.current;
    setDamageEvents(prev => [...prev, { id, unitId, value, isCrit }]);
    setTimeout(() => {
      setDamageEvents(prev => prev.filter(e => e.id !== id));
    }, 1500);
  };

  const nextWave = useCallback(() => {
    const nextIdx = currentWaveIndex + 1;
    if (nextIdx < waves.length) {
      setIsProcessing(true);
      setCurrentWaveIndex(nextIdx);
      setCurrentEnemies(waves[nextIdx].map(e => ({ ...e, statusEffects: [] })));
      setActedHeroIds(new Set());
      setActiveHeroId(null);
      setTurn('PLAYER');
      minigamesThisTurnCount.current = 0;
      setLogs(prev => [`WAVE ${nextIdx + 1} manifest in the void!`, ...prev]);
      setTimeout(() => setIsProcessing(false), 1000);
    }
  }, [currentWaveIndex, waves]);

  const initiateResonance = () => {
    if (!isResonanceReady) return;
    soundService.play('SUMMON');
    setResonanceActive(true);
  };

  const handleResonanceComplete = (totalTaps: number) => {
    const healAmount = (totalTaps * 15) + 100;
    setResonanceActive(false);
    setResonanceCooldownTurns(20); 
    
    setCurrentHeroes(prev => {
        const next = prev.map(hero => {
            if (hero.hp <= 0) return hero;
            return { ...hero, hp: Math.min(hero.maxHp, hero.hp + healAmount) };
        });
        return next;
    });

    currentHeroes.forEach(hero => {
        if (hero.hp > 0) addDamagePopup(hero.id, -healAmount);
    });

    if (totalTaps >= 8) {
      setStrengthBuffActive(true);
      setStrengthBuffDuration(3);
      setLogs(prev => [`RESONANCE SURGE! Healed party for ${healAmount} and Tripled Strength!`, ...prev]);
      soundService.play('MAGIC');
      triggerShake('heavy');
    } else {
      setLogs(prev => [`RESONANCE SYNC: Healed party for ${healAmount}.`, ...prev]);
    }
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
        nextWave();
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
  }, [onVictory, onDefeat, currentWaveIndex, waves.length, nextWave]);

  const executeEnemyTurn = useCallback(async () => {
    setIsProcessing(true);
    setTurn('ENEMY');
    
    const aliveEnemies = currentEnemies.filter(e => e.hp > 0);
    for (const enemy of aliveEnemies) {
      await new Promise(r => setTimeout(r, 800));
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
      setLogs(prev => [`${enemy.name} uses ${skill.name} on ${targetHero.name}!`, ...prev]);
    }

    setActedHeroIds(new Set());
    setActiveHeroId(null);
    setTurn('PLAYER');
    setIsProcessing(false);
  }, [currentEnemies, currentHeroes, triggerShake, checkEndState]);

  useEffect(() => {
    const aliveHeroes = currentHeroes.filter(h => h.hp > 0);
    if (turn === 'PLAYER' && aliveHeroes.length > 0 && actedHeroIds.size === aliveHeroes.length && !isProcessing) {
      executeEnemyTurn();
    }
  }, [actedHeroIds, currentHeroes, turn, executeEnemyTurn, isProcessing]);

  const useSkill = async (skill: Skill, target: Unit, multiplier: number = 1.0) => {
    if (isProcessing || !activeHero) return;
    setIsProcessing(true);

    const isHeal = skill.type === 'HEAL';
    let powerMult = (skill.power / 10) * multiplier;
    if (strengthBuffActive) powerMult *= 3.0; 

    if (isHeal) {
      const healAmt = Math.floor(activeHero.attack * powerMult);
      soundService.play('HEAL');
      setCurrentHeroes(prev => {
        const next = prev.map(h => h.id === target.id ? { ...h, hp: Math.min(h.maxHp, h.hp + healAmt) } : h);
        return next;
      });
      addDamagePopup(target.id, healAmt);
      setLogs(prev => [`${activeHero.name} casts ${skill.name} on ${target.name}.`, ...prev]);
    } else {
      const damage = Math.max(1, Math.floor((activeHero.attack * powerMult) - target.defense));
      soundService.play('SLASH');
      addSlashEffect(target.id);
      addDamagePopup(target.id, damage);
      triggerShake(damage > 100 ? 'heavy' : 'medium');
      setCurrentEnemies(prev => {
        const next = prev.map(e => e.id === target.id ? { ...e, hp: Math.max(0, e.hp - damage) } : e);
        checkEndState(currentHeroes, next);
        return next;
      });
      setLogs(prev => [`${activeHero.name} strikes ${target.name} with ${skill.name}!`, ...prev]);
    }

    setActedHeroIds(prev => new Set(prev).add(activeHero.id));
    setActiveHeroId(null);
    setIsProcessing(false);
    
    if (strengthBuffActive) {
      setStrengthBuffDuration(prev => {
        if (prev <= 1) setStrengthBuffActive(false);
        return prev - 1;
      });
    }
  };

  const handleActionClick = (skill: Skill, target: Unit) => {
    const roll = Math.random();
    const limit = (waves[currentWaveIndex]?.[0]?.isBoss) ? 4 : 2;

    if (roll < 0.35 && minigamesThisTurnCount.current < limit) {
      setPendingAction({ skill, target });
      const types: MinigameType[] = ['WIRES', 'DECRYPT', 'PURGE', 'RHYTHM', 'BALANCE', 'LINK', 'MATCH', 'DODGE'];
      let chosenType: MinigameType;
      do {
        chosenType = types[Math.floor(Math.random() * types.length)];
      } while (chosenType === lastMinigameType.current);
      lastMinigameType.current = chosenType;
      setActiveMinigame(chosenType);
      minigamesThisTurnCount.current++;
    } else {
      useSkill(skill, target);
    }
  };

  const onMinigameFinish = (success: boolean) => {
    if (pendingAction) {
      if (success) {
        const bonusDamage = Math.floor(pendingAction.target.maxHp * 0.20);
        addDamagePopup(pendingAction.target.id, bonusDamage);
        triggerShake('heavy');
        setCurrentEnemies(prev => {
          const next = prev.map(e => e.id === pendingAction.target.id ? { ...e, hp: Math.max(0, e.hp - bonusDamage) } : e);
          return next;
        });
      }
      useSkill(pendingAction.skill, pendingAction.target, success ? 3.0 : 0.7);
      setPendingAction(null);
    }
    setActiveMinigame(null);
  };

  const handleRetreat = () => {
    if (shards >= retreatCost) onRetreat();
  };

  useEffect(() => {
    if (turn === 'PLAYER' && !activeHeroId) {
      const firstReady = currentHeroes.find(h => h.hp > 0 && !actedHeroIds.has(h.id));
      if (firstReady) setActiveHeroId(firstReady.id);
    }
  }, [turn, activeHeroId, currentHeroes, actedHeroIds]);

  return (
    <div className={`w-full h-full bg-slate-950 flex flex-col relative overflow-hidden transition-all duration-300 ${shakeIntensity !== 'none' ? 'animate-shake' : ''}`}>
      {activeMinigame && <MinigameController onFinish={onMinigameFinish} type={activeMinigame} />}
      {resonanceActive && <ResonanceOverlay onComplete={handleResonanceComplete} />}
      
      <div className="absolute inset-0 bg-cover bg-center opacity-10 blur-xl scale-110" style={{ backgroundImage: 'url(https://picsum.photos/seed/void-battle/1920/1080)' }}></div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950"></div>

      <header className="relative z-10 flex justify-between items-center p-4 md:p-6 bg-slate-900/40 border-b border-slate-800 backdrop-blur-md">
        <div className="flex gap-4 md:gap-6 items-center">
          <div className="max-w-[150px] md:max-w-none">
            <h2 className="text-sm md:text-xl font-cinzel text-white font-black tracking-widest uppercase truncate">{stageName}</h2>
            <p className="text-[8px] md:text-[10px] text-slate-500 font-cinzel tracking-widest uppercase">{turn} TURN</p>
          </div>
          <div className="px-3 py-1 bg-violet-900/20 border border-violet-500/20 rounded-lg flex items-center gap-2">
             <span className="text-[8px] font-black text-violet-400 font-cinzel tracking-widest uppercase">Wave</span>
             <span className="text-sm md:text-lg font-mono font-bold text-white">{currentWaveIndex + 1}/{waves.length}</span>
          </div>
        </div>
        <div className="flex gap-2">
           <button 
              onClick={initiateResonance} 
              disabled={!isResonanceReady}
              className={`px-3 py-1.5 rounded-lg text-[8px] md:text-[10px] font-black font-cinzel tracking-widest transition-all border ${isResonanceReady ? 'bg-violet-600 border-violet-400 text-white animate-pulse shadow-[0_0_20px_rgba(139,92,246,0.8)]' : 'bg-slate-900 border-slate-800 text-slate-500 opacity-50'}`}
           >
              {isResonanceReady ? 'INITIATE SYNC' : `COOLDOWN (${resonanceCooldownTurns} TURNS)`}
           </button>
           <button onClick={() => setShowRetreatConfirm(true)} className="px-3 py-1.5 border border-red-900/30 text-red-500 hover:bg-red-950/20 rounded-lg text-[8px] md:text-[10px] font-black font-cinzel tracking-widest transition-all">RETREAT</button>
        </div>
      </header>

      {/* Main Combat Area */}
      <div className="flex-1 relative z-10 flex flex-col md:flex-row items-center justify-around p-4 md:p-8 overflow-y-auto">
        
        {/* Enemies */}
        <div className="order-1 md:order-3 flex flex-row md:flex-col gap-4 md:gap-6 flex-wrap justify-center">
          {currentEnemies.map((enemy) => (
            <div key={enemy.id} className={`relative flex flex-col md:flex-row-reverse items-center gap-2 md:gap-4 transition-all duration-500 ${enemy.hp <= 0 ? 'opacity-30 grayscale scale-95' : ''}`}>
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl overflow-hidden border-2 border-red-900/30 shadow-2xl relative">
                <img src={enemy.sprite} className="w-full h-full object-cover" />
                {damageEvents.filter(e => e.unitId === enemy.id).map(e => (
                   <div key={e.id} className="absolute inset-0 flex items-center justify-center text-white font-black text-xl md:text-2xl animate-float-up pointer-events-none drop-shadow-lg">-{e.value}</div>
                ))}
              </div>
              <div className="w-20 md:w-48 text-center md:text-right">
                <div className="flex flex-col mb-1">
                  <span className="text-[8px] md:text-[10px] font-black text-red-400 font-cinzel uppercase truncate">{enemy.name}</span>
                  <span className="text-[6px] md:text-[8px] font-mono text-slate-500">{Math.ceil(enemy.hp)} HP</span>
                </div>
                <div className="h-1 md:h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-red-900/20">
                  <div className="h-full bg-gradient-to-l from-red-600 to-red-900 transition-all duration-500" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}></div>
                </div>
              </div>
              {slashEvents.filter(e => e.unitId === enemy.id).map(e => (
                <div key={e.id} className="absolute inset-0 bg-red-600/20 animate-ping rounded-3xl pointer-events-none"></div>
              ))}
            </div>
          ))}
        </div>

        {/* Center Indicator */}
        <div className="order-2 md:order-2 my-4 md:my-0 relative flex flex-col items-center">
          {strengthBuffActive ? (
            <div className="flex flex-col items-center animate-bounce">
              <i className="fas fa-angles-up text-violet-400 text-2xl mb-1"></i>
              <div className="text-violet-400 font-black font-cinzel text-[8px] md:text-[10px] tracking-widest uppercase">SYNC BOOST ACTIVE</div>
            </div>
          ) : (
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center opacity-20">
              <span className="text-[8px] md:text-base text-slate-500 font-black font-cinzel">VS</span>
            </div>
          )}
        </div>

        {/* Heroes */}
        <div className="order-3 md:order-1 flex flex-row md:flex-col gap-4 md:gap-6 flex-wrap justify-center">
          {currentHeroes.map((hero) => (
            <div key={hero.id} className={`relative flex flex-col md:flex-row items-center gap-2 md:gap-4 transition-all duration-500 ${hero.hp <= 0 ? 'opacity-30 grayscale scale-95' : activeHeroId === hero.id ? 'scale-110' : ''}`}>
              <div className={`w-16 h-16 md:w-16 md:h-16 rounded-2xl overflow-hidden border-2 transition-all relative ${activeHeroId === hero.id ? 'border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.4)]' : 'border-slate-800'}`}>
                <img src={hero.sprite} className="w-full h-full object-cover" />
                {damageEvents.filter(e => e.unitId === hero.id).map(e => (
                  <div key={e.id} className={`absolute inset-0 flex items-center justify-center font-black text-lg md:text-xl animate-float-up pointer-events-none drop-shadow-lg ${e.value < 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                      {e.value < 0 ? `+${Math.abs(e.value)}` : `-${e.value}`}
                  </div>
                ))}
              </div>
              <div className="w-20 md:w-32 text-center md:text-left">
                <div className="flex justify-center md:justify-between items-end mb-1">
                  <span className="text-[8px] md:text-[9px] font-black text-white font-cinzel uppercase truncate">{hero.name}</span>
                  <span className="hidden md:inline text-[8px] font-mono text-slate-400">{Math.ceil(hero.hp)} HP</span>
                </div>
                <div className="h-1 md:h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500" style={{ width: `${(hero.hp / hero.maxHp) * 100}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / Controls */}
      <footer className="relative z-20 flex flex-col md:grid md:grid-cols-12 bg-slate-900 border-t border-slate-800 md:h-48">
        
        {/* Mobile Log Toggle */}
        <button 
           onClick={() => setShowLogsMobile(!showLogsMobile)}
           className="md:hidden w-full py-2 bg-slate-950/50 flex items-center justify-center gap-2 text-[8px] font-black font-cinzel text-slate-500 uppercase tracking-widest"
        >
           <i className={`fas ${showLogsMobile ? 'fa-chevron-down' : 'fa-chevron-up'}`}></i>
           {showLogsMobile ? 'Hide Intel' : 'Show Intel'}
        </button>

        <div className={`${showLogsMobile ? 'h-32' : 'h-0'} md:h-full md:col-span-4 p-4 md:p-6 border-b md:border-b-0 md:border-r border-slate-800 overflow-y-auto custom-scrollbar flex flex-col-reverse transition-all duration-300`}>
          {logs.map((log, i) => (
            <div key={i} className={`text-[8px] md:text-[10px] py-1 border-b border-white/5 font-mono ${i === 0 ? 'text-violet-400 font-bold' : 'text-slate-500'}`}>
              <span className="opacity-30 mr-2">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
              {log}
            </div>
          ))}
        </div>

        <div className="md:col-span-8 p-4 md:p-6 flex flex-col justify-center min-h-[140px]">
          {turn === 'PLAYER' && activeHero ? (
            <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center">
              <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0 mr-0 md:mr-6 w-full md:w-auto">
                <span className="text-[8px] md:text-[10px] font-black text-violet-400 uppercase tracking-widest font-cinzel">Current Turn</span>
                <span className="text-sm md:text-xl font-cinzel text-white font-bold truncate">{activeHero.name}</span>
              </div>
              <div className="grid grid-cols-2 md:flex gap-3 w-full">
                {activeHero.skills.filter(s => s.unlocked).map((skill, idx) => (
                  <button 
                    key={idx}
                    onClick={() => {
                      if (skill.type === 'HEAL') handleActionClick(skill, activeHero);
                      else {
                        const target = currentEnemies.find(e => e.hp > 0);
                        if (target) handleActionClick(skill, target);
                      }
                    }}
                    className="group relative px-4 md:px-6 py-3 md:py-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-violet-500 transition-all flex flex-col items-start"
                  >
                    <span className="text-[8px] md:text-[10px] font-black font-cinzel text-white group-hover:text-violet-400 transition-colors uppercase truncate">
                      {skill.name}
                    </span>
                    <span className="text-[6px] md:text-[8px] text-slate-500 font-mono mt-1">POW: {skill.power}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-full">
               <div className="text-slate-600 font-cinzel text-[10px] tracking-widest uppercase animate-pulse">Calculating Resonance...</div>
            </div>
          )}
        </div>
      </footer>

      {showRetreatConfirm && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
           <div className="glass p-8 rounded-3xl border-red-500/30 max-w-sm text-center">
              <i className="fas fa-person-running text-red-500 text-3xl mb-4"></i>
              <h3 className="text-xl font-cinzel text-white mb-2 uppercase">Abort Timeline?</h3>
              <p className="text-slate-400 text-xs mb-8 italic">"Retreating costs {retreatCost} Void Shards. Current Essence: {shards}"</p>
              <div className="flex flex-col gap-3">
                 <button 
                   onClick={handleRetreat} 
                   disabled={shards < retreatCost}
                   className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:opacity-30 text-white font-black font-cinzel rounded-xl transition-all"
                 >
                   CONFIRM RETREAT
                 </button>
                 <button 
                   onClick={() => setShowRetreatConfirm(false)}
                   className="w-full py-4 border border-slate-700 text-slate-400 font-black font-cinzel rounded-xl transition-all"
                 >
                   STAY AND FIGHT
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default BattleScene;
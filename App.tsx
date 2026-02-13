
/// <reference lib="dom" />
import React, { useState, useEffect, useRef } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import TitleScreen from './components/TitleScreen';
import LoreIntro from './components/LoreIntro';
import ChapterSelect from './components/ChapterSelect';
import StageSelect from './components/StageSelect';
import BattleScene from './components/BattleScene';
import HeroManagement from './components/HeroManagement';
import GachaSystem from './components/GachaSystem';
import DailyReward from './components/DailyReward';
import SettingsModal from './components/SettingsModal';
import EnemyIndex from './components/EnemyIndex';
import StoryIntro from './components/StoryIntro';
import { GameScreen, GameState, Stage, Unit, Equipment, GameSettings, DialogueLine } from './types';
import { INITIAL_PARTY, CHAPTER_STAGES, HERO_POOL, MAX_ENERGY, ENERGY_REGEN_INTERVAL_MS, ENERGY_REFILL_COST } from './constants';
import { getStageDialogueStream } from './services/geminiService';
import { soundService } from './services/soundService';

const MUSIC_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3"; 
const SAVE_KEY = 'ECHOES_VOID_PERMANENT_V11';
const LATEST_SAVE_VERSION = 11;

function deepMerge(target: any, source: any): any {
  if (!source) return target;
  const output = { ...target };
  Object.keys(source).forEach(key => {
    const sourceVal = source[key];
    const targetVal = target[key];
    if (Array.isArray(sourceVal)) { output[key] = [...sourceVal]; } 
    else if (sourceVal !== null && typeof sourceVal === 'object') { output[key] = deepMerge(targetVal || {}, sourceVal); } 
    else { output[key] = sourceVal; }
  });
  return output;
}

const App: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: -100, y: -100 });
  const screenRef = useRef<HTMLDivElement>(null); // Ref for the CSSTransition child

  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    const defaults: GameState = {
      saveVersion: LATEST_SAVE_VERSION,
      screen: GameScreen.LORE_INTRO, 
      party: INITIAL_PARTY,
      allHeroes: INITIAL_PARTY,
      inventory: [],
      currentStage: null,
      currentChapterId: 1,
      unlockedStages: [1],
      attemptedStages: [],
      storyDialogue: [],
      shards: 1000, 
      heroTickets: 1,
      itemTickets: 3,
      totalAccountExp: 0,
      lastDailyClaim: null,
      totalDailyClaims: 0,
      settings: {
        musicEnabled: true,
        musicVolume: 0.4,
        mouseSensitivity: 1.0,
        screenShakeEnabled: true
      },
      currentEnergy: MAX_ENERGY, // New: Initialize energy
      lastEnergyReplenishTime: Date.now() // New: Initialize energy timestamp
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged = deepMerge({ ...defaults }, parsed);
        const sanitizeUnit = (u: any) => ({
          ...u,
          equipment: u.equipment || { weapon: null, armor: null },
          statusEffects: u.statusEffects || [],
          skills: u.skills || []
        });
        merged.party = merged.party.map(sanitizeUnit);
        merged.allHeroes = merged.allHeroes.map(sanitizeUnit);
        merged.saveVersion = LATEST_SAVE_VERSION;

        // NEW: Recalculate energy on load
        let loadedEnergy = merged.currentEnergy || 0;
        const loadedTime = merged.lastEnergyReplenishTime || Date.now();
        const now = Date.now();
        const elapsedTime = now - loadedTime;
        const energyGained = Math.floor(elapsedTime / ENERGY_REGEN_INTERVAL_MS);
        
        loadedEnergy = Math.min(MAX_ENERGY, loadedEnergy + energyGained);
        
        // Update lastEnergyReplenishTime to reflect gained energy
        const newLastEnergyTime = loadedTime + (energyGained * ENERGY_REGEN_INTERVAL_MS);

        return { ...merged, screen: GameScreen.TITLE, currentEnergy: loadedEnergy, lastEnergyReplenishTime: newLastEnergyTime };
      } catch (e) { 
        console.error("Save load failed.", e); 
      }
    }
    return defaults;
  });
  
  const [stages, setStages] = useState<Stage[]>(() => {
    return CHAPTER_STAGES.map(s => ({
      ...s,
      completed: gameState.unlockedStages.includes(s.id + 1) || false,
      unlocked: gameState.unlockedStages.includes(s.id)
    }));
  });

  useEffect(() => {
    setStages(prev => CHAPTER_STAGES.map(s => ({
      ...s,
      completed: gameState.unlockedStages.includes(s.id + 1) || false,
      unlocked: gameState.unlockedStages.includes(s.id)
    })));
  }, [gameState.unlockedStages]);

  const [isNarrating, setIsNarrating] = useState(false);
  const [showRewards, setShowRewards] = useState<{ exp: number, shards: number, newHero?: string } | null>(null);
  const [showDaily, setShowDaily] = useState(false);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSettings) { setShowSettings(false); soundService.play('CLICK'); return; }
        switch (gameState.screen) {
          case GameScreen.CHAPTER_SELECT: navigateTo(GameScreen.TITLE); break;
          case GameScreen.MAP: navigateTo(GameScreen.CHAPTER_SELECT); break;
          case GameScreen.HERO_MANAGEMENT:
          case GameScreen.GACHA:
          case GameScreen.ENEMY_INDEX:
          case GameScreen.STORY_INTRO: navigateTo(GameScreen.MAP); break;
          case GameScreen.BATTLE: window.dispatchEvent(new CustomEvent('toggle-retreat-modal')); break;
          default: break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.screen, showSettings]);

  const saveGame = (state: GameState) => {
    const stateToSave = { ...state, lastSaved: new Date().toISOString() };
    localStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));
  };

  useEffect(() => {
    saveGame(gameState);
    if (gameState.screen !== GameScreen.LORE_INTRO && gameState.screen !== GameScreen.TITLE) {
      setShowSaveIndicator(true);
      const timer = setTimeout(() => setShowSaveIndicator(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [
    gameState.shards, gameState.heroTickets, gameState.itemTickets, gameState.totalAccountExp, 
    gameState.unlockedStages, gameState.attemptedStages, gameState.party, gameState.allHeroes,
    gameState.inventory, gameState.settings, gameState.totalDailyClaims,
    gameState.lastDailyClaim, gameState.currentChapterId,
    // NEW: Trigger save on energy changes
    gameState.currentEnergy, gameState.lastEnergyReplenishTime
  ]);

  // NEW: Energy Regeneration Effect
  useEffect(() => {
    const energyRegenTimer = setInterval(() => {
      setGameState(prev => {
        const now = Date.now();
        const elapsedTime = now - prev.lastEnergyReplenishTime;
        const energyGained = Math.floor(elapsedTime / ENERGY_REGEN_INTERVAL_MS);

        if (energyGained > 0 && prev.currentEnergy < MAX_ENERGY) {
          const newEnergy = Math.min(MAX_ENERGY, prev.currentEnergy + energyGained);
          const newLastEnergyTime = prev.lastEnergyReplenishTime + (energyGained * ENERGY_REGEN_INTERVAL_MS);
          return { ...prev, currentEnergy: newEnergy, lastEnergyReplenishTime: newLastEnergyTime };
        }
        return prev;
      });
    }, 1000); // Check every second

    return () => clearInterval(energyRegenTimer);
  }, []); // Run once on component mount

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(MUSIC_URL);
      audioRef.current.loop = true;
    }
    const currentVolume = gameState.settings.musicVolume;
    audioRef.current.volume = currentVolume;
    soundService.setVolume(currentVolume);
    if (gameState.settings.musicEnabled && gameState.screen !== GameScreen.LORE_INTRO) {
      audioRef.current.play().catch(e => console.debug("Interaction required"));
    } else {
      audioRef.current.pause();
    }
  }, [gameState.settings.musicEnabled, gameState.settings.musicVolume, gameState.screen]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => { mousePos.current = { x: e.clientX, y: e.clientY }; };
    let rafId: number;
    const updateCursor = () => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0) translate(-50%, -50%)`;
      }
      rafId = requestAnimationFrame(updateCursor);
    };
    window.addEventListener('mousemove', handleMove);
    rafId = requestAnimationFrame(updateCursor);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    if (gameState.screen === GameScreen.CHAPTER_SELECT) {
      const today = new Date().toISOString().split('T')[0];
      if (gameState.lastDailyClaim !== today) { setShowDaily(true); }
    }
  }, [gameState.screen, gameState.lastDailyClaim]);

  const claimDaily = () => {
    soundService.play('CLICK');
    const today = new Date().toISOString().split('T')[0];
    const rewardType = gameState.totalDailyClaims % 3;
    setGameState(prev => {
      let newState = { ...prev, lastDailyClaim: today, totalDailyClaims: prev.totalDailyClaims + 1 };
      if (rewardType === 0) newState.shards += 500;
      else if (rewardType === 1) newState.heroTickets += 1;
      else newState.itemTickets += 1;
      return newState;
    });
    setShowDaily(false);
  };

  const startGame = () => { soundService.play('CLICK'); setGameState(prev => ({ ...prev, screen: GameScreen.CHAPTER_SELECT })); };
  const startNewGame = () => { soundService.play('CLICK'); localStorage.removeItem(SAVE_KEY); window.location.reload(); };

  const selectChapter = (chapterId: number) => {
    soundService.play('CLICK');
    setGameState(prev => ({ ...prev, currentChapterId: chapterId, screen: GameScreen.MAP }));
  };

  const selectStage = (stage: Stage) => {
    soundService.play('CLICK');
    setGameState(prev => ({ 
      ...prev, 
      currentStage: stage, 
      screen: GameScreen.STORY_INTRO, 
      storyDialogue: [{ speaker: "NARRATOR", text: stage.loreNote }],
      // Energy consumption moved to handleDeployToBattle
    }));
    setIsNarrating(true);
    let dialogueAccumulator = "";
    getStageDialogueStream(stage.name, stage.description, stage.loreNote, (chunk) => {
      dialogueAccumulator += chunk;
      const lines = dialogueAccumulator.split('\n').filter(l => l.includes(':')).map(l => {
          const [speaker, ...textParts] = l.split(':');
          return { speaker: speaker.replace('[', '').replace(']', '').trim(), text: textParts.join(':').trim() };
      });
      setGameState(prev => ({ ...prev, storyDialogue: [{ speaker: "NARRATOR", text: stage.loreNote }, ...lines] }));
    }).finally(() => { setIsNarrating(false); });
  };

  const handleDeployToBattle = () => {
    if (!gameState.currentStage) return;

    if (gameState.currentEnergy <= 0) {
      alert("Insufficient energy to initiate combat! Replenish your energy to proceed.");
      soundService.play('DEFEAT');
      return;
    }

    soundService.play('CLICK');
    setGameState(prev => {
      let attemptedStages = prev.attemptedStages;
      if (prev.currentStage && !attemptedStages.includes(prev.currentStage.id)) {
        attemptedStages = [...attemptedStages, prev.currentStage.id];
      }
      return {
        ...prev,
        screen: GameScreen.BATTLE,
        currentEnergy: prev.currentEnergy - 1, // Consume 1 energy here
        attemptedStages
      };
    });
  };

  const replenishEnergy = () => {
    if (gameState.shards >= ENERGY_REFILL_COST && gameState.currentEnergy < MAX_ENERGY) {
      soundService.play('MAGIC');
      setGameState(prev => ({
        ...prev,
        shards: prev.shards - ENERGY_REFILL_COST,
        currentEnergy: MAX_ENERGY,
        lastEnergyReplenishTime: Date.now()
      }));
    } else if (gameState.currentEnergy >= MAX_ENERGY) {
      alert("Energy bar is already full!");
    } else {
      alert("Not enough Void Shards to replenish energy.");
    }
  };

  const onVictory = () => {
    soundService.play('VICTORY');
    if (!gameState.currentStage) return;
    const stage = gameState.currentStage;
    const isFirstTime = !stages.find(s => s.id === stage.id)?.completed;
    const nextStageId = stage.id + 1;
    const shardsWon = isFirstTime ? stage.shardReward : Math.floor(stage.shardReward * 0.1); // Dynamic rewards based on first time clear
    const expWon = isFirstTime ? stage.expReward : Math.floor(stage.expReward * 0.1);
    let newHeroList = [...gameState.allHeroes];
    let grantedHeroName: string | undefined = undefined;
    let newHeroTickets = gameState.heroTickets;
    let newItemTickets = gameState.itemTickets;
    if (stage.isBoss && isFirstTime) {
      newHeroTickets += 1; newItemTickets += 2;
      const availableHeroes = HERO_POOL.filter(h => !newHeroList.some(existing => existing.name === h.name));
      if (availableHeroes.length > 0) {
        const randomHero = availableHeroes[Math.floor(Math.random() * availableHeroes.length)];
        const heroInstance = { ...randomHero, id: `hero-${Date.now()}` };
        newHeroList.push(heroInstance);
        grantedHeroName = randomHero.name;
      }
    }
    const updatedParty = gameState.party.map(hero => {
      let h = { ...hero, exp: hero.exp + expWon };
      while (h.exp >= h.maxExp) {
        h.exp -= h.maxExp; h.level += 1; h.maxExp = Math.floor(h.maxExp * 1.3); // Increased XP needed for level up (was 1.25)
        h.maxHp += 5; h.hp = h.maxHp; h.attack += 0.8; h.defense += 0.4; // NERFED: Slower stat gains (was 6, 1, 0.5)
      }
      return h;
    });
    const newUnlocked = Array.from(new Set([...gameState.unlockedStages, nextStageId]));
    setGameState(prev => ({ 
      ...prev, party: updatedParty, allHeroes: newHeroList, shards: prev.shards + shardsWon,
      heroTickets: newHeroTickets, itemTickets: newItemTickets, totalAccountExp: prev.totalAccountExp + expWon,
      unlockedStages: newUnlocked, screen: GameScreen.VICTORY
    }));
    setShowRewards({ exp: expWon, shards: shardsWon, newHero: grantedHeroName });
  };

  const navigateTo = (screen: GameScreen) => { 
    soundService.play('CLICK'); 
    setGameState(prev => {
      // If we are initiating combat, mark stage as attempted
      let attemptedStages = prev.attemptedStages;
      if (screen === GameScreen.BATTLE && prev.currentStage && !attemptedStages.includes(prev.currentStage.id)) {
        attemptedStages = [...attemptedStages, prev.currentStage.id];
      }
      return { ...prev, screen, attemptedStages };
    }); 
  };

  const onUpdateInventory = (updatedInventory: Equipment[]) => {
    setGameState(prev => ({...prev, inventory: updatedInventory}));
  };

  return (
    <div className="w-full h-screen bg-black text-white font-sans overflow-hidden flex flex-col">
      <div ref={cursorRef} className="virtual-cursor flex items-center justify-center" style={{ position: 'fixed', top: 0, left: 0, transform: 'translate3d(-100px, -100px, 0)' }}>
        <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute inset-0 border border-violet-500/30 rounded-full animate-ping opacity-20"></div>
            <div className="w-5 h-5 rotate-45 border-2 border-violet-400 bg-violet-600/10 shadow-[0_0_15px_rgba(139,92,246,0.6)]"></div>
            <div className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_5px_#fff] z-10"></div>
        </div>
      </div>

      {showSaveIndicator && gameState.screen !== GameScreen.LORE_INTRO && gameState.screen !== GameScreen.TITLE && (
        <div className="fixed top-4 right-4 z-[200] flex items-center gap-2 bg-slate-900/80 border border-violet-500/30 px-3 py-1.5 rounded-full backdrop-blur-md animate-in slide-in-from-top-4 fade-in duration-500">
           <i className="fas fa-circle-nodes text-violet-400 text-[10px] animate-spin"></i>
           <span className="text-[8px] font-black font-cinzel text-white uppercase tracking-widest">Timeline Secured</span>
        </div>
      )}

      {showSettings && (
        <SettingsModal 
          settings={gameState.settings} 
          onUpdateSettings={(s) => setGameState(p => ({...p, settings: s}))} 
          onExport={() => {}} onImport={() => {}}
          onClose={() => { soundService.play('CLICK'); setShowSettings(false); }} 
        />
      )}

      <div className="flex-1 relative overflow-hidden">
        <TransitionGroup component={null}>
          <CSSTransition nodeRef={screenRef} key={gameState.screen} classNames="screen-transition" timeout={600}>
            <div ref={screenRef} className="absolute inset-0"> {/* Wrapper div for consistent positioning */}
              {gameState.screen === GameScreen.LORE_INTRO && ( <LoreIntro onComplete={() => navigateTo(GameScreen.TITLE)} /> )}
              {gameState.screen === GameScreen.TITLE && (
                <TitleScreen 
                  onStart={startGame} 
                  onNewGame={startNewGame}
                  onOpenSettings={() => { soundService.play('CLICK'); setShowSettings(true); }}
                  saveData={{ shards: gameState.shards, exp: gameState.totalAccountExp, lastSaved: gameState.lastSaved, exists: gameState.totalAccountExp > 0 || gameState.unlockedStages.length > 1 }} 
                />
              )}
              
              {gameState.screen === GameScreen.CHAPTER_SELECT && (
                <ChapterSelect 
                  stages={stages} 
                  onSelectChapter={selectChapter} 
                  onBack={() => navigateTo(GameScreen.TITLE)} 
                  shards={gameState.shards} 
                  currentEnergy={gameState.currentEnergy}
                  maxEnergy={MAX_ENERGY}
                  onReplenishEnergy={replenishEnergy}
                />
              )}

              {/* Fix: Changed GameGameScreen to GameScreen */}
              {gameState.screen === GameScreen.MAP && (
                <div className="relative h-full">
                  <StageSelect 
                    stages={stages.filter(s => s.chapterId === gameState.currentChapterId)} 
                    onSelectStage={selectStage} 
                    onBackToTitle={() => navigateTo(GameScreen.CHAPTER_SELECT)}
                    shards={gameState.shards} 
                    currentEnergy={gameState.currentEnergy}
                    maxEnergy={MAX_ENERGY}
                    onReplenishEnergy={replenishEnergy}
                  />
                  <div className="fixed bottom-24 right-8 flex flex-col gap-4 z-20">
                    <button onClick={() => navigateTo(GameScreen.ENEMY_INDEX)} className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center border-2 border-emerald-400 hover:scale-110 active:scale-95 transition-all shadow-lg"><i className="fas fa-eye text-2xl"></i></button>
                    <button onClick={() => navigateTo(GameScreen.GACHA)} className="w-16 h-16 bg-gradient-to-br from-blue-700 to-indigo-900 rounded-full flex items-center justify-center border-2 border-blue-400 hover:scale-110 active:scale-95 transition-all relative overflow-hidden group">
                      <div className="absolute inset-0 border-2 border-dashed border-blue-300/20 rounded-full animate-[spin_4s_linear_infinite] group-hover:border-blue-300/40"></div>
                      <div className="relative z-10 flex flex-col items-center">
                        <i className="fas fa-portal-enter text-2xl text-blue-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"></i>
                        <span className="text-[6px] font-black font-cinzel tracking-tighter text-blue-200 mt-0.5">SUMMON</span>
                      </div>
                    </button>
                    <button onClick={() => navigateTo(GameScreen.HERO_MANAGEMENT)} className="w-16 h-16 bg-violet-600 rounded-full flex items-center justify-center border-2 border-violet-400 hover:scale-110 active:scale-95 transition-all shadow-lg"><i className="fas fa-shield-halved text-2xl"></i></button>
                  </div>
                </div>
              )}

              {gameState.screen === GameScreen.STORY_INTRO && gameState.currentStage && (
                <StoryIntro 
                  stage={gameState.currentStage} 
                  dialogue={gameState.storyDialogue} 
                  isNarrating={isNarrating} 
                  isAttempted={gameState.attemptedStages.includes(gameState.currentStage.id)}
                  onDeploy={handleDeployToBattle} 
                  onBack={() => navigateTo(GameScreen.MAP)} 
                  currentEnergy={gameState.currentEnergy}
                />
              )}

              {gameState.screen === GameScreen.BATTLE && gameState.currentStage && (
                <BattleScene heroes={gameState.party} waves={gameState.currentStage.waves} onVictory={onVictory} onDefeat={() => { soundService.play('DEFEAT'); navigateTo(GameScreen.DEFEAT); }} onRetreat={() => navigateTo(GameScreen.MAP)} stageName={gameState.currentStage.name} shards={gameState.shards} settings={gameState.settings} />
              )}

              {gameState.screen === GameScreen.ENEMY_INDEX && <EnemyIndex stages={stages} onClose={() => navigateTo(GameScreen.MAP)} />}
              {gameState.screen === GameScreen.GACHA && (
                <GachaSystem 
                  shards={gameState.shards} heroTickets={gameState.heroTickets} itemTickets={gameState.itemTickets}
                  onAddTickets={(types) => setGameState(p => {
                    const cost = types.length * 100; if (p.shards < cost) return p;
                    let newHero = p.heroTickets; let newItem = p.itemTickets;
                    types.forEach(t => { if (t === 'ECHO') newHero++; else newItem++; });
                    return { ...p, shards: p.shards - cost, heroTickets: newHero, itemTickets: newItem };
                  })}
                  onConsumeTickets={(type, count) => setGameState(p => ({ ...p, heroTickets: type === 'CHARACTER' ? p.heroTickets - count : p.heroTickets, itemTickets: type === 'ITEM' ? p.itemTickets - count : p.itemTickets, }))}
                  onObtainItems={(items) => setGameState(p => ({ ...p, inventory: [...p.inventory, ...items] }))} 
                  onObtainHeroes={(heroes) => setGameState(p => { const nl = [...p.allHeroes]; heroes.forEach(h => { if (!nl.find(e => e.name === h.name)) nl.push(h); }); return { ...p, allHeroes: nl }; })} 
                  onClose={() => navigateTo(GameScreen.MAP)} 
                />
              )}
              {gameState.screen === GameScreen.HERO_MANAGEMENT && <HeroManagement allHeroes={gameState.allHeroes} activeParty={gameState.party} inventory={gameState.inventory} shards={gameState.shards} onUpdateHero={(h) => setGameState(p => { const nl = p.allHeroes.map(u => u.id === h.id ? h : u); const np = p.party.map(u => u.id === h.id ? h : u); return { ...p, allHeroes: nl, party: np }; })} onUpdateParty={(party) => setGameState(p => ({ ...p, party }))} onSpendShards={(amt) => setGameState(p => ({ ...p, shards: p.shards - amt }))} onUpdateInventory={onUpdateInventory} onClose={() => navigateTo(GameScreen.MAP)} />}
              {gameState.screen === GameScreen.VICTORY && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 animate-in fade-in duration-700">
                  <div className="max-w-2xl w-full flex flex-col items-center">
                    <div className="text-emerald-400 font-cinzel text-2xl tracking-[1em] uppercase mb-4 animate-pulse">Signature Secured</div>
                    <h1 className="text-8xl font-black font-cinzel text-white text-glow mb-12 tracking-widest uppercase italic">VICTORY</h1>
                    <div className="grid grid-cols-2 gap-8 w-full mb-16">
                        <div className="glass p-8 rounded-3xl border-emerald-500/20 text-center">
                          <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Mastery Gains</div>
                          <div className="text-4xl font-mono text-emerald-400 font-bold">+{showRewards?.exp.toLocaleString()}</div>
                        </div>
                        <div className="glass p-8 rounded-3xl border-violet-500/20 text-center">
                          <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Void Essence</div>
                          <div className="text-4xl font-mono text-violet-400 font-bold">+{showRewards?.shards.toLocaleString()}</div>
                        </div>
                    </div>
                    {showRewards?.newHero && ( <div className="mb-12 flex flex-col items-center animate-bounce"> <div className="text-amber-400 font-black font-cinzel text-xs tracking-widest uppercase mb-4">New Echo Resonated!</div> <div className="text-3xl font-cinzel text-white font-bold">{showRewards.newHero}</div> </div> )}
                    <button onClick={() => navigateTo(GameScreen.MAP)} className="px-24 py-6 bg-white text-slate-950 font-black font-cinzel tracking-widest rounded-[2rem] hover:bg-emerald-500 hover:text-white transition-all active:scale-95 shadow-2xl text-xl uppercase" > Return to Archive </button>
                  </div>
                </div>
              )}
              {gameState.screen === GameScreen.DEFEAT && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-red-950/20 backdrop-blur-3xl p-4 animate-in fade-in duration-1000">
                  <div className="max-w-xl w-full flex flex-col items-center text-center">
                      <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center mb-8 border border-red-500/30 text-red-500 text-4xl animate-pulse"> <i className="fas fa-skull"></i> </div>
                      <h1 className="text-7xl font-black font-cinzel text-white mb-6 tracking-widest uppercase italic">TIMELINE COLLAPSE</h1>
                      <p className="text-slate-400 mb-12 font-cinzel italic leading-relaxed">"The singularity has claimed your echoes. This timeline is no longer viable."</p>
                      <button onClick={() => navigateTo(GameScreen.MAP)} className="px-20 py-5 bg-red-600 hover:bg-red-500 text-white font-black font-cinzel tracking-widest rounded-2xl transition-all active:scale-95 shadow-xl text-lg uppercase" > Recalibrate (Try Again) </button>
                  </div>
                </div>
              )}
            </div>
          </CSSTransition>
        </TransitionGroup>
      </div>

      <DailyReward claimed={!showDaily} onClaim={claimDaily} totalClaims={gameState.totalDailyClaims} />
      <div className="scanline"></div>
    </div>
  );
};

export default App;

import React, { useState, useEffect, useRef } from 'react';
import { Equipment, Unit, Rarity } from '../types';
import { GACHA_POOL, HERO_POOL } from '../constants';
import { soundService } from '../services/soundService';

interface GachaSystemProps {
  shards: number;
  heroTickets: number;
  itemTickets: number;
  onAddTickets: (types: ('ECHO' | 'ACCESSORY')[]) => void;
  onConsumeTickets: (type: 'CHARACTER' | 'ITEM', count: number) => void;
  onObtainItems: (items: Equipment[]) => void;
  onObtainHeroes: (heroes: Unit[]) => void;
  onClose: () => void;
}

type GachaType = 'ITEM' | 'CHARACTER' | 'CONVERT';

const GachaSystem: React.FC<GachaSystemProps> = ({ shards, heroTickets, itemTickets, onAddTickets, onConsumeTickets, onObtainItems, onObtainHeroes, onClose }) => {
  const [resultsQueue, setResultsQueue] = useState<(Equipment | Unit)[]>([]);
  const [currentRevealIdx, setCurrentRevealIdx] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [activeTab, setActiveTab] = useState<GachaType>('CHARACTER');
  const [isConverting, setIsConverting] = useState(false);
  
  const [manifestedTickets, setManifestedTickets] = useState<('ECHO' | 'ACCESSORY')[]>([]);
  const [showManifestation, setShowManifestation] = useState(false);

  const rollOne = (type: 'ITEM' | 'CHARACTER') => {
    let roll = Math.random() * 100;
    let pool: (Equipment | Unit)[] = [];
    let selectedRarity: Rarity = 'RARE';

    if (roll < 0.5) selectedRarity = 'INSANE';
    else if (roll < 2.5) selectedRarity = 'UBER_SUPER_RARE';
    else if (roll < 10) selectedRarity = 'LEGENDARY';
    else if (roll < 30) selectedRarity = 'EPIC';
    else selectedRarity = 'RARE';

    if (type === 'ITEM') {
      pool = GACHA_POOL.filter(i => i.rarity === selectedRarity);
      if (pool.length === 0) pool = GACHA_POOL.filter(i => i.rarity === 'RARE');
      const item = pool[Math.floor(Math.random() * pool.length)] as Equipment;
      return { ...item, id: `${item.id}-${Date.now()}-${Math.random()}` };
    } else {
      pool = HERO_POOL.filter(h => h.rarity === selectedRarity);
      if (pool.length === 0) pool = HERO_POOL.filter(h => h.rarity === 'RARE');
      const hero = pool[Math.floor(Math.random() * pool.length)] as Unit;
      return { ...hero, id: `${hero.id}-${Date.now()}-${Math.random()}` };
    }
  };

  const startRollProcess = (count: number) => {
    const currentTickets = activeTab === 'ITEM' ? itemTickets : heroTickets;
    if (currentTickets < count) return;
    
    const currentRollType = activeTab === 'CHARACTER' ? 'CHARACTER' : 'ITEM';
    soundService.play('SUMMON');
    onConsumeTickets(currentRollType, count);
    setIsRolling(true);

    setTimeout(() => {
      const newItems: (Equipment | Unit)[] = [];
      for (let i = 0; i < count; i++) {
        newItems.push(rollOne(activeTab === 'CHARACTER' ? 'CHARACTER' : 'ITEM'));
      }
      setResultsQueue(newItems);
      setCurrentRevealIdx(0);
      setIsRolling(false);
      
      // Play sound for the first revealed item
      playRaritySound(newItems[0].rarity);
    }, 1200);
  };

  const playRaritySound = (rarity?: Rarity) => {
    if (rarity === 'INSANE' || rarity === 'UBER_SUPER_RARE' || rarity === 'LEGENDARY') {
      soundService.play('LEGEND_GET');
    } else if (rarity === 'EPIC') {
      soundService.play('RARE_GET');
    } else {
      soundService.play('CLICK');
    }
  };

  const finalizeRoll = () => {
    if (activeTab === 'ITEM') {
      onObtainItems(resultsQueue as Equipment[]);
    } else {
      onObtainHeroes(resultsQueue as Unit[]);
    }
    setResultsQueue([]);
    setCurrentRevealIdx(null);
  };

  const nextReveal = () => {
    if (currentRevealIdx !== null && currentRevealIdx < resultsQueue.length - 1) {
      const nextIdx = currentRevealIdx + 1;
      setCurrentRevealIdx(nextIdx);
      playRaritySound(resultsQueue[nextIdx].rarity);
    } else {
      finalizeRoll();
    }
  };

  const skipReveal = () => {
    soundService.play('CLICK');
    finalizeRoll();
  };

  const handleConversion = (count: number) => {
    const cost = count * 100;
    if (shards < cost) return;
    
    setIsConverting(true);
    
    const newTickets = Array.from({ length: count }, () => 
      Math.random() > 0.5 ? 'ECHO' : 'ACCESSORY'
    ) as ('ECHO' | 'ACCESSORY')[];
    
    setManifestedTickets(newTickets);
    
    setTimeout(() => {
      onAddTickets(newTickets);
      setShowManifestation(true);
      setIsConverting(false);
      soundService.play('MAGIC');
    }, 1200);
  };

  const getRarityStyles = (rarity?: Rarity) => {
    switch (rarity) {
      case 'INSANE': return 'from-red-600 via-purple-600 to-red-600 border-red-400 text-red-100 shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse';
      case 'UBER_SUPER_RARE': return 'from-purple-600 via-fuchsia-500 to-purple-600 border-purple-400 text-purple-100 shadow-[0_0_20px_rgba(168,85,247,0.5)]';
      case 'LEGENDARY': return 'from-amber-600 to-orange-500 border-amber-300 text-amber-50';
      case 'EPIC': return 'from-blue-600 to-cyan-500 border-blue-300 text-blue-50';
      default: return 'from-slate-700 to-slate-800 border-slate-500 text-slate-300';
    }
  };

  const probabilities = [
    { label: 'INSANE', chance: '0.5%', color: 'bg-red-500' },
    { label: 'UBER', chance: '2.0%', color: 'bg-purple-500' },
    { label: 'LEGEND', chance: '7.5%', color: 'bg-amber-500' },
    { label: 'EPIC', chance: '20%', color: 'bg-blue-500' },
    { label: 'RARE', chance: '70%', color: 'bg-slate-600' },
  ];

  return (
    <div className="fixed inset-0 z-[150] bg-slate-950 flex flex-col items-center overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
      
      <header className="relative z-10 w-full p-4 md:p-6 flex justify-between items-center bg-slate-900/60 backdrop-blur-md border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-slate-950 border border-slate-800 rounded-xl hover:border-red-500/50 hover:text-red-400 transition-all active:scale-90">
            <i className="fas fa-arrow-left text-sm md:text-base"></i>
          </button>
          <div className="min-w-0">
            <h2 className="text-lg md:text-2xl font-cinzel font-black tracking-widest text-white uppercase truncate">Core</h2>
            <div className="flex gap-2 md:gap-4 mt-0.5 overflow-x-auto no-scrollbar">
               <div className="flex items-center gap-1.5 text-[8px] md:text-[9px] font-mono text-violet-400 font-bold whitespace-nowrap">
                 <i className="fas fa-gem"></i> {shards}
               </div>
               <div className="flex items-center gap-1.5 text-[8px] md:text-[9px] font-mono text-blue-400 font-bold whitespace-nowrap">
                 <i className="fas fa-ticket"></i> {heroTickets}
               </div>
               <div className="flex items-center gap-1.5 text-[8px] md:text-[9px] font-mono text-emerald-400 font-bold whitespace-nowrap">
                 <i className="fas fa-ticket-simple"></i> {itemTickets}
               </div>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="px-4 py-2 bg-red-950/20 border border-red-900/30 text-red-500 rounded-lg text-[10px] font-black font-cinzel tracking-widest hover:bg-red-500 hover:text-white transition-all">EXIT</button>
      </header>

      <nav className="relative z-10 flex w-full border-b border-white/5 bg-slate-900/30 h-12 md:h-16 flex-shrink-0">
         {(['CHARACTER', 'ITEM', 'CONVERT'] as const).map(tab => (
           <button 
             key={tab}
             onClick={() => { soundService.play('CLICK'); setActiveTab(tab as any); }}
             className={`flex-1 font-cinzel text-[9px] md:text-xs font-black tracking-[0.2em] transition-all uppercase ${activeTab === tab ? 'text-violet-400 border-b-2 border-violet-500 bg-violet-500/5' : 'text-slate-500 hover:text-slate-300'}`}
           >
             {tab === 'CHARACTER' ? 'Echoes' : tab === 'ITEM' ? 'Relics' : 'Convert'}
           </button>
         ))}
      </nav>

      <main className="relative z-10 flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col items-center justify-center p-6 md:p-12">
        {activeTab !== 'CONVERT' ? (
          <div className="max-w-4xl w-full flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
             
             {/* Rarity Probability Bar */}
             <div className="w-full max-w-md mb-8">
                <div className="flex justify-between items-center mb-2 px-1">
                   <span className="text-[8px] font-black font-cinzel text-slate-500 uppercase tracking-widest">Drop Probabilities</span>
                   <i className="fas fa-circle-info text-slate-700 text-[10px]"></i>
                </div>
                <div className="w-full h-3 flex rounded-full overflow-hidden border border-white/5 shadow-inner">
                   {probabilities.map((p, i) => (
                      <div 
                        key={i} 
                        className={`${p.color} h-full transition-all relative group`} 
                        style={{ width: p.chance.replace('%','') === '0.5' ? '2%' : p.chance }}
                      >
                         <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/20 transition-opacity flex items-center justify-center">
                            <span className="text-[6px] font-black text-white">{p.label}</span>
                         </div>
                      </div>
                   ))}
                </div>
                <div className="flex justify-between mt-2 overflow-x-auto no-scrollbar gap-2 px-1">
                   {probabilities.map((p, i) => (
                      <div key={i} className="flex items-center gap-1 flex-shrink-0">
                         <div className={`w-1.5 h-1.5 rounded-full ${p.color}`}></div>
                         <span className="text-[7px] font-black text-slate-500 uppercase">{p.label} {p.chance}</span>
                      </div>
                   ))}
                </div>
             </div>

             <div className="mb-8 md:mb-12 relative">
                <div className={`w-40 h-40 md:w-64 md:h-64 rounded-full border-4 border-dashed animate-[spin_20s_linear_infinite] ${activeTab === 'CHARACTER' ? 'border-violet-500/30' : 'border-blue-500/30'}`}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className={`w-28 h-28 md:w-44 md:h-44 rounded-full bg-gradient-to-br flex items-center justify-center shadow-2xl transition-all duration-500 ${isRolling ? 'scale-125 animate-pulse' : 'scale-100'} ${activeTab === 'CHARACTER' ? 'from-violet-600 to-purple-900 border-violet-400' : 'from-blue-600 to-indigo-900 border-blue-400'} border-4`}>
                      <i className={`fas ${activeTab === 'CHARACTER' ? 'fa-portal-enter' : 'fa-wand-sparkles'} text-3xl md:text-6xl text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]`}></i>
                   </div>
                </div>
             </div>

             <h3 className="text-xl md:text-3xl font-cinzel text-white font-black tracking-[0.3em] uppercase mb-4">
                {activeTab === 'CHARACTER' ? 'Dimensional Echoes' : 'Starlight Relics'}
             </h3>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md mt-6">
                <button 
                  onClick={() => startRollProcess(1)}
                  disabled={isRolling || (activeTab === 'CHARACTER' ? heroTickets < 1 : itemTickets < 1)}
                  className="group relative py-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-white transition-all disabled:opacity-30"
                >
                  <div className="text-[9px] font-black font-cinzel text-slate-500 uppercase tracking-widest mb-1 group-hover:text-white">Single Draw</div>
                  <div className="flex items-center justify-center gap-2 font-mono text-lg font-bold">
                    <i className={`fas ${activeTab === 'CHARACTER' ? 'fa-ticket text-blue-400' : 'fa-ticket-simple text-emerald-400'}`}></i>
                    <span>1</span>
                  </div>
                </button>
                <button 
                  onClick={() => startRollProcess(10)}
                  disabled={isRolling || (activeTab === 'CHARACTER' ? heroTickets < 10 : itemTickets < 10)}
                  className="group relative py-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-white transition-all disabled:opacity-30 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-violet-600 text-[7px] font-black px-1.5 py-0.5 rounded-bl uppercase">Bonus</div>
                  <div className="text-[9px] font-black font-cinzel text-slate-500 uppercase tracking-widest mb-1 group-hover:text-white">Ten Draw</div>
                  <div className="flex items-center justify-center gap-2 font-mono text-lg font-bold">
                    <i className={`fas ${activeTab === 'CHARACTER' ? 'fa-ticket text-blue-400' : 'fa-ticket-simple text-emerald-400'}`}></i>
                    <span>10</span>
                  </div>
                </button>
             </div>
          </div>
        ) : (
          <div className="max-w-2xl w-full flex flex-col gap-6 animate-in slide-in-from-bottom-8 duration-500 items-center">
             <div className="text-center mb-4">
                <h3 className="text-xl md:text-4xl font-cinzel text-white font-black tracking-widest uppercase mb-2">Synthesis</h3>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Convert shards into void signatures</p>
             </div>

             <div className="glass p-6 md:p-12 rounded-[2rem] border-slate-800 flex flex-col items-center gap-6 md:gap-10 w-full max-w-sm shadow-2xl">
                <div className="flex items-center justify-center gap-6">
                   <div className="w-12 h-12 md:w-20 md:h-20 bg-blue-900/20 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400 text-2xl">
                     <i className="fas fa-ticket"></i>
                   </div>
                   <div className="w-6 h-6 flex items-center justify-center text-slate-700">
                      <i className="fas fa-shuffle"></i>
                   </div>
                   <div className="w-12 h-12 md:w-20 md:h-20 bg-emerald-900/20 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 text-2xl">
                     <i className="fas fa-ticket-simple"></i>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-3 w-full">
                  <button 
                    onClick={() => handleConversion(1)}
                    disabled={shards < 100 || isConverting}
                    className="w-full py-4 bg-slate-900 border border-slate-700 rounded-xl text-[10px] font-black font-cinzel uppercase transition-all flex flex-col items-center group"
                  >
                    <span className="text-white group-hover:text-violet-400">Synthesize x1</span>
                    <span className="text-[7px] font-mono text-slate-500">100 SHARDS</span>
                  </button>
                  <button 
                    onClick={() => handleConversion(10)}
                    disabled={shards < 1000 || isConverting}
                    className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-[10px] font-black font-cinzel uppercase transition-all flex flex-col items-center"
                  >
                    <span>Synthesize x10</span>
                    <span className="text-[7px] font-mono text-violet-200 opacity-80">1000 SHARDS</span>
                  </button>
                </div>
             </div>
          </div>
        )}
      </main>

      {currentRevealIdx !== null && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center overflow-y-auto custom-scrollbar p-6 pt-12 pb-32 animate-in fade-in duration-500">
           <div className={`absolute inset-0 bg-gradient-to-b opacity-20 pointer-events-none transition-all duration-1000 ${getRarityStyles(resultsQueue[currentRevealIdx].rarity)}`}></div>
           
           <div className="relative z-10 flex flex-col items-center max-w-lg w-full mb-auto">
              <div className="mb-4 text-slate-500 font-mono text-[9px] uppercase tracking-[0.4em] opacity-50">ENTITY {currentRevealIdx + 1}/{resultsQueue.length}</div>
              
              <div className={`w-56 h-56 md:w-80 md:h-80 rounded-3xl border-4 overflow-hidden shadow-2xl relative mb-8 animate-in zoom-in duration-500 ${getRarityStyles(resultsQueue[currentRevealIdx].rarity)}`}>
                 <img src={(resultsQueue[currentRevealIdx] as any).sprite || `https://picsum.photos/seed/${resultsQueue[currentRevealIdx].id}/400/400`} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                 <div className="absolute bottom-4 left-4">
                    <div className="text-[8px] font-black uppercase tracking-widest text-white/60 mb-1">{(resultsQueue[currentRevealIdx] as any).trait || 'COMMON'}</div>
                    <div className="text-xl md:text-2xl font-cinzel font-black text-white uppercase">{resultsQueue[currentRevealIdx].name}</div>
                 </div>
              </div>

              <div className="text-center mb-8">
                 <div className={`text-lg md:text-2xl font-cinzel font-black tracking-[0.4em] uppercase mb-2 rarity-splash ${getRarityStyles(resultsQueue[currentRevealIdx].rarity).split(' ')[3]}`}>
                   {resultsQueue[currentRevealIdx].rarity?.replace(/_/g, ' ') || 'COMMON'}
                 </div>
                 <p className="text-slate-400 text-xs italic max-w-xs mx-auto">"{(resultsQueue[currentRevealIdx] as any).description || 'A unique signature manifest.'}"</p>
              </div>
           </div>

           <div className="fixed bottom-0 left-0 w-full p-6 md:p-10 flex flex-col gap-3 bg-gradient-to-t from-black via-black/80 to-transparent z-20">
              <button 
                onClick={nextReveal}
                className="w-full py-4 bg-white text-black font-black font-cinzel tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_#fff]"
              >
                {currentRevealIdx === resultsQueue.length - 1 ? 'CONCLUDE' : 'NEXT'}
              </button>
              {resultsQueue.length > 1 && currentRevealIdx < resultsQueue.length - 1 && (
                <button onClick={skipReveal} className="text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors py-2">Skip All</button>
              )}
           </div>
        </div>
      )}

      {showManifestation && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center overflow-y-auto custom-scrollbar p-6 pt-12 pb-32 animate-in fade-in duration-500">
           <div className="max-w-md w-full flex flex-col items-center mb-auto">
              <h2 className="text-xl md:text-3xl font-cinzel text-white font-black tracking-widest uppercase mb-12 text-center">Synthesis Completed</h2>
              <div className="flex flex-wrap justify-center gap-3 mb-16">
                 {manifestedTickets.map((type, i) => (
                   <div key={i} className={`w-14 h-20 md:w-20 md:h-28 rounded-xl border-2 flex flex-col items-center justify-center gap-2 animate-in zoom-in ${type === 'ECHO' ? 'bg-blue-900/20 border-blue-500/40 text-blue-400' : 'bg-emerald-900/20 border-emerald-500/40 text-emerald-400'}`} style={{ animationDelay: `${i * 30}ms` }}>
                      <i className={`fas ${type === 'ECHO' ? 'fa-ticket' : 'fa-ticket-simple'} text-lg md:text-2xl`}></i>
                      <span className="text-[6px] md:text-[8px] font-black uppercase">{type}</span>
                   </div>
                 ))}
              </div>
           </div>
           <div className="fixed bottom-0 left-0 w-full p-6 md:p-10 bg-gradient-to-t from-black via-black/80 to-transparent z-20">
              <button 
                onClick={() => { setShowManifestation(false); setManifestedTickets([]); }}
                className="w-full py-4 border-2 border-white/10 text-white font-black font-cinzel tracking-widest rounded-2xl hover:bg-white hover:text-black transition-all active:scale-95 uppercase"
              >
                Acknowledge
              </button>
           </div>
        </div>
      )}

      {isRolling && (
        <div className="fixed inset-0 z-[300] bg-slate-950 flex flex-col items-center justify-center animate-in fade-in duration-300">
           <div className="w-16 h-16 rounded-full border-4 border-white/5 border-t-violet-500 animate-spin"></div>
           <div className="mt-8 text-center px-6">
              <h3 className="text-lg font-cinzel text-white font-black tracking-widest uppercase animate-pulse">Piercing the Void</h3>
           </div>
        </div>
      )}

      {isConverting && (
        <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
           <div className="w-48 h-1 bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-violet-600 animate-[loading_1.5s_infinite]"></div>
           </div>
           <div className="mt-4 text-[9px] text-violet-400 font-black uppercase tracking-widest font-cinzel">Recalibrating Essence...</div>
           <style>{`
             @keyframes loading {
               0% { width: 0; margin-left: 0; }
               50% { width: 100%; margin-left: 0; }
               100% { width: 0; margin-left: 100%; }
             }
           `}</style>
        </div>
      )}
    </div>
  );
};

export default GachaSystem;

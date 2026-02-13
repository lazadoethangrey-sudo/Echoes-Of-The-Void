
import React, { useState, useMemo } from 'react';
import { Equipment, Unit, Rarity, Trait } from '../types';
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
  const [showSummary, setShowSummary] = useState(false);
  
  const [manifestedTickets, setManifestedTickets] = useState<('ECHO' | 'ACCESSORY')[]>([]);
  const [showManifestation, setShowManifestation] = useState(false);

  const getRarityValue = (r?: Rarity) => {
    const values: Record<string, number> = { 'RARE': 1, 'EPIC': 2, 'LEGENDARY': 3, 'UBER_SUPER_RARE': 4, 'INSANE': 5 };
    return values[r || 'RARE'] || 1;
  };

  const rollOne = (type: 'ITEM' | 'CHARACTER') => {
    let roll = Math.random() * 100;
    let selectedRarity: Rarity = 'RARE';

    if (roll < 0.5) selectedRarity = 'INSANE';
    else if (roll < 2.5) selectedRarity = 'UBER_SUPER_RARE';
    else if (roll < 10) selectedRarity = 'LEGENDARY';
    else if (roll < 30) selectedRarity = 'EPIC';
    else selectedRarity = 'RARE';

    if (type === 'ITEM') {
      const pool = GACHA_POOL.filter(i => i.rarity === selectedRarity);
      const item = (pool.length > 0 ? pool : GACHA_POOL.filter(i => i.rarity === 'RARE'))[Math.floor(Math.random() * pool.length)] as Equipment;
      return { ...item, id: `${item.id}-${Date.now()}-${Math.random()}` };
    } else {
      const pool = HERO_POOL.filter(h => h.rarity === selectedRarity);
      const hero = (pool.length > 0 ? pool : HERO_POOL.filter(h => h.rarity === 'RARE'))[Math.floor(Math.random() * pool.length)] as Unit;
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

    // Initial cinematic wait
    setTimeout(() => {
      const newItems: (Equipment | Unit)[] = [];
      for (let i = 0; i < count; i++) {
        newItems.push(rollOne(activeTab === 'CHARACTER' ? 'CHARACTER' : 'ITEM'));
      }
      setResultsQueue(newItems);
      setCurrentRevealIdx(0);
      setIsRolling(false);
      playRaritySound(newItems[0].rarity);
    }, 2500); // Longer wait for the streak animation
  };

  const playRaritySound = (rarity?: Rarity) => {
    if (getRarityValue(rarity) >= 3) {
      soundService.play('LEGEND_GET');
    } else if (getRarityValue(rarity) === 2) {
      soundService.play('RARE_GET');
    } else {
      soundService.play('CLICK');
    }
  };

  const concludeGacha = () => {
    if (activeTab === 'ITEM') {
      onObtainItems(resultsQueue as Equipment[]);
    } else {
      onObtainHeroes(resultsQueue as Unit[]);
    }
    setResultsQueue([]);
    setCurrentRevealIdx(null);
    setShowSummary(false);
  };

  const nextReveal = () => {
    if (currentRevealIdx !== null && currentRevealIdx < resultsQueue.length - 1) {
      const nextIdx = currentRevealIdx + 1;
      setCurrentRevealIdx(nextIdx);
      playRaritySound(resultsQueue[nextIdx].rarity);
    } else {
      if (resultsQueue.length > 1) {
        setShowSummary(true);
        setCurrentRevealIdx(null);
      } else {
        concludeGacha();
      }
    }
  };

  // Fix: Added handleConversion function to handle ticket synthesis from shards
  const handleConversion = (count: number) => {
    setIsConverting(true);
    soundService.play('MAGIC');
    
    // Simulate process
    setTimeout(() => {
      const tickets: ('ECHO' | 'ACCESSORY')[] = [];
      for (let i = 0; i < count; i++) {
        // Evenly distribute between character and item tickets
        tickets.push(i % 2 === 0 ? 'ECHO' : 'ACCESSORY');
      }
      onAddTickets(tickets);
      setManifestedTickets(tickets);
      setShowManifestation(true);
      setIsConverting(false);
    }, 1500);
  };

  const getRarityColor = (rarity?: Rarity) => {
    switch (rarity) {
      case 'INSANE': return 'from-red-600 to-purple-600';
      case 'UBER_SUPER_RARE': return 'from-purple-600 to-fuchsia-400';
      case 'LEGENDARY': return 'from-amber-400 to-orange-500';
      case 'EPIC': return 'from-blue-400 to-indigo-600';
      default: return 'from-slate-500 to-slate-700';
    }
  };

  const getTraitIcon = (trait?: Trait) => {
    switch(trait) {
      case 'VOID': return 'fa-circle-notch';
      case 'CRIMSON': return 'fa-fire';
      case 'AETHER': return 'fa-wind';
      case 'STEEL': return 'fa-shield';
      case 'NEBULA': return 'fa-star';
      default: return 'fa-dna';
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-950 flex flex-col items-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e1b4b_0%,#020617_100%)] opacity-40"></div>
      
      {/* Header UI */}
      {!isRolling && currentRevealIdx === null && !showSummary && (
        <header className="relative z-10 w-full p-6 flex justify-between items-center bg-slate-900/40 backdrop-blur-xl border-b border-white/5 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-6">
            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-slate-950 border border-slate-800 rounded-2xl hover:border-violet-500/50 hover:text-violet-400 transition-all active:scale-90">
              <i className="fas fa-chevron-left"></i>
            </button>
            <div>
              <h2 className="text-3xl font-cinzel font-black tracking-widest text-white uppercase leading-none">Singularity</h2>
              <div className="flex gap-4 mt-2">
                 <div className="flex items-center gap-2 text-[10px] font-mono text-violet-400 font-black">
                   <i className="fas fa-gem"></i> {shards.toLocaleString()}
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-mono text-blue-400 font-black">
                   <i className="fas fa-dna"></i> {heroTickets}
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 font-black">
                   <i className="fas fa-microchip"></i> {itemTickets}
                 </div>
              </div>
            </div>
          </div>
          
          <nav className="flex gap-2">
            {(['CHARACTER', 'ITEM', 'CONVERT'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => { soundService.play('CLICK'); setActiveTab(tab); }}
                className={`px-8 py-3 rounded-xl font-cinzel text-[10px] font-black tracking-widest uppercase transition-all border ${activeTab === tab ? 'bg-violet-600 border-violet-400 text-white shadow-lg' : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:text-slate-300'}`}
              >
                {tab === 'CHARACTER' ? 'Echoes' : tab === 'ITEM' ? 'Relics' : 'Convert'}
              </button>
            ))}
          </nav>
        </header>
      )}

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 w-full flex flex-col items-center justify-center p-8">
        {activeTab !== 'CONVERT' && !isRolling && currentRevealIdx === null && !showSummary && (
          <div className="max-w-6xl w-full flex flex-col md:grid md:grid-cols-12 gap-12 items-center animate-in fade-in zoom-in duration-700">
            
            <div className="md:col-span-7 flex flex-col items-start text-left">
              <div className="px-4 py-1.5 bg-violet-600/20 border border-violet-500/30 rounded-lg text-[10px] font-black font-cinzel text-violet-400 tracking-[0.4em] uppercase mb-6">Manifestation Protocol</div>
              <h1 className="text-6xl lg:text-8xl font-black font-cinzel text-white tracking-widest uppercase mb-8 leading-tight">
                {activeTab === 'CHARACTER' ? 'Void\nResonance' : 'Relic\nManifest'}
              </h1>
              <p className="text-slate-500 font-cinzel italic text-lg mb-12 max-w-xl leading-relaxed">
                {activeTab === 'CHARACTER' ? 'Reach into the collapsed timelines to pull forth the echoes of fallen heroes. Every pull strengthens the link to the core.' : 'Retrieve forgotten artifacts from the interstellar data streams to augment your combat units.'}
              </p>
              
              <div className="flex gap-6">
                <button 
                  onClick={() => startRollProcess(1)}
                  disabled={(activeTab === 'CHARACTER' ? heroTickets < 1 : itemTickets < 1)}
                  className="group relative px-12 py-6 bg-slate-900 border-2 border-slate-800 rounded-3xl hover:border-violet-500 hover:bg-violet-950/20 transition-all active:scale-95 disabled:opacity-20 flex flex-col items-center"
                >
                  <span className="text-[10px] font-black font-cinzel text-slate-500 uppercase tracking-widest mb-1 group-hover:text-violet-400">Initiate Manifest</span>
                  <div className="flex items-center gap-2 font-mono text-2xl font-bold text-white">
                    <i className={`fas ${activeTab === 'CHARACTER' ? 'fa-dna text-blue-400' : 'fa-microchip text-emerald-400'}`}></i>
                    <span>x1</span>
                  </div>
                </button>
                <button 
                  onClick={() => startRollProcess(10)}
                  disabled={(activeTab === 'CHARACTER' ? heroTickets < 10 : itemTickets < 10)}
                  className="group relative px-12 py-6 bg-violet-600 border-2 border-violet-400 rounded-3xl hover:bg-violet-500 hover:scale-105 transition-all active:scale-95 disabled:opacity-20 flex flex-col items-center shadow-[0_0_50px_rgba(139,92,246,0.3)]"
                >
                  <div className="absolute -top-3 right-4 bg-emerald-500 text-black text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Guaranteed Epic</div>
                  <span className="text-[10px] font-black font-cinzel text-violet-200 uppercase tracking-widest mb-1">Mass Manifest</span>
                  <div className="flex items-center gap-2 font-mono text-2xl font-bold text-white">
                    <i className={`fas ${activeTab === 'CHARACTER' ? 'fa-dna text-blue-200' : 'fa-microchip text-emerald-200'}`}></i>
                    <span>x10</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="md:col-span-5 flex justify-center items-center">
              <div className="relative w-80 h-80 lg:w-96 lg:h-96">
                <div className={`absolute inset-0 rounded-full border-4 border-dashed animate-[spin_30s_linear_infinite] ${activeTab === 'CHARACTER' ? 'border-blue-500/20' : 'border-emerald-500/20'}`}></div>
                <div className={`absolute inset-8 rounded-full border-2 border-dashed animate-[spin_20s_linear_infinite_reverse] ${activeTab === 'CHARACTER' ? 'border-blue-500/30' : 'border-emerald-500/30'}`}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className={`w-64 h-64 lg:w-80 lg:h-80 rounded-full bg-gradient-to-br from-slate-900 to-black border-4 flex items-center justify-center shadow-[0_0_100px_rgba(139,92,246,0.1)] overflow-hidden group ${activeTab === 'CHARACTER' ? 'border-blue-500/40' : 'border-emerald-500/40'}`}>
                      <i className={`fas ${activeTab === 'CHARACTER' ? 'fa-portal-enter' : 'fa-atom'} text-8xl transition-all duration-1000 group-hover:scale-110 group-hover:rotate-12 ${activeTab === 'CHARACTER' ? 'text-blue-500/60' : 'text-emerald-500/60'}`}></i>
                      <div className="absolute inset-0 bg-gradient-to-t from-violet-500/10 via-transparent to-transparent"></div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cinematic Roll Animation */}
        {isRolling && (
          <div className="fixed inset-0 z-[300] bg-slate-950 flex flex-col items-center justify-center animate-in fade-in duration-500">
             <div className="absolute inset-0 void-tunnel opacity-20"></div>
             <div className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden">
                <div className="animate-streak absolute h-1 w-[600px] bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_50px_#fff] blur-sm" style={{ top: '40%' }}></div>
                <div className="animate-streak absolute h-1 w-[400px] bg-gradient-to-r from-transparent via-violet-400 to-transparent shadow-[0_0_40px_rgba(139,92,246,0.8)] blur-sm" style={{ top: '55%', animationDelay: '0.2s' }}></div>
                <div className="animate-streak absolute h-1 w-[500px] bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_40px_rgba(96,165,250,0.8)] blur-sm" style={{ top: '30%', animationDelay: '0.4s' }}></div>
             </div>
             <div className="absolute bottom-24 text-center animate-pulse">
                <div className="text-white font-cinzel font-black tracking-[0.8em] text-xl uppercase mb-2">Tearing Reality</div>
                <div className="text-violet-500 font-mono text-[9px] uppercase tracking-[0.4em]">Establishing Neural Connection...</div>
             </div>
          </div>
        )}

        {/* Conversion UI */}
        {activeTab === 'CONVERT' && (
          <div className="max-w-xl w-full flex flex-col gap-10 animate-in slide-in-from-bottom-8 duration-500 items-center">
             <div className="text-center">
                <h3 className="text-4xl font-cinzel text-white font-black tracking-widest uppercase mb-4">Core Synthesis</h3>
                <p className="text-sm font-cinzel italic text-slate-500">"Condense Void Essence into stable Manifestation Signatures."</p>
             </div>

             <div className="glass p-12 rounded-[3rem] border-slate-800 flex flex-col items-center gap-12 w-full shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-violet-600/5 pointer-events-none"></div>
                <div className="flex items-center justify-center gap-12">
                   <div className="w-24 h-24 bg-blue-900/20 border-2 border-blue-500/30 rounded-3xl flex items-center justify-center text-blue-400 text-4xl shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                     <i className="fas fa-dna"></i>
                   </div>
                   <div className="flex flex-col items-center">
                      <i className="fas fa-right-left text-slate-800 text-2xl animate-pulse"></i>
                   </div>
                   <div className="w-24 h-24 bg-emerald-900/20 border-2 border-emerald-500/30 rounded-3xl flex items-center justify-center text-emerald-400 text-4xl shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                     <i className="fas fa-microchip"></i>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-4 w-full">
                  <button 
                    onClick={() => handleConversion(1)}
                    disabled={shards < 100 || isConverting}
                    className="w-full py-5 bg-slate-900 border-2 border-slate-800 rounded-2xl text-[10px] font-black font-cinzel uppercase transition-all flex flex-col items-center group hover:border-white"
                  >
                    <span className="text-slate-400 group-hover:text-white">Synthesize Signature x1</span>
                    <span className="text-[8px] font-mono text-slate-600">100 VOID ESSENCE</span>
                  </button>
                  <button 
                    onClick={() => handleConversion(10)}
                    disabled={shards < 1000 || isConverting}
                    className="w-full py-5 bg-violet-600 border-2 border-violet-400 text-white rounded-2xl text-[10px] font-black font-cinzel uppercase transition-all flex flex-col items-center hover:bg-violet-500 shadow-xl"
                  >
                    <span>Synthesize Signature x10</span>
                    <span className="text-[8px] font-mono text-violet-200 opacity-80">1000 VOID ESSENCE</span>
                  </button>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Result Reveal Screen */}
      {currentRevealIdx !== null && resultsQueue[currentRevealIdx] && (
        <div className="fixed inset-0 z-[200] bg-[#010101] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
           {/* Rarity Splash Background */}
           <div className={`absolute inset-0 bg-gradient-radial from-transparent to-black opacity-60`}></div>
           <div className={`absolute inset-0 bg-gradient-to-t opacity-20 pointer-events-none transition-all duration-1000 ${getRarityColor(resultsQueue[currentRevealIdx].rarity)}`}></div>
           
           <div className="relative z-10 flex flex-col items-center max-w-2xl w-full">
              <div className="mb-8 flex flex-col items-center animate-in slide-in-from-top-12 duration-1000">
                 <div className={`text-4xl md:text-7xl font-black font-cinzel tracking-[0.4em] uppercase mb-4 text-glow bg-clip-text text-transparent bg-gradient-to-r ${getRarityColor(resultsQueue[currentRevealIdx].rarity)}`}>
                    {resultsQueue[currentRevealIdx].rarity?.replace(/_/g, ' ') || 'COMMON'}
                 </div>
                 <div className="h-px w-64 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              </div>

              {/* Entity Card */}
              <div className="relative group perspective-1000 animate-in zoom-in-50 duration-700">
                 <div className={`w-72 h-[450px] md:w-80 md:h-[500px] rounded-[2.5rem] border-4 p-1.5 overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] relative transition-all duration-1000 bg-slate-950 ${getRarityColor(resultsQueue[currentRevealIdx].rarity).replace('from-', 'border-').split(' ')[0]}`}>
                    <img 
                      src={(resultsQueue[currentRevealIdx] as any).sprite || `https://picsum.photos/seed/${resultsQueue[currentRevealIdx].id}/500/800`} 
                      className="w-full h-full object-cover rounded-[2rem] brightness-90 group-hover:brightness-100 transition-all duration-500" 
                    />
                    
                    {/* Card Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20 pointer-events-none"></div>
                    
                    {/* Card Content */}
                    <div className="absolute bottom-8 left-0 w-full px-8 flex flex-col items-start">
                       <div className="flex items-center gap-2 mb-3">
                          <i className={`fas ${getTraitIcon((resultsQueue[currentRevealIdx] as any).trait)} text-xl text-white/80`}></i>
                          <div className="h-4 w-px bg-white/20"></div>
                          <span className="text-[10px] font-black font-mono text-white/60 uppercase tracking-widest">{(resultsQueue[currentRevealIdx] as any).trait || 'VOID'} TYPE</span>
                       </div>
                       <h3 className="text-3xl md:text-4xl font-cinzel font-black text-white uppercase mb-2 tracking-tight group-hover:text-glow transition-all">
                         {resultsQueue[currentRevealIdx].name}
                       </h3>
                       <div className="text-[9px] text-slate-500 font-mono italic leading-relaxed line-clamp-2">
                         "{(resultsQueue[currentRevealIdx] as any).description || 'A unique neural signature manifest from the Singularity.'}"
                       </div>
                    </div>
                 </div>
                 
                 {/* Floating Particle Effects for High Rarity */}
                 {getRarityValue(resultsQueue[currentRevealIdx].rarity) >= 3 && (
                   <div className="absolute -inset-8 pointer-events-none">
                      <div className="absolute top-0 left-1/2 w-1 h-1 bg-white rounded-full animate-ping"></div>
                      <div className="absolute bottom-1/4 right-0 w-2 h-2 bg-white/40 rounded-full animate-float"></div>
                   </div>
                 )}
              </div>
           </div>

           {/* Footer Action */}
           <div className="fixed bottom-12 left-0 w-full p-6 flex flex-col items-center gap-6 z-20">
              <button 
                onClick={nextReveal}
                className="w-full max-sm px-12 py-6 bg-white text-slate-950 font-black font-cinzel tracking-[0.3em] rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.4)] text-lg uppercase"
              >
                {currentRevealIdx === resultsQueue.length - 1 && resultsQueue.length === 1 ? 'MANIFEST COMPLETE' : 'NEXT SIGNATURE'}
              </button>
              <div className="text-[10px] text-slate-500 font-black font-mono uppercase tracking-widest opacity-40">Tap anywhere to stabilize neural link</div>
           </div>
        </div>
      )}

      {/* 10-Pull Summary Screen */}
      {showSummary && (
        <div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-700">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e1b4b_0%,#000_100%)] opacity-60"></div>
           
           <div className="relative z-10 w-full max-w-7xl flex flex-col items-center">
              <header className="mb-12 text-center">
                 <div className="text-violet-500 font-cinzel font-black tracking-[0.8em] text-xs uppercase mb-3">Expedition Reinforcements</div>
                 <h2 className="text-5xl font-black font-cinzel text-white tracking-widest uppercase mb-4">Manifest Summary</h2>
                 <div className="h-1 w-48 bg-gradient-to-r from-transparent via-violet-500 to-transparent mx-auto"></div>
              </header>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 w-full mb-16">
                 {resultsQueue.map((item, i) => (
                   <div 
                    key={i} 
                    className={`group relative flex flex-col items-center p-1 rounded-3xl border-2 transition-all duration-500 hover:scale-105 bg-slate-900/40 animate-in zoom-in ${getRarityColor(item.rarity).replace('from-', 'border-').split(' ')[0]}`}
                    style={{ animationDelay: `${i * 100}ms` }}
                   >
                      <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden relative mb-4">
                         <img src={(item as any).sprite || `https://picsum.photos/seed/${item.id}/200/250`} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                         <div className="absolute top-2 right-2">
                           <i className={`fas ${getTraitIcon((item as any).trait)} text-xs text-white/50`}></i>
                         </div>
                         <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${getRarityColor(item.rarity)}`}></div>
                      </div>
                      <div className="px-2 text-center pb-3">
                         <div className={`text-[8px] font-black uppercase tracking-tighter mb-1 truncate max-w-full ${getRarityColor(item.rarity).replace('from-', 'text-').split(' ')[0]}`}>
                           {item.rarity?.replace(/_/g, ' ')}
                         </div>
                         <div className="text-xs font-cinzel text-white font-black uppercase truncate w-24">{item.name}</div>
                      </div>
                   </div>
                 ))}
              </div>

              <button 
                onClick={concludeGacha}
                className="px-20 py-5 bg-violet-600 hover:bg-violet-500 text-white font-black font-cinzel tracking-widest rounded-2xl transition-all active:scale-95 shadow-[0_0_50px_rgba(139,92,246,0.2)] text-xl uppercase"
              >
                Return to Core
              </button>
           </div>
        </div>
      )}

      {/* Manifestation Completion Screen */}
      {showManifestation && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center overflow-y-auto custom-scrollbar p-6 pt-12 pb-32 animate-in fade-in duration-500">
           <div className="max-w-md w-full flex flex-col items-center mb-auto">
              <h2 className="text-xl md:text-3xl font-cinzel text-white font-black tracking-widest uppercase mb-12 text-center">Synthesis Completed</h2>
              <div className="flex flex-wrap justify-center gap-3 mb-16">
                 {manifestedTickets.map((type, i) => (
                   <div key={i} className={`w-14 h-20 md:w-20 md:h-28 rounded-xl border-2 flex flex-col items-center justify-center gap-2 animate-in zoom-in ${type === 'ECHO' ? 'bg-blue-900/20 border-blue-500/40 text-blue-400' : 'bg-emerald-900/20 border-emerald-500/40 text-emerald-400'}`} style={{ animationDelay: `${i * 30}ms` }}>
                      <i className={`fas ${type === 'ECHO' ? 'fa-dna' : 'fa-microchip'} text-lg md:text-2xl`}></i>
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
                Manifest Complete
              </button>
           </div>
        </div>
      )}

      {/* Global Transition/Wait Overlay */}
      {isConverting && (
        <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
           <div className="w-48 h-1 bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-violet-600 animate-[loading_1.5s_infinite]"></div>
           </div>
           <div className="mt-4 text-[9px] text-violet-400 font-black uppercase tracking-widest font-cinzel">Recalibrating Singularity...</div>
        </div>
      )}

      <style>{`
        @keyframes loading {
          0% { width: 0; margin-left: 0; }
          50% { width: 100%; margin-left: 0; }
          100% { width: 0; margin-left: 100%; }
        }
        .perspective-1000 { perspective: 1000px; }
        .bg-gradient-radial { background: radial-gradient(var(--tw-gradient-stops)); }
      `}</style>
    </div>
  );
};

export default GachaSystem;

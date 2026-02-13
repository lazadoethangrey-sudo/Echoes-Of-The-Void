
import React, { useState, useRef, useEffect } from 'react';
import { Stage, Trait } from '../types';

interface StageSelectProps {
  stages: Stage[];
  onSelectStage: (stage: Stage) => void;
  onBackToTitle: () => void;
  shards: number;
}

const StageSelect: React.FC<StageSelectProps> = ({ stages, onSelectStage, onBackToTitle, shards }) => {
  const [activeChapter, setActiveChapter] = useState(1);
  const [rightClickedStage, setRightClickedStage] = useState<Stage | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const chapters = Array.from({ length: 10 }, (_, i) => {
    const id = i + 1;
    let name = "Void Frontier";
    let color = "border-slate-500";
    let text = "text-slate-400";
    
    if (id === 1) { name = "Fallen Sanctuary"; color = "border-violet-500"; text = "text-violet-400"; }
    else if (id === 2) { name = "Crimson Wastes"; color = "border-red-500"; text = "text-red-400"; }
    else if (id === 3) { name = "Aether Heights"; color = "border-blue-500"; text = "text-blue-400"; }
    else if (id === 4) { name = "Steel Bastion"; color = "border-slate-500"; text = "text-slate-400"; }
    else if (id === 5) { name = "Nebula Reach"; color = "border-purple-500"; text = "text-purple-400"; }
    else if (id === 6) { name = "Obsidian Field"; color = "border-red-600"; text = "text-red-500"; }
    else if (id === 7) { name = "Cloud Spire"; color = "border-sky-500"; text = "text-sky-400"; }
    else if (id === 8) { name = "Clockwork Maze"; color = "border-amber-700"; text = "text-amber-600"; }
    else if (id === 9) { name = "Pulsar Plains"; color = "border-pink-500"; text = "text-pink-400"; }
    else if (id === 10) { name = "Void Cathedral"; color = "border-indigo-500"; text = "text-indigo-400"; }

    return { id, name, color, text };
  });

  const filteredStages = stages.filter(s => s.chapterId === activeChapter);
  
  const isChapterUnlocked = (id: number) => {
    if (id === 1) return true;
    const prevBossId = (id - 1) * 10;
    const prevBoss = stages.find(s => s.id === prevBossId);
    return prevBoss?.completed || false;
  };

  const getTraitColor = (trait: Trait) => {
    switch(trait) {
        case 'CRIMSON': return 'text-red-500';
        case 'AETHER': return 'text-blue-400';
        case 'STEEL': return 'text-slate-400';
        case 'NEBULA': return 'text-purple-400';
        case 'BEHEMOTH': return 'text-orange-500';
        case 'VOID': return 'text-violet-500';
        default: return 'text-white';
    }
  };

  return (
    <div className={`w-full h-screen bg-slate-950 p-4 md:p-8 flex flex-col items-center overflow-hidden transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {rightClickedStage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={() => setRightClickedStage(null)}>
          <div className="max-w-md w-full glass p-8 rounded-3xl border-slate-700 relative overflow-hidden animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-1 bg-violet-600"></div>
            <h3 className="text-xl font-cinzel text-white mb-1 uppercase font-black">{rightClickedStage.name} Intel</h3>
            {!rightClickedStage.completed ? <div className="py-12 text-center text-slate-500 italic">Clear zone to decode enemy signatures.</div> : (
              <div className="space-y-4 mt-4">
                 {rightClickedStage.waves.flat().map((enemy, idx) => (
                    <div key={idx} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
                       <img src={enemy.sprite} className="w-12 h-12 rounded-lg border border-slate-700 object-cover" />
                       <div className="flex-1">
                          <div className="flex justify-between items-center"><span className="text-xs font-bold text-white truncate w-32">{enemy.name}</span><span className={`text-[8px] font-black uppercase tracking-tighter ${getTraitColor(enemy.trait)}`}>{enemy.trait}</span></div>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-[9px] text-slate-400 font-mono">
                             <div>HP: {enemy.maxHp.toLocaleString()}</div><div>ATK: {enemy.attack.toLocaleString()}</div>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
            )}
            <button onClick={() => setRightClickedStage(null)} className="mt-8 w-full py-3 border border-slate-700 text-slate-500 hover:text-white font-black font-cinzel rounded-xl transition-all text-xs active:scale-95">CLOSE INTEL</button>
          </div>
        </div>
      )}

      <div className="max-w-7xl w-full h-full flex flex-col">
        <header className="mb-6 flex flex-col gap-4 flex-shrink-0">
          <div className="flex justify-between items-start w-full">
            <div className="flex items-center gap-6">
              <button onClick={onBackToTitle} className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:border-violet-500 transition-all active:scale-90"><i className="fas fa-arrow-left text-sm"></i></button>
              <div>
                <h2 className="text-2xl md:text-4xl font-black font-cinzel text-violet-400 text-glow uppercase tracking-widest leading-none">The Void Map</h2>
                <p className="text-slate-600 font-cinzel text-[8px] uppercase tracking-widest mt-1">Select an active zone for deployment</p>
              </div>
            </div>
            <div className="glass px-6 py-2 rounded-xl border-violet-500/20 flex items-center gap-4">
              <div className="flex flex-col items-end"><span className="text-[7px] font-black text-slate-500 uppercase">Essence</span><span className="font-mono text-xl font-bold text-white tracking-tight">{shards.toLocaleString()}</span></div>
              <i className="fas fa-gem text-violet-400 text-sm animate-pulse"></i>
            </div>
          </div>
          
          <div className="flex items-center w-full bg-slate-900/40 p-1.5 rounded-xl border border-slate-800/60 overflow-hidden">
            <div className="flex gap-2 overflow-x-auto no-scrollbar px-2 py-1 cursor-grab active:cursor-grabbing" ref={scrollRef}>
              {chapters.map(ch => {
                const unlocked = isChapterUnlocked(ch.id);
                return (
                  <button key={ch.id} onClick={() => unlocked && setActiveChapter(ch.id)} className={`px-4 py-2 rounded-lg font-cinzel text-[9px] font-black tracking-widest border-2 transition-all flex-shrink-0 ${activeChapter === ch.id ? `${ch.color} ${ch.text} bg-slate-950 scale-105 shadow-lg` : unlocked ? 'border-slate-800 text-slate-600 hover:border-slate-600' : 'border-slate-900 text-slate-800 cursor-not-allowed opacity-40'}`}>
                    CH {ch.id}: {ch.name}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {filteredStages.map((stage) => {
              const isSelectable = stage.unlocked;
              return (
                <div key={stage.id} onContextMenu={(e) => { e.preventDefault(); setRightClickedStage(stage); }} onClick={() => isSelectable && onSelectStage(stage)} className={`group relative rounded-xl border-2 transition-all duration-300 flex flex-col h-64 overflow-hidden ${isSelectable ? 'cursor-pointer border-slate-800 hover:border-violet-500 bg-slate-900/40' : 'border-slate-900 bg-slate-950 opacity-30'}`}>
                  <div className="h-24 relative overflow-hidden">
                    <img src={`https://picsum.photos/seed/void-st${stage.id}/400/200`} className={`w-full h-full object-cover transition-all group-hover:scale-110 ${!isSelectable ? 'grayscale' : ''}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                    {stage.isBoss && <div className="absolute top-2 right-2 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg">BOSS</div>}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <div className="flex justify-between items-center mb-1"><span className={`text-[7px] font-black tracking-tighter ${getTraitColor(stage.waves[0][0].trait)}`}>{stage.waves[0][0].trait}</span>{stage.completed && <i className="fas fa-check text-emerald-500 text-[8px]"></i>}</div>
                    <h3 className="font-cinzel text-xs font-bold text-white mb-1 group-hover:text-violet-400 transition-colors">{stage.name}</h3>
                    <p className="text-[9px] text-slate-500 line-clamp-2 leading-relaxed italic">{stage.description}</p>
                    {isSelectable && (
                        <div className="mt-auto flex justify-between items-center pt-2 border-t border-slate-800">
                           <span className="text-[7px] font-mono text-slate-400">CH {stage.chapterId} - ZONE {stage.id % 10 || 10}</span>
                           <i className="fas fa-play-circle text-violet-500 text-sm group-hover:scale-125 transition-transform"></i>
                        </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 p-4 glass rounded-xl border-slate-800 flex justify-between items-center text-[8px] text-slate-500 font-bold uppercase tracking-widest animate-in slide-in-from-bottom-2">
           <div className="flex items-center gap-6">
              <span className="flex items-center gap-2"><div className="w-2 h-2 bg-violet-600 rounded-full"></div>Sanctuary Intel</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div>{stages.filter(s => s.completed).length} Stages Cleared</span>
           </div>
           <div className="italic text-slate-700">Drag chapter bar to scroll // Right-click zones for info</div>
        </div>
      </div>
    </div>
  );
};

export default StageSelect;

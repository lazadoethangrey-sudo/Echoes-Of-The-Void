
import React, { useState, useEffect } from 'react';
import { Stage, Trait } from '../types';
import { soundService } from '../services/soundService';

interface StageSelectProps {
  stages: Stage[];
  onSelectStage: (stage: Stage) => void;
  onBackToTitle: () => void;
  shards: number;
}

const StageSelect: React.FC<StageSelectProps> = ({ stages, onSelectStage, onBackToTitle, shards }) => {
  const [activeChapter] = useState(1);
  const [hoveredStage, setHoveredStage] = useState<Stage | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const getTraitColor = (trait: Trait) => {
    switch(trait) {
        case 'CRIMSON': return 'text-red-500';
        case 'AETHER': return 'text-blue-400';
        case 'STEEL': return 'text-slate-400';
        case 'NEBULA': return 'text-purple-400';
        case 'VOID': return 'text-violet-500';
        default: return 'text-white';
    }
  };

  const filteredStages = stages.filter(s => s.chapterId === activeChapter);

  return (
    <div className={`w-full h-screen bg-[#020617] p-6 md:p-10 flex flex-col items-center overflow-hidden transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      
      <div className="max-w-7xl w-full h-full flex flex-col relative">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 flex-shrink-0 animate-in slide-in-from-top-6 duration-700">
          <div className="flex items-center gap-6">
            <button 
              onClick={onBackToTitle} 
              className="w-12 h-12 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:border-violet-500/50 hover:bg-violet-950/20 transition-all active:scale-90 shadow-lg"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <div>
              <h2 className="text-3xl md:text-5xl font-black font-cinzel text-violet-400 text-glow uppercase tracking-[0.2em] leading-none">Sector Archive</h2>
              <p className="text-slate-600 font-mono text-[9px] uppercase tracking-[0.4em] mt-2">Active Deployment // Chapter 01</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="glass px-8 py-3 rounded-2xl border-violet-500/20 flex items-center gap-5 shadow-[0_0_30px_rgba(139,92,246,0.1)]">
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono">Void Essence</span>
                <span className="font-mono text-2xl font-bold text-white tracking-tight">{shards.toLocaleString()}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center border border-violet-500/30">
                <i className="fas fa-gem text-violet-400 text-lg animate-pulse"></i>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar pb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {filteredStages.map((stage) => {
              const isSelectable = stage.unlocked;
              const isHovered = hoveredStage?.id === stage.id;
              
              return (
                <div 
                  key={stage.id} 
                  onMouseEnter={() => isSelectable && setHoveredStage(stage)}
                  onMouseLeave={() => setHoveredStage(null)}
                  onClick={() => isSelectable && onSelectStage(stage)}
                  className={`group relative rounded-[2rem] border-2 transition-all duration-500 flex flex-col h-80 overflow-hidden shadow-2xl ${isSelectable ? 'cursor-pointer border-slate-800 hover:border-violet-500/50 bg-slate-900/40' : 'border-slate-900/50 bg-black opacity-20'}`}
                >
                  {/* Visual Background */}
                  <div className="h-32 relative overflow-hidden flex-shrink-0">
                    <img 
                      src={`https://picsum.photos/seed/void-s${stage.id}/400/300`} 
                      className={`w-full h-full object-cover transition-all duration-[2s] group-hover:scale-110 ${!isSelectable ? 'grayscale' : ''}`} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                    
                    {stage.completed && (
                      <div className="absolute top-4 left-4 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 text-[10px] shadow-lg">
                        <i className="fas fa-check"></i>
                      </div>
                    )}

                    {stage.isBoss && (
                      <div className="absolute top-4 right-4 bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.5)] uppercase tracking-widest animate-pulse font-mono">
                        Boss Core
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1 relative">
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[9px] font-black tracking-[0.2em] font-mono ${getTraitColor(stage.waves[0][0].trait)}`}>
                        {stage.waves[0][0].trait}
                      </span>
                      <span className="text-[8px] font-mono text-slate-500">Z-ID: {stage.id.toString().padStart(2, '0')}</span>
                    </div>

                    <h3 className="font-cinzel text-lg font-black text-white mb-2 group-hover:text-violet-400 transition-colors uppercase leading-tight truncate">
                      {stage.name}
                    </h3>

                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed italic mb-4 font-cinzel">
                      {stage.description}
                    </p>

                    {isSelectable && (
                        <div className="mt-auto flex flex-col gap-3 pt-3 border-t border-slate-800/50">
                           <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-600 tracking-widest">
                             <span>Rewards</span>
                             <div className="flex gap-2 text-violet-400 font-mono">
                               <span>{stage.shardReward} S</span>
                               <span>{stage.expReward} E</span>
                             </div>
                           </div>
                           <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-violet-600/30 group-hover:bg-violet-500 transition-all duration-700" style={{ width: isHovered ? '100%' : '0%' }}></div>
                           </div>
                        </div>
                    )}
                  </div>
                  
                  {/* Locked Overlay */}
                  {!isSelectable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] z-10 pointer-events-none">
                       <i className="fas fa-lock text-slate-800 text-3xl"></i>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 p-6 glass rounded-[2rem] border-slate-800/50 flex justify-between items-center text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] font-mono animate-in slide-in-from-bottom-6">
           <div className="flex items-center gap-10">
              <span className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-violet-600 rounded-full shadow-[0_0_8px_#8b5cf6]"></div>Expedition Active</span>
              <span className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></div>{stages.filter(s => s.completed).length} Signatures Decoded</span>
           </div>
           <div className="hidden lg:block italic text-slate-700">Recommended Trait resistance listed per sector</div>
        </div>
      </div>
    </div>
  );
};

export default StageSelect;

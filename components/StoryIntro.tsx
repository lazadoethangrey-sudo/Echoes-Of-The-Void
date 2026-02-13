import React from 'react';
import { Stage, DialogueLine } from '../types';

interface StoryIntroProps {
  stage: Stage;
  dialogue: DialogueLine[];
  isNarrating: boolean;
  onDeploy: () => void;
  onBack: () => void;
}

const StoryIntro: React.FC<StoryIntroProps> = ({ stage, dialogue, isNarrating, onDeploy, onBack }) => {
  const getAvatar = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('kaelen')) return 'https://picsum.photos/seed/hero1/200/200';
    if (n.includes('lyra')) return 'https://picsum.photos/seed/hero2/200/200';
    if (n.includes('jax')) return 'https://picsum.photos/seed/hero3/200/200';
    if (n.includes('seren')) return 'https://picsum.photos/seed/seren/200/200';
    if (n.includes('narrator')) return 'https://picsum.photos/seed/void/200/200';
    return 'https://picsum.photos/seed/mysterious/200/200';
  };

  const isBoss = stage.isBoss;

  return (
    <div className={`w-full h-full flex flex-col items-center p-4 md:p-8 bg-slate-950 relative overflow-y-auto custom-scrollbar transition-all duration-1000 ${isBoss ? 'shadow-[inset_0_0_200px_rgba(139,92,246,0.1)]' : ''}`}>
      <div className="fixed inset-0 bg-cover bg-center opacity-20 blur-2xl scale-110 animate-[pulse_10s_infinite] pointer-events-none" style={{ backgroundImage: `url(https://picsum.photos/seed/void-st${stage.id}/1920/1080)` }}></div>
      <div className="fixed inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950 pointer-events-none"></div>
      
      <div className="max-w-4xl w-full z-10 my-auto py-8 pb-48"> {/* Added significant bottom padding here */}
        <div className="flex flex-col gap-4">
          {/* Stage Header */}
          <div className="text-center mb-6">
             <div className="flex items-center justify-center gap-4 mb-2">
                <div className="hidden md:block h-px w-24 bg-gradient-to-r from-transparent to-violet-500/50"></div>
                <h3 className="text-violet-500 font-cinzel tracking-[0.2em] md:tracking-[0.5em] text-[8px] md:text-[10px] uppercase font-black animate-pulse">Neural Synchronization In Progress</h3>
                <div className="hidden md:block h-px w-24 bg-gradient-to-l from-transparent to-violet-500/50"></div>
             </div>
             <h2 className="text-3xl md:text-7xl font-cinzel text-white text-glow font-black tracking-widest uppercase break-words px-2">{stage.name}</h2>
             <p className="text-slate-500 font-mono text-[9px] md:text-[11px] uppercase tracking-[0.2em] md:tracking-[0.4em] mt-2">Chapter {stage.chapterId} // Sector {stage.id}</p>
          </div>

          {/* Dialogue Display */}
          <div className="glass p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] border-slate-800/60 min-h-[300px] flex flex-col justify-center relative shadow-2xl overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-600 to-transparent opacity-50"></div>
             <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-600 to-transparent opacity-50"></div>
             
             <div className="space-y-6 md:space-y-8">
               {dialogue.map((line, idx) => {
                 const isNarrator = line.speaker === "NARRATOR";
                 return (
                   <div key={idx} className={`flex gap-4 md:gap-8 animate-in slide-in-from-bottom-6 duration-700 fade-in`} style={{ animationDelay: `${idx * 200}ms` }}>
                      <div className={`flex-shrink-0 w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-3xl overflow-hidden border-2 shadow-2xl transition-transform duration-500 group-hover:scale-105 ${isNarrator ? 'border-violet-900/50 scale-90 opacity-40' : 'border-slate-800 shadow-violet-900/10'}`}>
                         <img src={getAvatar(line.speaker)} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                         <div className={`text-[8px] md:text-[10px] font-black font-cinzel tracking-[0.2em] md:tracking-[0.3em] uppercase mb-1.5 ${isNarrator ? 'text-violet-700' : 'text-violet-400'}`}>
                           {line.speaker}
                         </div>
                         <p className={`text-base md:text-2xl leading-relaxed font-serif ${isNarrator ? 'text-slate-600 italic' : 'text-slate-100'}`}>
                           {isNarrator ? line.text : `"${line.text}"`}
                         </p>
                      </div>
                   </div>
                 );
               })}
               
               {isNarrating && (
                 <div className="flex items-center gap-4 px-4 md:px-24 mt-8 opacity-40">
                    <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                 </div>
               )}
             </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-4 md:gap-6 mt-8 md:mt-10">
            <button 
              onClick={onDeploy} 
              className="w-full md:w-auto px-12 md:px-24 py-4 md:py-6 bg-white text-slate-950 font-black font-cinzel tracking-[0.2em] md:tracking-[0.4em] rounded-xl md:rounded-[2rem] hover:bg-violet-600 hover:text-white transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(139,92,246,0.5)] active:scale-95 text-lg md:text-xl uppercase"
            >
              Initiate Combat
            </button>
            <button 
              onClick={onBack}
              className="px-6 md:px-10 py-2 md:py-3 border border-slate-800 hover:border-slate-600 text-slate-600 hover:text-slate-400 text-[8px] md:text-[9px] font-black font-cinzel tracking-[0.2em] md:tracking-[0.3em] rounded-xl md:rounded-2xl transition-all uppercase mb-12"
            >
              Withdraw Expedition
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryIntro;
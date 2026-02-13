
import React, { useState } from 'react';
import { CATEGORIES } from '../constants';
import { Category, Stage } from '../types';
import { soundService } from '../services/soundService';

interface ChapterSelectProps {
  stages: Stage[];
  onSelectChapter: (chapterId: number) => void;
  onBack: () => void;
  shards: number;
}

const ChapterSelect: React.FC<ChapterSelectProps> = ({ stages, onSelectChapter, onBack, shards }) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState(CATEGORIES[0].id);

  const activeCategory = CATEGORIES.find(c => c.id === selectedCategoryId)!;

  const isChapterUnlocked = (chapterId: number) => {
    if (chapterId === 1) return true;
    const prevChapterLastStage = stages.find(s => s.chapterId === chapterId - 1 && s.isBoss);
    return prevChapterLastStage?.completed || false;
  };

  const getCategoryColor = (color: string) => {
    switch (color) {
      case 'violet': return 'text-violet-400 border-violet-500/30 bg-violet-950/20';
      case 'blue': return 'text-blue-400 border-blue-500/30 bg-blue-950/20';
      case 'emerald': return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
      case 'red': return 'text-red-400 border-red-500/30 bg-red-950/20';
      default: return 'text-slate-400 border-slate-700 bg-slate-900/40';
    }
  };

  const getChapterProgress = (chapterId: number) => {
    const chapterStages = stages.filter(s => s.chapterId === chapterId);
    const completed = chapterStages.filter(s => s.completed).length;
    return (completed / chapterStages.length) * 100;
  };

  return (
    <div className="w-full h-screen bg-slate-950 flex flex-col p-6 md:p-10 overflow-hidden animate-in fade-in duration-700">
      <header className="flex justify-between items-center mb-10 flex-shrink-0">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white transition-all shadow-lg"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <div>
            <h2 className="text-4xl font-black font-cinzel text-white tracking-[0.2em] uppercase leading-none">Timeline Hub</h2>
            <p className="text-slate-500 font-mono text-[9px] uppercase tracking-[0.4em] mt-2">Active Categories // Choose Expedition</p>
          </div>
        </div>
        <div className="glass px-8 py-3 rounded-2xl border-violet-500/20 flex items-center gap-4">
          <i className="fas fa-gem text-violet-400 text-lg"></i>
          <span className="font-mono text-2xl font-bold text-white leading-none">{shards.toLocaleString()}</span>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="flex gap-4 mb-8 overflow-x-auto no-scrollbar pb-2 flex-shrink-0">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => { soundService.play('CLICK'); setSelectedCategoryId(cat.id); }}
            className={`px-8 py-4 rounded-2xl flex items-center gap-4 border-2 transition-all font-cinzel text-xs font-black tracking-widest uppercase flex-shrink-0 ${
              selectedCategoryId === cat.id 
                ? 'border-violet-500 bg-violet-600/10 text-white shadow-[0_0_20px_rgba(139,92,246,0.2)]' 
                : 'border-slate-800 bg-slate-900/40 text-slate-500 hover:border-slate-700'
            }`}
          >
            <i className={`fas ${cat.icon}`}></i>
            {cat.name}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col md:grid md:grid-cols-12 gap-10 overflow-hidden">
        {/* Category Detail */}
        <div className="md:col-span-4 flex flex-col">
          <div className={`flex-1 glass p-10 rounded-[3rem] border-2 flex flex-col items-center justify-center text-center transition-all duration-700 ${getCategoryColor(activeCategory.color)}`}>
            <i className={`fas ${activeCategory.icon} text-7xl mb-8 animate-float opacity-80`}></i>
            <h3 className="text-3xl font-cinzel font-black tracking-widest uppercase mb-4 text-glow">{activeCategory.name}</h3>
            <p className="text-sm font-cinzel italic leading-relaxed opacity-60">"{activeCategory.description}"</p>
            <div className="mt-10 w-full h-px bg-current opacity-10"></div>
            <div className="mt-6 flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Category Mastery</span>
              <div className="text-2xl font-mono font-black">{Math.floor(activeCategory.chapters.reduce((acc, cid) => acc + getChapterProgress(cid), 0) / activeCategory.chapters.length)}%</div>
            </div>
          </div>
        </div>

        {/* Chapters Grid */}
        <div className="md:col-span-8 overflow-y-auto pr-4 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-10">
            {activeCategory.chapters.map(chapterId => {
              const unlocked = isChapterUnlocked(chapterId);
              const progress = getChapterProgress(chapterId);
              
              return (
                <button
                  key={chapterId}
                  disabled={!unlocked}
                  onClick={() => { soundService.play('CLICK'); onSelectChapter(chapterId); }}
                  className={`group relative p-8 rounded-[2.5rem] border-2 flex flex-col items-start transition-all duration-500 text-left overflow-hidden ${
                    unlocked 
                      ? 'bg-slate-900/60 border-slate-800 hover:border-violet-500/50 hover:bg-violet-950/20 active:scale-95' 
                      : 'bg-black/40 border-slate-900 opacity-30 cursor-not-allowed'
                  }`}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <i className="fas fa-dna text-7xl"></i>
                  </div>

                  <div className="flex justify-between items-center w-full mb-6">
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-black font-mono text-violet-500 uppercase tracking-widest">Archive</span>
                       <span className="text-xs font-mono font-bold text-slate-500">#{chapterId.toString().padStart(3, '0')}</span>
                    </div>
                    {!unlocked && <i className="fas fa-lock text-slate-700"></i>}
                  </div>

                  <h4 className="text-2xl font-cinzel text-white font-black tracking-widest uppercase mb-4 group-hover:text-violet-400 transition-colors">
                    Chapter {chapterId}
                  </h4>

                  <div className="w-full mt-auto">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Signatures Decoded</span>
                      <span className="text-[10px] font-mono font-bold text-white">{Math.floor(progress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-1000" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterSelect;


import React, { useState, useMemo } from 'react';
import { Stage, Unit, Trait } from '../types';

interface EnemyIndexProps {
  stages: Stage[];
  onClose: () => void;
}

const EnemyIndex: React.FC<EnemyIndexProps> = ({ stages, onClose }) => {
  const [selectedTrait, setSelectedTrait] = useState<Trait | 'ALL'>('ALL');

  const encounteredEnemies = useMemo(() => {
    const enemies = new Map<string, Unit>();
    stages.forEach(stage => {
      if (stage.completed) {
        // Correctly traverse the Unit[][] waves structure
        stage.waves.flat().forEach(enemy => {
          // Use name as the key to treat same-name enemies as unique types
          if (!enemies.has(enemy.name)) {
            enemies.set(enemy.name, enemy);
          }
        });
      }
    });
    return Array.from(enemies.values());
  }, [stages]);

  const filteredEnemies = useMemo(() => {
    if (selectedTrait === 'ALL') return encounteredEnemies;
    return encounteredEnemies.filter(e => e.trait === selectedTrait);
  }, [encounteredEnemies, selectedTrait]);

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

  const traitFilters: (Trait | 'ALL')[] = ['ALL', 'VOID', 'CRIMSON', 'AETHER', 'STEEL', 'NEBULA', 'BEHEMOTH'];

  return (
    <div className="w-full h-screen bg-slate-950 p-4 md:p-8 flex flex-col items-center overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-emerald-600/5 blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-7xl w-full h-full flex flex-col relative z-10">
        <header className="flex justify-between items-center mb-10 flex-shrink-0">
          <div>
            <h2 className="text-4xl font-cinzel text-emerald-400 text-glow font-black tracking-widest uppercase leading-none">Void Codex</h2>
            <p className="text-slate-500 font-cinzel text-[10px] uppercase tracking-[0.2em] mt-2">Manifestation Index & Trait Analysis</p>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-all group">
            <i className="fas fa-times text-slate-400 group-hover:text-white"></i>
          </button>
        </header>

        {/* Trait Filters */}
        <div className="flex flex-wrap gap-2 mb-8 flex-shrink-0">
           {traitFilters.map(trait => (
             <button
               key={trait}
               onClick={() => setSelectedTrait(trait)}
               className={`px-6 py-2 rounded-full border-2 font-cinzel text-[10px] font-black tracking-widest transition-all ${
                 selectedTrait === trait 
                 ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                 : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'
               }`}
             >
               {trait}
             </button>
           ))}
        </div>

        {/* Enemy Grid */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-12">
          {filteredEnemies.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30">
               <i className="fas fa-skull-crossbones text-6xl mb-4"></i>
               <p className="text-xl font-cinzel tracking-widest">No Signatures Detected</p>
               <p className="text-xs font-cinzel mt-2 italic">Secure more zones to populate the Codex</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredEnemies.map((enemy, idx) => (
                <div 
                  key={idx} 
                  className="glass p-6 rounded-3xl border-slate-800 flex flex-col group hover:border-emerald-500/30 transition-all duration-500"
                >
                  <div className="relative mb-6">
                    <img src={enemy.sprite} className="w-full h-40 object-cover rounded-2xl border border-slate-800 grayscale group-hover:grayscale-0 transition-all duration-500" />
                    <div className="absolute top-2 right-2 px-3 py-1 bg-slate-950/80 border border-slate-800 rounded-lg shadow-xl">
                       <span className={`text-[9px] font-black tracking-[0.2em] uppercase ${getTraitColor(enemy.trait)}`}>{enemy.trait}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-cinzel text-white font-bold mb-1 truncate">{enemy.name}</h3>
                  <p className="text-[10px] text-slate-500 mb-6 italic h-8 line-clamp-2">"A verified threat manifestation of the {enemy.trait} classification."</p>

                  <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-slate-800">
                     <div className="text-center">
                        <div className="text-[7px] text-slate-600 font-bold uppercase mb-1">Max HP</div>
                        <div className="text-xs font-mono text-emerald-400 font-bold">{enemy.maxHp}</div>
                     </div>
                     <div className="text-center">
                        <div className="text-[7px] text-slate-600 font-bold uppercase mb-1">ATK</div>
                        <div className="text-xs font-mono text-emerald-400 font-bold">{enemy.attack}</div>
                     </div>
                     <div className="text-center">
                        <div className="text-[7px] text-slate-600 font-bold uppercase mb-1">DEF</div>
                        <div className="text-xs font-mono text-emerald-400 font-bold">{enemy.defense}</div>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 p-5 glass rounded-2xl border-slate-800 flex justify-between items-center text-[10px] text-slate-600 font-bold uppercase tracking-widest flex-shrink-0">
           <div className="flex items-center gap-4">
              <i className="fas fa-database text-emerald-500 opacity-50"></i>
              <span>Codex Records: {encounteredEnemies.length} Detected Entities</span>
           </div>
           <div className="italic">Analysis synchronized with current timeline</div>
        </div>
      </div>
    </div>
  );
};

export default EnemyIndex;

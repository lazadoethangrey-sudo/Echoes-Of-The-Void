

import React, { useState, useMemo } from 'react';
import { Unit, Equipment, Skill, Trait } from '../types';
import { soundService } from '../services/soundService';

interface HeroManagementProps {
  allHeroes: Unit[];
  activeParty: Unit[];
  inventory: Equipment[];
  shards: number;
  onUpdateHero: (hero: Unit) => void;
  onUpdateParty: (party: Unit[]) => void;
  onSpendShards: (amount: number) => void;
  onUpdateInventory: (inventory: Equipment[]) => void; // New prop
  onClose: () => void;
}

const HeroManagement: React.FC<HeroManagementProps> = ({ allHeroes, activeParty, inventory, shards, onUpdateHero, onUpdateParty, onSpendShards, onUpdateInventory, onClose }) => {
  const [selectedHeroIdx, setSelectedHeroIdx] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState<'LINEUP' | 'STATS' | 'EQUIP' | 'SKILLS'>('LINEUP');
  const [equippingSlot, setEquippingSlot] = useState<'WEAPON' | 'ARMOR' | null>(null);
  const [lineupSlotToFill, setLineupSlotToFill] = useState<number | null>(null);
  const [rosterFilterTrait, setRosterFilterTrait] = useState<Trait | 'ALL'>('ALL');

  const visibleRoster = useMemo(() => {
    return allHeroes.filter(h => rosterFilterTrait === 'ALL' || h.trait === rosterFilterTrait)
      .sort((a, b) => {
        const rarities = { 'COMMON': 0, 'RARE': 1, 'EPIC': 2, 'LEGENDARY': 3, 'UBER_SUPER_RARE': 4, 'INSANE': 5 };
        return (rarities[b.rarity || 'COMMON'] || 0) - (rarities[a.rarity || 'COMMON'] || 0);
      });
  }, [allHeroes, rosterFilterTrait]);

  const hero = visibleRoster[selectedHeroIdx] || visibleRoster[0] || allHeroes[0];

  const teamPower = useMemo(() => {
    return activeParty.reduce((acc, h) => {
      if (!h) return acc;
      const stats = h.attack + h.defense + (h.maxHp / 10);
      const equipment = (h.equipment.weapon?.value || 0) + (h.equipment.armor?.value || 0);
      return acc + Math.floor(stats + (equipment * 2) + (h.level * 10));
    }, 0);
  }, [activeParty]);

  const getRarityStyle = (rarity: Unit['rarity']) => {
    switch (rarity) {
      case 'INSANE': return 'text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)] font-black italic';
      case 'UBER_SUPER_RARE': return 'text-purple-400 font-black';
      case 'LEGENDARY': return 'text-amber-400 font-bold';
      case 'EPIC': return 'text-blue-400';
      case 'RARE': return 'text-emerald-400';
      default: return 'text-slate-500';
    }
  };

  const assignHeroToSlot = (targetHero: Unit) => {
    if (lineupSlotToFill === null) return;
    const nextParty = [...activeParty];
    const existingIdx = nextParty.findIndex(h => h.id === targetHero.id);
    if (existingIdx !== -1) nextParty[existingIdx] = activeParty[lineupSlotToFill];
    nextParty[lineupSlotToFill] = targetHero;
    onUpdateParty(nextParty.filter(Boolean));
    setLineupSlotToFill(null);
    soundService.play('CLICK');
  };

  // --- Equipment Management Logic ---
  const handleEquipItem = (item: Equipment, slot: 'WEAPON' | 'ARMOR') => {
    if (!hero) return;
    soundService.play('CLICK');

    const prevEquippedItem = hero.equipment[slot];
    const newHero = { ...hero, equipment: { ...hero.equipment, [slot]: item } };
    
    let newInventory = inventory.filter(invItem => invItem.id !== item.id);
    if (prevEquippedItem) {
      newInventory = [...newInventory, prevEquippedItem];
    }
    onUpdateHero(newHero);
    onUpdateInventory(newInventory);
    setEquippingSlot(null); // Close the item selection
  };

  const handleUnequipItem = (slot: 'WEAPON' | 'ARMOR') => {
    if (!hero || !hero.equipment[slot]) return;
    soundService.play('CLICK');

    const itemToUnequip = hero.equipment[slot];
    const newHero = { ...hero, equipment: { ...hero.equipment, [slot]: null } };
    const newInventory = [...inventory, itemToUnequip!]; // Add item back to inventory
    
    onUpdateHero(newHero);
    onUpdateInventory(newInventory);
  };

  const filteredInventory = useMemo(() => {
    if (!equippingSlot) return [];
    return inventory.filter(item => item.slot === equippingSlot);
  }, [inventory, equippingSlot]);

  // --- Skill Management Logic ---
  const handleUnlockSkill = (skillToUnlock: Skill) => {
    if (!hero || !skillToUnlock.unlockCost || shards < skillToUnlock.unlockCost) return;
    soundService.play('MAGIC');

    onSpendShards(skillToUnlock.unlockCost);
    const updatedSkills = hero.skills.map(s => 
      s.name === skillToUnlock.name ? { ...s, unlocked: true } : s
    );
    const newHero = { ...hero, skills: updatedSkills };
    onUpdateHero(newHero);
  };


  return (
    <div className="w-full h-screen bg-[#020617] p-6 md:p-10 flex flex-col items-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-2/3 h-full bg-violet-600/5 blur-[150px] pointer-events-none"></div>
      
      <div className="max-w-7xl w-full flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 flex-shrink-0 animate-in slide-in-from-top-6">
          <div className="flex items-center gap-8">
            <div>
              <h2 className="text-4xl font-cinzel text-violet-400 text-glow font-black tracking-widest uppercase leading-none">Sanctuary</h2>
              <div className="flex items-center gap-4 mt-2">
                 <span className="text-[10px] text-slate-600 font-mono uppercase tracking-[0.3em]">TEAM POWER: <span className="text-white font-bold">{teamPower.toLocaleString()}</span></span>
                 <div className="h-px w-20 bg-slate-800"></div>
                 <span className="text-[10px] text-slate-600 font-mono uppercase tracking-[0.3em]">ROSTER: <span className="text-white font-bold">{allHeroes.length}</span></span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="glass px-8 py-3 rounded-2xl border-violet-500/20 flex items-center gap-4">
              <i className="fas fa-gem text-violet-400 text-lg"></i>
              <span className="font-mono text-2xl font-bold text-white leading-none">{shards.toLocaleString()}</span>
            </div>
            <button onClick={onClose} className="w-14 h-14 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-red-950/20 hover:border-red-500/50 transition-all group flex items-center justify-center">
              <i className="fas fa-times text-slate-500 group-hover:text-red-400 transition-colors"></i>
            </button>
          </div>
        </header>

        <div className="flex flex-col md:grid md:grid-cols-12 gap-8 flex-1 overflow-hidden">
          
          {/* Roster sidebar */}
          <div className="md:col-span-4 flex flex-col gap-4 overflow-hidden h-[40vh] md:h-auto">
             <div className="glass p-5 rounded-[2rem] border-slate-800 flex flex-col gap-3 flex-shrink-0">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono">Archive Signature Filter</span>
                <div className="flex flex-wrap gap-2">
                   {(['ALL', 'VOID', 'CRIMSON', 'AETHER', 'STEEL', 'NEBULA'] as const).map(t => (
                      <button 
                        key={t}
                        onClick={() => setRosterFilterTrait(t)}
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest border transition-all ${rosterFilterTrait === t ? 'bg-violet-600 border-violet-400 text-white shadow-lg shadow-violet-950' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                      >
                        {t}
                      </button>
                   ))}
                </div>
             </div>

             <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar space-y-3">
               {visibleRoster.map((p, idx) => {
                 const partySlotIdx = activeParty.findIndex(h => h && h.id === p.id);
                 const isDeployed = partySlotIdx !== -1;
                 const isSelected = hero?.id === p.id;
                 return (
                   <div 
                     key={p.id}
                     onClick={() => { setSelectedHeroIdx(idx); if (lineupSlotToFill !== null) assignHeroToSlot(p); }}
                     className={`p-4 rounded-[1.5rem] border-2 transition-all duration-300 cursor-pointer group relative overflow-hidden ${isSelected ? 'border-violet-500 bg-violet-950/20' : 'border-slate-800 bg-slate-900/40 hover:border-slate-600'}`}
                   >
                     <div className="flex items-center gap-5">
                       <div className="relative">
                         <img src={p.sprite} className={`w-14 h-14 rounded-2xl object-cover border-2 transition-all duration-500 ${isSelected ? 'border-violet-400 scale-105' : 'border-slate-700 opacity-60'}`} />
                         {isDeployed && (
                           <div className="absolute -top-1 -left-1 w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center text-[10px] text-slate-950 font-black border-2 border-slate-950 shadow-xl">
                             {partySlotIdx + 1}
                           </div>
                         )}
                       </div>
                       <div className="flex-1 min-w-0">
                         <h4 className={`font-cinzel text-sm truncate ${isSelected ? 'text-white font-black' : 'text-slate-500'}`}>{p.name}</h4>
                         <div className="flex justify-between items-center mt-1.5">
                           <span className="text-[10px] text-violet-500 font-mono font-bold tracking-widest">LV {p.level}</span>
                           <span className={`text-[8px] uppercase font-mono font-black ${getRarityStyle(p.rarity)}`}>{p.rarity?.replace(/_/g, ' ')}</span>
                         </div>
                       </div>
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>

          {/* Detailed Hero Panel */}
          <div className="md:col-span-8 glass rounded-[3rem] border-slate-800 flex flex-col overflow-hidden h-[60vh] md:h-auto shadow-2xl relative">
            <div className="absolute inset-0 bg-violet-600/5 pointer-events-none opacity-20"></div>
            
            <nav className="flex border-b border-slate-800/50 bg-slate-900/40 h-14 md:h-20 flex-shrink-0 relative z-10">
              {(['LINEUP', 'STATS', 'EQUIP', 'SKILLS'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveSubTab(tab); setLineupSlotToFill(null); setEquippingSlot(null); }}
                  className={`flex-1 font-cinzel text-[10px] md:text-xs font-black tracking-[0.3em] transition-all uppercase ${activeSubTab === tab ? 'text-violet-400 bg-violet-500/5' : 'text-slate-600 hover:text-slate-400'}`}
                >
                  {tab}
                  {activeSubTab === tab && <div className="absolute bottom-0 h-1 bg-violet-500 transition-all" style={{ width: '25%', left: `${(['LINEUP', 'STATS', 'EQUIP', 'SKILLS'].indexOf(tab)) * 25}%` }}></div>}
                </button>
              ))}
            </nav>

            <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar relative z-10">
               {activeSubTab === 'LINEUP' && (
                 <div className="h-full flex flex-col items-center justify-center animate-in fade-in duration-700">
                    <div className="text-center mb-12">
                      <h3 className="text-3xl font-cinzel text-white font-black tracking-widest uppercase mb-3">Deployment Protocol</h3>
                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.5em]">Sync signatures for expedition readiness</p>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-4xl">
                      {[0, 1, 2, 3].map(slotIdx => {
                        const deployed = activeParty[slotIdx];
                        const selecting = lineupSlotToFill === slotIdx;
                        return (
                          <div key={slotIdx} className="flex flex-col items-center gap-5">
                             <div 
                               onClick={() => setLineupSlotToFill(selecting ? null : slotIdx)}
                               className={`w-full aspect-[4/5] rounded-[2.5rem] border-4 flex flex-col items-center justify-center transition-all duration-500 cursor-pointer overflow-hidden shadow-2xl ${selecting ? 'border-violet-500 bg-violet-950/40 ring-4 ring-violet-500/20' : deployed ? 'border-slate-800 bg-slate-900 hover:border-violet-500/50' : 'border-slate-900 border-dashed bg-black/40 hover:bg-slate-900/20'}`}
                             >
                               {deployed ? (
                                 <div className="relative w-full h-full">
                                    <img src={deployed.sprite} className="w-full h-full object-cover brightness-75 group-hover:brightness-100 transition-all duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                                    <div className="absolute bottom-4 left-0 w-full text-center">
                                       <div className="text-[8px] font-black text-violet-400 font-mono uppercase tracking-widest mb-1">Sector ready</div>
                                       <div className="text-xs font-cinzel text-white font-black uppercase truncate px-2">{deployed.name}</div>
                                    </div>
                                    <button 
                                       onClick={(e) => { e.stopPropagation(); onUpdateParty(activeParty.filter(h => h.id !== deployed.id)); }}
                                       className="absolute top-4 right-4 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-xs text-white shadow-2xl hover:bg-red-500 transition-all border-2 border-slate-950"
                                    >
                                       <i className="fas fa-times"></i>
                                    </button>
                                 </div>
                               ) : (
                                 <div className="flex flex-col items-center gap-4 text-slate-800">
                                   <i className="fas fa-plus-circle text-4xl"></i>
                                   <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono">Assign {slotIdx + 1}</span>
                                 </div>
                               )}
                             </div>
                          </div>
                        );
                      })}
                    </div>
                 </div>
               )}

               {activeSubTab === 'STATS' && (
                 <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-500">
                    <div className="flex items-center gap-6">
                       <div className="w-20 h-20 bg-violet-600/10 rounded-3xl flex items-center justify-center text-violet-400 border border-violet-500/20 shadow-inner">
                         <i className="fas fa-dna text-3xl"></i>
                       </div>
                       <div>
                         <h3 className="text-4xl font-cinzel text-white font-black tracking-widest uppercase mb-1">{hero?.name || "Select Hero"}</h3>
                         <div className="flex gap-4">
                            <span className="text-xs text-violet-500 font-mono font-bold uppercase tracking-widest">Level {hero?.level || 0} Combat Unit</span>
                            <span className={`text-xs font-mono font-black uppercase tracking-widest ${getRarityStyle(hero?.rarity)}`}>{hero?.rarity?.replace(/_/g, ' ') || 'N/A'}</span>
                         </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                       {[
                         { label: 'Attack Matrix', stat: 'attack', icon: 'fa-sword', color: 'text-red-500', sub: 'Primary Strike Force' },
                         { label: 'Neural Guard', stat: 'defense', icon: 'fa-shield-halved', color: 'text-blue-500', sub: 'Damage Mitigation' },
                         { label: 'Bio Mass', stat: 'maxHp', icon: 'fa-heart-pulse', color: 'text-emerald-500', sub: 'Structural Integrity' }
                       ].map(s => {
                          const enhancementCost = 50 * (hero?.level || 1); // Increased cost (was 25)
                          return (
                            <div key={s.stat} className="glass p-8 rounded-[2rem] border-slate-800 flex items-center justify-between group hover:border-violet-500/30 transition-all duration-500">
                               <div className="flex items-center gap-8">
                                  <i className={`fas ${s.icon} ${s.color} text-4xl w-12 text-center opacity-40 group-hover:opacity-100 transition-opacity duration-500`}></i>
                                  <div>
                                     <div className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] mb-1">{s.label}</div>
                                     <div className="text-3xl font-mono text-white font-black leading-none">{(hero && hero[s.stat as keyof Unit] as number)?.toLocaleString() || 0}</div>
                                     <div className="text-[8px] text-slate-700 font-mono mt-2 uppercase tracking-widest">{s.sub}</div>
                                  </div>
                               </div>
                               <button 
                                 onClick={() => {
                                   if (hero && shards >= enhancementCost) {
                                     onSpendShards(enhancementCost);
                                     const next = { ...hero };
                                     if (s.stat === 'maxHp') next.maxHp += 15; // Decreased gain (was 20)
                                     else if (s.stat === 'attack') next.attack += 2; // Decreased gain (was 3)
                                     else next.defense += 2; // Decreased gain (was 3)
                                     onUpdateHero(next);
                                     soundService.play('MAGIC');
                                   }
                                 }}
                                 disabled={!hero || shards < enhancementCost}
                                 className="px-8 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-20 text-white rounded-xl text-[10px] font-black font-cinzel tracking-widest uppercase transition-all shadow-xl shadow-violet-950"
                               >
                                 Enhance ({enhancementCost})
                               </button>
                            </div>
                          );
                       })}
                    </div>
                 </div>
               )}

               {activeSubTab === 'EQUIP' && hero && (
                 <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-500">
                   <h3 className="text-4xl font-cinzel text-white font-black tracking-widest uppercase mb-1">{hero.name}</h3>
                   <div className="grid grid-cols-2 gap-8">
                     {(['WEAPON', 'ARMOR'] as const).map(slot => (
                       <div key={slot} className="flex flex-col items-center gap-4">
                         <span className="text-[10px] font-black font-cinzel text-slate-500 uppercase tracking-widest">{slot} Slot</span>
                         <div 
                           onClick={() => setEquippingSlot(slot)}
                           className={`relative w-40 h-52 rounded-2xl border-4 flex flex-col items-center justify-center p-3 transition-all duration-300 cursor-pointer overflow-hidden shadow-xl
                             ${equippingSlot === slot ? 'border-violet-500 bg-violet-950/20 ring-4 ring-violet-500/20' : 'border-slate-800 bg-slate-900/40 hover:border-violet-500/50'}
                           `}
                         >
                           {hero.equipment[slot] ? (
                             <>
                               <img src={`https://picsum.photos/seed/equip-${hero.equipment[slot]?.id}/100/150`} className="w-full h-full object-cover brightness-75" />
                               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                               <div className="absolute bottom-4 left-0 w-full text-center">
                                 <span className="text-xs font-cinzel text-white font-black uppercase truncate px-2">{hero.equipment[slot]?.name}</span>
                                 <span className="text-[8px] font-mono text-slate-500 block">+{hero.equipment[slot]?.value} {hero.equipment[slot]?.stat.toUpperCase()}</span>
                               </div>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleUnequipItem(slot); }}
                                 className="absolute top-2 right-2 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-xs text-white shadow-2xl hover:bg-red-500 transition-all border-2 border-slate-950"
                               >
                                 <i className="fas fa-times"></i>
                               </button>
                             </>
                           ) : (
                             <div className="flex flex-col items-center gap-4 text-slate-800">
                               <i className={`fas ${slot === 'WEAPON' ? 'fa-sword' : 'fa-shield-halved'} text-4xl`}></i>
                               <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono">Empty</span>
                             </div>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>

                   {equippingSlot && (
                     <div className="mt-10">
                       <h4 className="text-xl font-cinzel text-white font-black tracking-widest uppercase mb-4">Available {equippingSlot}s</h4>
                       {filteredInventory.length === 0 ? (
                         <p className="text-slate-500 italic text-sm text-center">No available {equippingSlot}s in inventory.</p>
                       ) : (
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-64 overflow-y-auto custom-scrollbar">
                           {filteredInventory.map(item => (
                             <button 
                               key={item.id} 
                               onClick={() => handleEquipItem(item, equippingSlot)}
                               className="group p-3 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-emerald-500/50 hover:bg-emerald-950/20 transition-all flex items-center gap-4 text-left relative"
                             >
                               <img src={`https://picsum.photos/seed/inv-${item.id}/50/50`} className="w-10 h-10 rounded-lg object-cover border border-slate-700" />
                               <div>
                                 <span className="text-xs font-cinzel text-white font-black block truncate">{item.name}</span>
                                 <span className="text-[8px] font-mono text-emerald-400 block">+{item.value} {item.stat.toUpperCase()}</span>
                               </div>
                               <div className="absolute top-2 right-2 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <i className="fas fa-arrow-up-from-bracket"></i>
                               </div>
                             </button>
                           ))}
                         </div>
                       )}
                     </div>
                   )}
                 </div>
               )}

               {activeSubTab === 'SKILLS' && hero && (
                 <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-500">
                   <h3 className="text-4xl font-cinzel text-white font-black tracking-widest uppercase mb-1">{hero.name}</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {hero.skills.map((skill, idx) => (
                       <div key={idx} className="glass p-6 rounded-2xl border-slate-800 flex flex-col group hover:border-violet-500/30 transition-all duration-500 relative">
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                           <i className="fas fa-bolt text-5xl"></i>
                         </div>
                         <h4 className="text-xl font-cinzel text-white font-black mb-2 flex items-center gap-3">
                           {skill.name}
                           {!skill.unlocked && <span className="text-[8px] font-mono text-red-500 uppercase tracking-widest ml-2">(Locked)</span>}
                         </h4>
                         <p className="text-slate-500 text-sm italic mb-4">{skill.description}</p>
                         <div className="mt-auto pt-4 border-t border-slate-800 flex justify-between items-center">
                           <span className="text-[10px] font-mono text-violet-400 font-bold">POWER: {skill.power}</span>
                           {skill.unlocked ? (
                             <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Active</span>
                           ) : (
                             skill.unlockCost && (
                               <button 
                                 onClick={() => handleUnlockSkill(skill)}
                                 disabled={shards < skill.unlockCost}
                                 className="px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-20 text-white rounded-lg text-[9px] font-black font-cinzel uppercase transition-all shadow-md"
                               >
                                 Unlock ({skill.unlockCost})
                               </button>
                             )
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {!hero && (
                 <div className="flex flex-col items-center justify-center h-full opacity-40">
                    <i className="fas fa-question-circle text-6xl text-slate-700 mb-6"></i>
                    <span className="text-xs font-cinzel font-black tracking-[0.5em] text-white uppercase">No Hero Selected</span>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroManagement;
import React, { useState } from 'react';
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
  onClose: () => void;
}

const HeroManagement: React.FC<HeroManagementProps> = ({ allHeroes, activeParty, inventory, shards, onUpdateHero, onUpdateParty, onSpendShards, onClose }) => {
  const [selectedHeroIdx, setSelectedHeroIdx] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState<'LINEUP' | 'STATS' | 'EQUIP' | 'SKILLS'>('LINEUP');
  const [equippingSlot, setEquippingSlot] = useState<'WEAPON' | 'ARMOR' | null>(null);
  const [lineupSlotToFill, setLineupSlotToFill] = useState<number | null>(null);
  
  const [rosterFilterTrait, setRosterFilterTrait] = useState<Trait | 'ALL'>('ALL');
  const [rosterSortBy, setRosterSortBy] = useState<'level' | 'rarity' | 'attack'>('rarity');

  const [equipSortTrait, setEquipSortTrait] = useState<Trait | 'ALL'>('ALL');
  const [equipSortStat, setEquipSortStat] = useState<'attack' | 'defense' | 'maxHp' | 'rarity'>('rarity');

  const getVisibleRoster = () => {
    return allHeroes.filter(h => {
      if (rosterFilterTrait === 'ALL') return true;
      return h.trait === rosterFilterTrait;
    }).sort((a, b) => {
      if (rosterSortBy === 'rarity') {
        const rarities = { 'COMMON': 0, 'RARE': 1, 'EPIC': 2, 'LEGENDARY': 3, 'UBER_SUPER_RARE': 4, 'INSANE': 5 };
        return (rarities[b.rarity || 'COMMON'] || 0) - (rarities[a.rarity || 'COMMON'] || 0);
      }
      return (b[rosterSortBy] as number) - (a[rosterSortBy] as number);
    });
  };

  const visibleRoster = getVisibleRoster();
  const hero = visibleRoster[selectedHeroIdx] || visibleRoster[0] || allHeroes[0];

  const upgradeStat = (stat: 'attack' | 'defense' | 'maxHp') => {
    const cost = 25 * (hero.level);
    if (shards < cost) return;
    onSpendShards(cost);
    const updatedHero = { ...hero };
    if (stat === 'maxHp') {
      updatedHero.maxHp += 15;
      updatedHero.hp = updatedHero.maxHp;
    } else if (stat === 'attack') {
      updatedHero.attack += 2;
    } else {
      updatedHero.defense += 2;
    }
    onUpdateHero(updatedHero);
  };

  const unlockSkill = (skillName: string) => {
    const targetSkill = hero.skills.find(s => s.name === skillName);
    if (!targetSkill || targetSkill.unlocked || shards < (targetSkill.unlockCost || 0)) return;
    onSpendShards(targetSkill.unlockCost || 0);
    const updatedHero = {
      ...hero,
      skills: hero.skills.map(s => s.name === skillName ? { ...s, unlocked: true } : s)
    };
    onUpdateHero(updatedHero);
  };

  const equipItem = (item: Equipment) => {
    const updatedHero = { ...hero, equipment: { ...hero.equipment } };
    if (item.slot === 'WEAPON') updatedHero.equipment.weapon = item;
    else updatedHero.equipment.armor = item;
    onUpdateHero(updatedHero);
    setEquippingSlot(null);
  };

  const equipBest = () => {
    if (!hero) return;
    const weapons = inventory.filter(i => i.slot === 'WEAPON');
    const bestWeapon = weapons.length > 0 
      ? weapons.reduce((prev, current) => (prev.value > current.value) ? prev : current)
      : hero.equipment.weapon;
    const armors = inventory.filter(i => i.slot === 'ARMOR');
    const bestArmor = armors.length > 0 
      ? armors.reduce((prev, current) => (prev.value > current.value) ? prev : current)
      : hero.equipment.armor;
    const updatedHero = { ...hero, equipment: { weapon: bestWeapon, armor: bestArmor } };
    onUpdateHero(updatedHero);
    soundService.play('MAGIC');
  };

  const assignHeroToSlot = (targetHero: Unit) => {
    if (lineupSlotToFill === null) return;
    const currentPartyArray = [activeParty[0] || null, activeParty[1] || null, activeParty[2] || null, activeParty[3] || null];
    const existingSlotIdx = currentPartyArray.findIndex(h => h && h.id === targetHero.id);
    if (existingSlotIdx !== -1) {
      const temp = currentPartyArray[lineupSlotToFill];
      currentPartyArray[lineupSlotToFill] = targetHero;
      currentPartyArray[existingSlotIdx] = temp;
    } else {
      currentPartyArray[lineupSlotToFill] = targetHero;
    }
    onUpdateParty(currentPartyArray.filter((h): h is Unit => !!h));
    setLineupSlotToFill(null);
  };

  const removeHeroFromSlot = (slotIdx: number) => {
    const currentPartyArray = [activeParty[0] || null, activeParty[1] || null, activeParty[2] || null, activeParty[3] || null];
    currentPartyArray[slotIdx] = null;
    onUpdateParty(currentPartyArray.filter((h): h is Unit => !!h));
    setLineupSlotToFill(null);
  };

  const getEffStat = (unit: Unit, stat: 'attack' | 'defense' | 'maxHp') => {
    if (!unit) return 0;
    let val = unit[stat];
    if (unit.equipment.weapon?.stat === stat) val += unit.equipment.weapon.value;
    if (unit.equipment.armor?.stat === stat) val += unit.equipment.armor.value;
    return val;
  };

  const getRarityText = (rarity: Unit['rarity']) => {
    switch (rarity) {
      case 'INSANE': return 'text-red-500 font-black italic drop-shadow-[0_0_5px_rgba(255,0,0,0.5)]';
      case 'UBER_SUPER_RARE': return 'text-purple-400 font-black';
      case 'LEGENDARY': return 'text-amber-400 font-bold';
      case 'EPIC': return 'text-amber-500';
      case 'RARE': return 'text-blue-400';
      default: return 'text-slate-500';
    }
  };

  const filteredInventory = inventory.filter(i => {
    if (equippingSlot && i.slot !== equippingSlot) return false;
    if (equipSortTrait !== 'ALL' && i.trait !== equipSortTrait) return false;
    return true;
  }).sort((a, b) => {
    if (equipSortStat === 'rarity') {
        const rarities = { 'COMMON': 0, 'RARE': 1, 'EPIC': 2, 'LEGENDARY': 3, 'UBER_SUPER_RARE': 4, 'INSANE': 5 };
        return (rarities[b.rarity || 'COMMON'] || 0) - (rarities[a.rarity || 'COMMON'] || 0);
    }
    return (b.value) - (a.value);
  });

  return (
    <div className="w-full h-screen bg-slate-950 p-4 md:p-8 flex flex-col items-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-violet-600/5 blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-7xl w-full flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="flex justify-between items-center mb-6 md:mb-8 flex-shrink-0">
          <div>
            <h2 className="text-2xl md:text-4xl font-cinzel text-violet-400 text-glow font-black tracking-widest uppercase leading-none">Sanctuary</h2>
            <p className="hidden md:block text-slate-500 font-cinzel text-[10px] uppercase tracking-[0.2em] mt-1">Tactical Planning & Enhancement</p>
          </div>
          <div className="flex gap-2 md:gap-4">
            <div className="glass px-4 md:px-6 py-1.5 md:py-2 rounded-full border-violet-500/30 flex items-center gap-2">
              <i className="fas fa-gem text-violet-400 text-xs md:text-base"></i>
              <span className="font-mono text-sm md:text-xl font-bold">{shards}</span>
            </div>
            <button onClick={onClose} className="p-2 md:p-3 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-all group">
              <i className="fas fa-times text-slate-400 group-hover:text-white text-xs md:text-base"></i>
            </button>
          </div>
        </header>

        <div className="flex flex-col md:grid md:grid-cols-12 gap-6 flex-1 overflow-hidden">
          {/* Roster List - Collapsible on mobile or smaller footprint */}
          <div className="md:col-span-4 flex flex-col gap-3 overflow-hidden min-h-[120px] md:min-h-0 h-1/3 md:h-auto">
            <div className="flex flex-col gap-2 glass p-3 rounded-2xl border-slate-800 flex-shrink-0">
               <div className="flex justify-between items-center">
                  <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest font-cinzel">Filter Signatures</span>
                  <button onClick={() => { setRosterFilterTrait('ALL'); setRosterSortBy('rarity'); }} className="text-[7px] text-violet-400 font-bold hover:underline">RESET</button>
               </div>
               <div className="flex flex-wrap gap-1.5">
                  {(['ALL', 'VOID', 'CRIMSON', 'AETHER', 'STEEL', 'NEBULA'] as const).map(t => (
                    <button 
                      key={t}
                      onClick={() => setRosterFilterTrait(t)}
                      className={`px-2 py-0.5 rounded-full text-[7px] font-black tracking-tighter border transition-all ${rosterFilterTrait === t ? 'bg-violet-600 border-violet-400 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                    >
                      {t}
                    </button>
                  ))}
               </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
              {visibleRoster.length > 0 ? visibleRoster.map((p, idx) => {
                const partySlotIdx = activeParty.findIndex(h => h && h.id === p.id);
                const isDeployed = partySlotIdx !== -1;
                const isSelected = hero?.id === p.id;
                return (
                  <div 
                    key={p.id}
                    onClick={() => {
                      setSelectedHeroIdx(idx); 
                      if (lineupSlotToFill !== null) assignHeroToSlot(p);
                    }}
                    className={`p-3 md:p-4 rounded-xl border-2 transition-all cursor-pointer group relative overflow-hidden ${isSelected ? 'border-violet-500 bg-violet-900/10' : 'border-slate-800 bg-slate-900/30'}`}
                  >
                    {isDeployed && (
                      <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[6px] md:text-[7px] font-black px-1.5 md:py-0.5 rounded-bl uppercase tracking-tighter shadow-lg">
                        SLOT {partySlotIdx + 1}
                      </div>
                    )}
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="relative">
                        <img src={p.sprite} className={`w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover border-2 transition-all ${isSelected ? 'border-violet-400 scale-105' : 'border-slate-700'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-cinzel text-[10px] md:text-xs truncate ${isSelected ? 'text-white font-bold' : 'text-slate-400'}`}>{p.name}</h4>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[8px] md:text-[9px] text-violet-400 font-black">LV {p.level}</span>
                          <span className={`text-[7px] md:text-[8px] uppercase ${getRarityText(p.rarity)}`}>{p.rarity?.replace(/_/g, ' ') || 'COMMON'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="p-4 md:p-8 text-center glass rounded-2xl border-slate-800">
                   <p className="text-[9px] md:text-[10px] text-slate-600 font-cinzel">No signatures match filter criteria</p>
                </div>
              )}
            </div>
          </div>

          {/* Hero Detail Area */}
          <div className="md:col-span-8 glass rounded-3xl border-slate-800 flex flex-col overflow-hidden h-2/3 md:h-auto">
            {!hero ? (
              <div className="flex-1 flex items-center justify-center text-slate-600 font-cinzel italic text-sm">Select an echo to view profile</div>
            ) : (
              <>
                <div className="flex border-b border-slate-800 h-12 md:h-14 bg-slate-900/30 flex-shrink-0">
                    {(['LINEUP', 'STATS', 'EQUIP', 'SKILLS'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => { setActiveSubTab(tab); setLineupSlotToFill(null); setEquippingSlot(null); }}
                            className={`flex-1 font-cinzel text-[8px] md:text-[10px] font-black tracking-widest transition-all ${activeSubTab === tab ? 'bg-violet-600/10 text-violet-400 border-b-2 border-violet-500' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar">
                  {activeSubTab === 'LINEUP' && (
                    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300 flex flex-col items-center">
                      <div className="text-center">
                        <h3 className="text-lg md:text-2xl font-cinzel text-white font-black tracking-widest uppercase mb-1 md:mb-2">Expedition Lineup</h3>
                        <p className="text-[8px] md:text-[10px] text-slate-500 font-cinzel uppercase tracking-[0.2em]">Deploy Echoes for optimal resistance</p>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full max-w-2xl md:max-w-none">
                        {[0, 1, 2, 3].map(slotIdx => {
                          const deployedHero = activeParty[slotIdx];
                          const isAssigning = lineupSlotToFill === slotIdx;
                          return (
                            <div key={slotIdx} className="flex flex-col items-center gap-4 relative">
                               <div 
                                 onClick={() => setLineupSlotToFill(isAssigning ? null : slotIdx)}
                                 className={`w-full aspect-square rounded-2xl md:rounded-3xl border-4 flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden group relative ${isAssigning ? 'border-violet-500 bg-violet-600/20' : deployedHero ? 'border-emerald-500/50 bg-slate-900' : 'border-slate-800 border-dashed bg-slate-950/50'}`}
                               >
                                 {deployedHero ? (
                                   <>
                                     <img src={deployedHero.sprite} className="w-full h-full object-cover" />
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); removeHeroFromSlot(slotIdx); }}
                                        className="absolute top-1 md:top-2 right-1 md:right-2 w-5 h-5 md:w-7 md:h-7 bg-red-600 rounded-full flex items-center justify-center text-[9px] md:text-[11px] text-white shadow-xl hover:bg-red-500 active:scale-90 transition-all z-20 border-2 border-slate-950"
                                      >
                                       <i className="fas fa-times"></i>
                                     </button>
                                   </>
                                 ) : (
                                   <div className="flex flex-col items-center gap-1.5 text-slate-700">
                                     <i className="fas fa-plus text-base md:text-2xl"></i>
                                     <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest font-cinzel">Slot {slotIdx + 1}</span>
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
                    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 md:w-10 md:h-10 bg-violet-600/20 rounded-xl flex items-center justify-center text-violet-400 border border-violet-500/20">
                           <i className="fas fa-chart-line text-sm md:text-lg"></i>
                         </div>
                         <div>
                           <h3 className="text-base md:text-xl font-cinzel text-white font-black tracking-widest uppercase">{hero.name}</h3>
                           <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${getRarityText(hero.rarity)}`}>{hero.rarity?.replace(/_/g, ' ')}</p>
                         </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 md:gap-4">
                        {([
                          { label: 'ATTACK', stat: 'attack', icon: 'fa-sword', color: 'text-red-400', bg: 'bg-red-400/5' },
                          { label: 'DEFENSE', stat: 'defense', icon: 'fa-shield-halved', color: 'text-blue-400', bg: 'bg-blue-400/5' },
                          { label: 'MAX HP', stat: 'maxHp', icon: 'fa-heart', color: 'text-emerald-400', bg: 'bg-emerald-400/5' }
                        ] as const).map(s => (
                          <div key={s.stat} className={`flex flex-col sm:flex-row items-center justify-between ${s.bg} p-4 md:p-5 rounded-xl md:rounded-2xl border border-slate-800 transition-all gap-3`}>
                            <div className="flex items-center gap-4 md:gap-5 w-full sm:w-auto">
                              <i className={`fas ${s.icon} ${s.color} text-xl md:text-2xl w-6 md:w-8 text-center`}></i>
                              <div>
                                <div className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-0.5 md:mb-1">{s.label}</div>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-xl md:text-2xl font-mono text-white font-bold">{getEffStat(hero, s.stat)}</span>
                                  <span className="text-[9px] md:text-xs text-slate-600">Base: {hero[s.stat]}</span>
                                </div>
                              </div>
                            </div>
                            <button 
                              onClick={() => upgradeStat(s.stat)} 
                              disabled={shards < 25 * hero.level} 
                              className="w-full sm:w-auto px-4 md:px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-30 text-white rounded-lg text-[8px] md:text-[10px] font-black font-cinzel tracking-widest transition-all shadow-lg"
                            >
                              UPGRADE ({25 * hero.level})
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSubTab === 'EQUIP' && (
                    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                           <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                             <i className="fas fa-shield-halved text-sm md:text-lg"></i>
                           </div>
                           <div>
                             <h3 className="text-base md:text-xl font-cinzel text-white font-black tracking-widest uppercase truncate max-w-[150px]">{hero.name}</h3>
                             <p className="text-[8px] md:text-[9px] text-slate-500 font-bold uppercase tracking-widest">Active Equipment</p>
                           </div>
                        </div>
                        <button 
                          onClick={equipBest}
                          className="w-full sm:w-auto px-4 md:px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[8px] md:text-[10px] font-black font-cinzel tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                        >
                          <i className="fas fa-wand-magic-sparkles"></i>
                          OPTIMIZE
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                          <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all flex flex-col gap-2 md:gap-3 ${equippingSlot === 'WEAPON' ? 'border-violet-500 bg-violet-900/5' : 'border-slate-800 bg-slate-900/30'}`}>
                            <div className="flex items-center gap-2 md:gap-3">
                                <i className="fas fa-sword text-lg md:text-xl text-violet-400"></i>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[7px] md:text-[8px] font-black text-slate-600 uppercase">Weapon</div>
                                    <div className="font-cinzel text-[10px] md:text-xs font-bold text-white truncate">{hero.equipment.weapon?.name || 'Empty'}</div>
                                    <div className={`text-[6px] md:text-[7px] uppercase font-bold ${getRarityText(hero.equipment.weapon?.rarity)}`}>{hero.equipment.weapon?.rarity?.replace(/_/g, ' ')}</div>
                                </div>
                            </div>
                            <button onClick={() => setEquippingSlot(equippingSlot === 'WEAPON' ? null : 'WEAPON')} className="w-full py-1.5 border border-slate-700 rounded text-[7px] md:text-[8px] font-black font-cinzel hover:bg-slate-800 transition-all uppercase">
                              {equippingSlot === 'WEAPON' ? 'CANCEL' : 'MODIFY'}
                            </button>
                          </div>
                          <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all flex flex-col gap-2 md:gap-3 ${equippingSlot === 'ARMOR' ? 'border-violet-500 bg-violet-900/5' : 'border-slate-800 bg-slate-900/30'}`}>
                            <div className="flex items-center gap-2 md:gap-3">
                                <i className="fas fa-shield text-lg md:text-xl text-blue-400"></i>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[7px] md:text-[8px] font-black text-slate-600 uppercase">Armor</div>
                                    <div className="font-cinzel text-[10px] md:text-xs font-bold text-white truncate">{hero.equipment.armor?.name || 'Empty'}</div>
                                    <div className={`text-[6px] md:text-[7px] uppercase font-bold ${getRarityText(hero.equipment.armor?.rarity)}`}>{hero.equipment.armor?.rarity?.replace(/_/g, ' ')}</div>
                                </div>
                            </div>
                            <button onClick={() => setEquippingSlot(equippingSlot === 'ARMOR' ? null : 'ARMOR')} className="w-full py-1.5 border border-slate-700 rounded text-[7px] md:text-[8px] font-black font-cinzel hover:bg-slate-800 transition-all uppercase">
                              {equippingSlot === 'ARMOR' ? 'CANCEL' : 'MODIFY'}
                            </button>
                          </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[30vh] md:max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredInventory.map(item => (
                                <button 
                                  key={item.id} 
                                  onClick={() => equipItem(item)} 
                                  className={`p-2.5 md:p-3 bg-slate-900 border border-slate-800 rounded-xl text-left hover:border-violet-500 transition-all group flex items-center gap-3 ${hero.equipment.weapon?.id === item.id || hero.equipment.armor?.id === item.id ? 'opacity-50 ring-2 ring-emerald-500' : ''}`}
                                >
                                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center border ${item.slot === 'WEAPON' ? 'border-violet-500/30 text-violet-400' : 'border-blue-500/30 text-blue-400'}`}>
                                       <i className={`fas ${item.slot === 'WEAPON' ? 'fa-sword' : 'fa-shield-halved'} text-[10px] md:text-xs`}></i>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center">
                                          <span className="text-[8px] md:text-[9px] font-bold text-white font-cinzel group-hover:text-violet-400 truncate w-24 md:w-auto">{item.name}</span>
                                          <span className="text-[7px] md:text-[8px] font-mono font-bold text-slate-500">+{item.value}</span>
                                        </div>
                                        <div className={`text-[6px] uppercase font-black ${getRarityText(item.rarity)}`}>{item.rarity?.replace(/_/g, ' ')}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSubTab === 'SKILLS' && (
                    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-300">
                      <div className="grid grid-cols-1 gap-3 md:gap-4">
                          {hero.skills.map((skill, idx) => (
                            <div key={idx} className={`p-4 md:p-5 rounded-xl md:rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${skill.unlocked ? 'border-emerald-500/20 bg-emerald-950/5' : 'border-slate-800 bg-slate-900/30'}`}>
                                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${skill.unlocked ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-slate-950 text-slate-600'}`}>
                                        <i className={`fas ${skill.type === 'HEAL' ? 'fa-heart-pulse' : 'fa-bolt-lightning'} text-lg md:text-xl`}></i>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-cinzel text-xs md:text-sm font-bold truncate ${skill.unlocked ? 'text-white' : 'text-slate-600'}`}>{skill.name}</span>
                                        </div>
                                        <p className="text-[8px] md:text-[10px] text-slate-500 max-w-sm mt-0.5 md:mt-1 line-clamp-2">{skill.description}</p>
                                    </div>
                                </div>
                                {!skill.unlocked && (
                                    <button 
                                        onClick={() => unlockSkill(skill.name)}
                                        disabled={shards < (skill.unlockCost || 0)}
                                        className="flex flex-col items-center flex-shrink-0 px-3 md:px-6 py-1.5 md:py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-30 rounded-lg shadow-lg transition-all"
                                    >
                                        <span className="text-[7px] md:text-[9px] font-black font-cinzel text-white">UNLOCK</span>
                                        <span className="text-[6px] md:text-[8px] font-mono font-bold text-amber-100">{skill.unlockCost}</span>
                                    </button>
                                )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroManagement;
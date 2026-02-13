
import { Unit, Stage, Skill, Equipment, Trait, Rarity } from './types';

// Skill Base Definitions
const BasicSlash: Skill = { name: "Void Slash", description: "A quick dimensional strike.", power: 12, type: 'ATTACK', unlocked: true };
const StunStrike: Skill = { name: "Concussive Blow", description: "Chance to STUN.", power: 10, type: 'ATTACK', effects: [{ type: 'STUN', chance: 0.4 }], unlocked: false, unlockCost: 450 };
const WeakenBolt: Skill = { name: "Eldritch Bolt", description: "Corrupts enemy strength.", power: 12, type: 'ATTACK', effects: [{ type: 'WEAKEN', chance: 0.85, value: 0.5 }], unlocked: false, unlockCost: 700 };
const ArcaneBolt: Skill = { name: "Spirit Surge", description: "A blast of pure essence.", power: 15, type: 'ATTACK', unlocked: true };
const Mend: Skill = { name: "Resonance", description: "Harmonizes and heals an ally.", power: 65, type: 'HEAL', unlocked: true };
const FireBreath: Skill = { name: "Inferno", description: "Incinerates the void.", power: 20, type: 'ATTACK', unlocked: true };
const FrostNova: Skill = { name: "Frost Nova", description: "Slows the enemy's heart.", power: 18, type: 'ATTACK', effects: [{ type: 'WEAKEN', chance: 0.5, value: 0.7 }], unlocked: true };
const ChaosPulse: Skill = { name: "Chaos Pulse", description: "Unpredictable energy.", power: 25, type: 'ATTACK', unlocked: true };
const SolarFlare: Skill = { name: "Solar Flare", description: "Blinding light strike.", power: 30, type: 'ATTACK', unlocked: true };
const OblivionGaze: Skill = { name: "Singularity Gaze", description: "Crushing damage.", power: 45, type: 'ATTACK', unlocked: false, unlockCost: 6000 };
const DivineLight: Skill = { name: "Celestial Dawn", description: "Full party restoration.", power: 180, type: 'HEAL', unlocked: false, unlockCost: 4000 };
const Apocalypse: Skill = { name: "Apocalypse", description: "Deletes the enemy's timeline.", power: 999, type: 'ATTACK', unlocked: true };

const TRAITS: Trait[] = ['VOID', 'CRIMSON', 'AETHER', 'STEEL', 'NEBULA', 'BEHEMOTH', 'SOLAR', 'LUNAR', 'STORM', 'VENOM', 'FROST', 'CHAOS', 'PHANTOM', 'GLITCH', 'PRIME'];
const NAMES = ["Kaelen", "Lyra", "Jax", "Seren", "Brutus", "Vex", "Celia", "Orym", "Malphas", "Elias", "Soren", "Frey", "Gunnar", "Mina", "Alaric", "Bryn", "Caelum", "Dara", "Elowen", "Fenris", "Gala", "Hesper", "Idris", "Juno", "Kael", "Lior", "Mira", "Nyx", "Orion", "Pax", "Quinn", "Rune", "Selene", "Thane", "Ursa", "Vora", "Wren", "Xenon", "Yara", "Zephyr", "Astra", "Boreas", "Cyra", "Drakon", "Eos", "Fauna", "Gorgon", "Helios", "Iris", "Jace", "Kira", "Luna", "Midas", "Nova", "Oberon", "Petra", "Rhea", "Silas", "Titus", "Vesta"];

const generateHeroPool = (): Unit[] => {
  const pool: Unit[] = [];
  const rarities: Rarity[] = ['RARE', 'EPIC', 'LEGENDARY', 'UBER_SUPER_RARE', 'INSANE'];
  
  rarities.forEach(rarity => {
    for (let i = 0; i < 55; i++) {
      const trait = TRAITS[Math.floor(Math.random() * TRAITS.length)];
      const name = `${NAMES[Math.floor(Math.random() * NAMES.length)]} ${i + 1}`;
      const rarityMultiplier = rarities.indexOf(rarity) + 1;
      
      const unit: Unit = {
        id: `hero-${rarity}-${i}`,
        name: name,
        level: 1,
        exp: 0,
        maxExp: 100 * rarityMultiplier,
        maxHp: 80 * rarityMultiplier + Math.floor(Math.random() * 50),
        hp: 80 * rarityMultiplier,
        attack: 10 * rarityMultiplier + Math.floor(Math.random() * 10),
        defense: 5 * rarityMultiplier + Math.floor(Math.random() * 5),
        speed: 10 + Math.floor(Math.random() * 10),
        type: 'HERO',
        trait: trait,
        sprite: `https://picsum.photos/seed/${name}/200/200`,
        skills: [BasicSlash, ArcaneBolt, ChaosPulse, SolarFlare, FrostNova].slice(0, 2 + Math.floor(Math.random() * 3)),
        abilities: [],
        rarity: rarity,
        equipment: { weapon: null, armor: null }
      };
      
      // Add special high-tier skills for insane/uber
      if (rarity === 'INSANE' || rarity === 'UBER_SUPER_RARE') {
        unit.skills.push(Apocalypse);
        unit.skills.push(OblivionGaze);
      }
      
      pool.push(unit);
    }
  });
  
  return pool;
};

export const HERO_POOL: Unit[] = generateHeroPool();

export const INITIAL_EQUIPMENT: Equipment[] = [
  { id: 'w1', name: 'Rusted Edge', slot: 'WEAPON', stat: 'attack', value: 8, description: 'Dull but reliable.', rarity: 'COMMON' },
  { id: 'a1', name: 'Scavenger Vest', slot: 'ARMOR', stat: 'defense', value: 6, description: 'Stitched together.', rarity: 'COMMON' },
];

export const GACHA_POOL: Equipment[] = ((): Equipment[] => {
    const items: Equipment[] = [];
    const rarities: Rarity[] = ['RARE', 'EPIC', 'LEGENDARY', 'UBER_SUPER_RARE', 'INSANE'];
    rarities.forEach(rarity => {
        for(let i = 0; i < 20; i++) {
            const mult = rarities.indexOf(rarity) + 1;
            const slot = Math.random() > 0.5 ? 'WEAPON' as const : 'ARMOR' as const;
            items.push({
                id: `eq-${rarity}-${i}`,
                name: `${rarity} Relic ${i+1}`,
                slot,
                stat: slot === 'WEAPON' ? 'attack' : Math.random() > 0.5 ? 'defense' : 'maxHp',
                value: 20 * mult + Math.floor(Math.random() * 20),
                description: `A signature ${rarity} artifact from Sector ${i}.`,
                rarity,
                trait: TRAITS[Math.floor(Math.random() * TRAITS.length)]
            });
        }
    });
    return items;
})();

export const INITIAL_PARTY: Unit[] = [HERO_POOL[0], HERO_POOL[55], HERO_POOL[110]];

const createEnemy = (id: string, name: string, hp: number, atk: number, def: number, trait: Trait, isBoss = false): Unit => ({
  id, name, level: 1, exp: 0, maxExp: 0, maxHp: hp, hp, attack: atk, defense: def, speed: 10, type: 'ENEMY', trait, sprite: `https://picsum.photos/seed/${name}/200/200`,
  skills: [{ name: isBoss ? 'Cataclysm' : 'Strike', power: isBoss ? 25 : 10, type: 'ATTACK', description: isBoss ? 'A world-ending blow.' : 'Simple hit', unlocked: true }],
  abilities: [], equipment: { weapon: null, armor: null }
});

export const CHAPTER_STAGES: Stage[] = ((): Stage[] => {
  const stages: Stage[] = [];
  const c = 1; // Single Chapter game
  for (let s = 1; s <= 10; s++) {
    const id = s;
    const isBoss = s === 10;
    
    // NERFED BY 50%:
    // Original: hp = 5000 / 50 + (s * 80)
    // Nerfed: 2500 / 25 + (s * 40)
    const hp = Math.floor(isBoss ? 2500 : 25 + (s * 40)); 
    const atk = Math.floor(isBoss ? 125 : 2.5 + (s * 5));
    const def = Math.floor(isBoss ? 40 : 1 + (s * 2));

    stages.push({
      id, chapterId: c, 
      name: isBoss ? `THE SINGULARITY OMEGA (NERFED)` : `Sector ${id}`, 
      description: isBoss ? `The final point of collapse.` : `A dangerous zone in Chapter ${c}.`, 
      loreNote: isBoss ? `Boss Signature Detected: 2,500 HP (Reduced). Damage Protocol Recalibrated.` : `Neural signatures detect moderate void activity in Sector ${id}.`,
      waves: isBoss 
        ? [
            [createEnemy(`e${id}-minion1`, `Void Vanguard`, 400, 32, 20, 'STEEL')],
            [createEnemy(`e${id}`, `VOID OMEGA`, hp, atk, def, 'VOID', true)]
          ]
        : [[createEnemy(`e${id}`, `Void Echo ${id}`, hp, atk, def, 'VOID')]],
      unlocked: id === 1, completed: false, isBoss, 
      expReward: isBoss ? 15000 : 200 * s, 
      shardReward: isBoss ? 10000 : 400 * s
    });
  }
  return stages;
})();

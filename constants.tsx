
import { Unit, Stage, Skill, Equipment, Trait, Rarity, Category } from './types';

// Skill Base Definitions
const BasicSlash: Skill = { name: "Void Slash", description: "A quick dimensional strike.", power: 15, type: 'ATTACK', unlocked: true };
const ArcaneBolt: Skill = { name: "Spirit Surge", description: "A blast of pure essence.", power: 18, type: 'ATTACK', unlocked: true };
const SolarFlare: Skill = { name: "Solar Flare", description: "Blinding light strike.", power: 35, type: 'ATTACK', unlocked: true };
const ChaosPulse: Skill = { name: "Chaos Pulse", description: "Unpredictable energy.", power: 28, type: 'ATTACK', unlocked: true };
const FrostNova: Skill = { name: "Frost Nova", description: "Slows the enemy's heart.", power: 20, type: 'ATTACK', effects: [{ type: 'WEAKEN', chance: 0.5, value: 0.7 }], unlocked: true };
const Apocalypse: Skill = { name: "Apocalypse", description: "Deletes the enemy's timeline.", power: 999, type: 'ATTACK', unlocked: true };

const TRAITS: Trait[] = ['VOID', 'CRIMSON', 'AETHER', 'STEEL', 'NEBULA', 'BEHEMOTH', 'SOLAR', 'LUNAR', 'STORM', 'VENOM', 'FROST', 'CHAOS', 'PHANTOM', 'GLITCH', 'PRIME'];
const NAMES = ["Kaelen", "Lyra", "Jax", "Seren", "Brutus", "Vex", "Celia", "Orym", "Malphas", "Elias", "Soren", "Frey", "Gunnar", "Mina", "Alaric", "Bryn", "Caelum", "Dara", "Elowen", "Fenris", "Gala", "Hesper", "Idris", "Juno", "Kael", "Lior", "Mira", "Nyx", "Orion", "Pax", "Quinn", "Rune", "Selene", "Thane", "Ursa", "Vora", "Wren", "Xenon", "Yara", "Zephyr", "Astra", "Boreas", "Cyra", "Drakon", "Eos", "Fauna", "Gorgon", "Helios", "Iris", "Jace", "Kira", "Luna", "Midas", "Nova", "Oberon", "Petra", "Rhea", "Silas", "Titus", "Vesta"];

const generateHeroPool = (): Unit[] => {
  const pool: Unit[] = [];
  const rarities: Rarity[] = ['RARE', 'EPIC', 'LEGENDARY', 'UBER_SUPER_RARE', 'INSANE'];
  rarities.forEach((rarity, rIdx) => {
    for (let i = 0; i < 55; i++) {
      const trait = TRAITS[Math.floor(Math.random() * TRAITS.length)];
      const name = `${NAMES[Math.floor(Math.random() * NAMES.length)]} ${i + 1}`;
      const rarityMultiplier = rIdx + 2.0; // BUFFED: Increased base multiplier for heroes (was 1.5)
      pool.push({
        id: `hero-${rarity}-${i}`,
        name: name,
        level: 1, exp: 0, maxExp: 100 * (rIdx + 1),
        maxHp: 200 * rarityMultiplier + Math.floor(Math.random() * 50), // BUFFED: Hero HP (was 100)
        hp: 200 * rarityMultiplier,
        attack: 25 * rarityMultiplier + Math.floor(Math.random() * 10), // BUFFED: Hero Attack (was 15)
        defense: 12 * rarityMultiplier + Math.floor(Math.random() * 5), // BUFFED: Hero Defense (was 8)
        speed: 20 + Math.floor(Math.random() * 10), // BUFFED: Hero Speed (was 15)
        type: 'HERO', trait: trait,
        sprite: `https://picsum.photos/seed/${name}/200/200`,
        skills: [BasicSlash, ArcaneBolt, ChaosPulse, SolarFlare, FrostNova].slice(0, 3 + Math.floor(Math.random() * 2)),
        abilities: [], rarity: rarity,
        equipment: { weapon: null, armor: null }
      });
    }
  });
  return pool;
};

export const HERO_POOL: Unit[] = generateHeroPool();
export const INITIAL_PARTY: Unit[] = [HERO_POOL[0], HERO_POOL[55], HERO_POOL[110]];

export const CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Empire of Echoes', description: 'Reclaim the primordial realms of the first singularity.', color: 'violet', icon: 'fa-globe', chapters: [1, 2, 3, 4, 5] },
  { id: 'cat-2', name: 'Into the Singularity', description: 'Pierce the veil into a world where time is broken.', color: 'blue', icon: 'fa-rocket', chapters: [6, 7, 8, 9, 10] },
  { id: 'cat-3', name: 'Nebula Cascade', description: 'Survive the crashing waves of interstellar data.', color: 'emerald', icon: 'fa-meteor', chapters: [11, 12, 13, 14, 15] },
  { id: 'cat-4', name: 'Final Collapse', description: 'Stand at the edge of existence. The end is now.', color: 'red', icon: 'fa-biohazard', chapters: [16, 17, 18, 19, 20] },
];

export const GACHA_POOL: Equipment[] = ((): Equipment[] => {
    const items: Equipment[] = [];
    const rarities: Rarity[] = ['RARE', 'EPIC', 'LEGENDARY', 'UBER_SUPER_RARE', 'INSANE'];
    rarities.forEach((rarity, rIdx) => {
        for(let i = 0; i < 20; i++) {
            const mult = rIdx + 1;
            const slot = Math.random() > 0.5 ? 'WEAPON' as const : 'ARMOR' as const;
            items.push({
                id: `eq-${rarity}-${i}`, name: `${rarity} Relic ${i+1}`, slot,
                stat: slot === 'WEAPON' ? 'attack' : Math.random() > 0.5 ? 'defense' : 'maxHp',
                value: 35 * mult + Math.floor(Math.random() * 20), // BUFFED: Equipment value (was 25)
                description: `Artifact from the void.`, rarity,
                trait: TRAITS[Math.floor(Math.random() * TRAITS.length)]
            });
        }
    });
    return items;
})();

const createEnemy = (id: string, name: string, hp: number, atk: number, def: number, trait: Trait, isBoss = false): Unit => ({
  id, name, level: 1, exp: 0, maxExp: 0, maxHp: hp, hp, attack: atk, defense: def, speed: 8, type: 'ENEMY', trait, sprite: `https://picsum.photos/seed/${name}/200/200`,
  skills: [{ name: isBoss ? 'Cataclysm' : 'Strike', power: isBoss ? 15 : 6, type: 'ATTACK', description: isBoss ? 'Strong hit.' : 'Strike', unlocked: true }], // DEBUFFED: Enemy skill power
  abilities: [], equipment: { weapon: null, armor: null }
});

export const CHAPTER_STAGES: Stage[] = ((): Stage[] => {
  const stages: Stage[] = [];
  for (let c = 1; c <= 20; c++) {
    for (let s = 1; s <= 10; s++) {
      const globalId = (c - 1) * 10 + s;
      const isBoss = s === 10;
      const difficultyMult = Math.pow(1.1, c - 1); // DEBUFFED: Scaling factor reduced (was 1.15)
      
      // DEBUFFED: Base stats significantly reduced
      const hp = Math.floor((isBoss ? 600 : 15 + (s * 15)) * difficultyMult); 
      const atk = Math.floor((isBoss ? 40 : 2 + (s * 2)) * difficultyMult);
      const def = Math.floor((isBoss ? 10 : 1 + (s * 0.5)) * difficultyMult);
      
      stages.push({
        id: globalId, chapterId: c, 
        name: isBoss ? `BOSS: CORE ${c}` : `Sector ${c}-${s}`, 
        description: `Deployment zone for Chapter ${c}.`, 
        loreNote: isBoss ? `High intensity signature detected.` : `Neural activity low. Perfect for a clean sweep.`,
        waves: isBoss 
          ? [[createEnemy(`e${globalId}-m`, `Drones ${c}`, 150 * difficultyMult, 10 * difficultyMult, 5 * difficultyMult, 'STEEL')], [createEnemy(`e${globalId}`, `SINGULARITY ${c}`, hp, atk, def, 'VOID', true)]]
          : [[createEnemy(`e${globalId}`, `Void Echo ${globalId}`, hp, atk, def, 'VOID')]],
        unlocked: globalId === 1, completed: false, isBoss, 
        expReward: Math.floor((isBoss ? 5000 : 250 * s) * difficultyMult), // BUFFED: Higher rewards
        shardReward: Math.floor((isBoss ? 2000 : 150 * s) * difficultyMult) // BUFFED: Higher rewards
      });
    }
  }
  return stages;
})();

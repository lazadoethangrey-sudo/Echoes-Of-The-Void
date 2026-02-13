
import { Unit, Stage, Skill, Equipment, Trait, Rarity, Category } from './types';

// Skill Base Definitions with unlockCost
const BasicSlash: Skill = { name: "Void Slash", description: "A quick dimensional strike.", power: 15, type: 'ATTACK', unlocked: true };
const ArcaneBolt: Skill = { name: "Spirit Surge", description: "A blast of pure essence.", power: 18, type: 'ATTACK', unlocked: true, unlockCost: 200 };
const SolarFlare: Skill = { name: "Solar Flare", description: "Blinding light strike.", power: 35, type: 'ATTACK', unlocked: false, unlockCost: 750 }; // Made unlockable
const ChaosPulse: Skill = { name: "Chaos Pulse", description: "Unpredictable energy.", power: 28, type: 'ATTACK', unlocked: true };
const FrostNova: Skill = { name: "Frost Nova", description: "Slows the enemy's heart.", power: 20, type: 'ATTACK', effects: [{ type: 'WEAKEN', chance: 0.5, value: 0.7 }], unlocked: false, unlockCost: 500 }; // Made unlockable
const Apocalypse: Skill = { name: "Apocalypse", description: "Deletes the enemy's timeline.", power: 999, type: 'ATTACK', unlocked: false, unlockCost: 5000 }; // Made unlockable

const TRAITS: Trait[] = ['VOID', 'CRIMSON', 'AETHER', 'STEEL', 'NEBULA', 'BEHEMOTH', 'SOLAR', 'LUNAR', 'STORM', 'VENOM', 'FROST', 'CHAOS', 'PHANTOM', 'GLITCH', 'PRIME'];
const NAMES = ["Kaelen", "Lyra", "Jax", "Seren", "Brutus", "Vex", "Celia", "Orym", "Malphas", "Elias", "Soren", "Frey", "Gunnar", "Mina", "Alaric", "Bryn", "Caelum", "Dara", "Elowen", "Fenris", "Gala", "Hesper", "Idris", "Juno", "Kael", "Lior", "Mira", "Nyx", "Orion", "Pax", "Quinn", "Rune", "Selene", "Thane", "Ursa", "Vora", "Wren", "Xenon", "Yara", "Zephyr", "Astra", "Boreas", "Cyra", "Drakon", "Eos", "Fauna", "Gorgon", "Helios", "Iris", "Jace", "Kira", "Luna", "Midas", "Nova", "Oberon", "Petra", "Rhea", "Silas", "Titus", "Vesta"];

const generateHeroPool = (): Unit[] => {
  const pool: Unit[] = [];
  const rarities: Rarity[] = ['RARE', 'EPIC', 'LEGENDARY', 'UBER_SUPER_RARE', 'INSANE'];
  rarities.forEach((rarity, rIdx) => {
    for (let i = 0; i < 55; i++) {
      const trait = TRAITS[Math.floor(Math.random() * TRAITS.length)];
      const name = `${NAMES[Math.floor(Math.random() * NAMES.length)]} ${i + 1}`;
      const rarityMultiplier = rIdx + 1.4; // NERFED: Hero base multiplier further reduced (was 1.5)
      pool.push({
        id: `hero-${rarity}-${i}`,
        name: name,
        level: 1, exp: 0, maxExp: 100 * (rIdx + 1),
        maxHp: 90 * rarityMultiplier + Math.floor(Math.random() * 40), // NERFED: Hero HP (was 100)
        hp: 90 * rarityMultiplier,
        attack: 13 * rarityMultiplier + Math.floor(Math.random() * 8), // NERFED: Hero Attack (was 15)
        defense: 7 * rarityMultiplier + Math.floor(Math.random() * 4), // NERFED: Hero Defense (was 8)
        speed: 14 + Math.floor(Math.random() * 8), // NERFED: Hero Speed (was 15)
        type: 'HERO', trait: trait,
        sprite: `https://picsum.photos/seed/${name}/200/200`,
        skills: [BasicSlash, ArcaneBolt, ChaosPulse, SolarFlare, FrostNova, Apocalypse].slice(0, 3 + Math.floor(Math.random() * 3)), // Give more potential skills
        abilities: [], rarity: rarity,
        equipment: { weapon: null, armor: null }
      });
    }
  });
  return pool;
};

export const HERO_POOL: Unit[] = generateHeroPool();
export const INITIAL_PARTY: Unit[] = [
  { ...HERO_POOL[0], skills: [BasicSlash, ArcaneBolt, ChaosPulse] }, // Starter skills
  { ...HERO_POOL[55], skills: [ArcaneBolt, { ...FrostNova, unlocked: false }] },
  { ...HERO_POOL[110], skills: [BasicSlash, { ...SolarFlare, unlocked: false }] }
];

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
                value: 20 * mult + Math.floor(Math.random() * 15), // NERFED: Equipment value further reduced (was 25)
                description: `Artifact from the void.`, rarity,
                trait: TRAITS[Math.floor(Math.random() * TRAITS.length)]
            });
        }
    });
    return items;
})();

/**
 * Dynamically determines an enemy trait based on chapter progression and whether it's a boss.
 * This introduces thematic enemies as the player advances.
 */
const getChapterThemedTrait = (chapterId: number, isBoss: boolean): Trait => {
  if (isBoss) {
    // Bosses always get a powerful trait
    const bossTraits: Trait[] = ['PRIME', 'BEHEMOTH', 'CHAOS'];
    return bossTraits[Math.floor(Math.random() * bossTraits.length)];
  }

  if (chapterId <= 5) {
    // Chapters 1-5: Focus on foundational Void and defensive Steel
    const traits: Trait[] = ['VOID', 'VOID', 'STEEL', 'STEEL', 'AETHER'];
    return traits[Math.floor(Math.random() * traits.length)];
  } else if (chapterId <= 10) {
    // Chapters 6-10: More ethereal and unpredictable Nebula and Aether
    const traits: Trait[] = ['AETHER', 'AETHER', 'NEBULA', 'NEBULA', 'PHANTOM'];
    return traits[Math.floor(Math.random() * traits.length)];
  } else if (chapterId <= 15) {
    // Chapters 11-15: Intense, destructive Crimson, Storm, Frost
    const traits: Trait[] = ['CRIMSON', 'CRIMSON', 'STORM', 'FROST', 'VENOM'];
    return traits[Math.floor(Math.random() * traits.length)];
  } else {
    // Chapters 16-20: Ultimate chaos, corrupted Glitch, powerful Behemoth
    const traits: Trait[] = ['CHAOS', 'CHAOS', 'GLITCH', 'BEHEMOTH', 'PRIME']; // PRIME as a rare non-boss
    return traits[Math.floor(Math.random() * traits.length)];
  }
};


const createEnemy = (id: string, name: string, hp: number, atk: number, def: number, trait: Trait, isBoss = false): Unit => ({
  id, name, level: 1, exp: 0, maxExp: 0, maxHp: hp, hp, attack: atk, defense: def, speed: 8, type: 'ENEMY', trait, sprite: `https://picsum.photos/seed/${name}/200/200`,
  skills: [{ name: isBoss ? 'Cataclysm' : 'Strike', power: isBoss ? 20 : 10, type: 'ATTACK', description: isBoss ? 'Strong hit.' : 'Strike', unlocked: true }], // BUFFED: Enemy skill power further increased (was 18:8)
  abilities: [], equipment: { weapon: null, armor: null }
});

export const CHAPTER_STAGES: Stage[] = ((): Stage[] => {
  const stages: Stage[] = [];
  for (let c = 1; c <= 20; c++) {
    for (let s = 1; s <= 10; s++) {
      const globalId = (c - 1) * 10 + s;
      const isBoss = s === 10;
      const difficultyMult = Math.pow(1.6, c - 1); // BUFFED: Scaling factor further increased (was 1.5)
      
      // BUFFED: Base enemy stats further increased
      const hp = Math.floor((isBoss ? 1500 : 35 + (s * 40)) * difficultyMult); 
      const atk = Math.floor((isBoss ? 70 : 5 + (s * 5)) * difficultyMult);
      const def = Math.floor((isBoss ? 25 : 2 + (s * 2)) * difficultyMult);
      
      // Assign trait based on chapter and boss status
      const enemyTrait = getChapterThemedTrait(c, isBoss);

      const regularDrones = [
        createEnemy(`e${globalId}-m1`, `Void Drone Alpha ${c}`, 300 * difficultyMult, 18 * difficultyMult, 10 * difficultyMult, 'STEEL'), // Drones
        createEnemy(`e${globalId}-m2`, `Void Drone Beta ${c}`, 300 * difficultyMult, 18 * difficultyMult, 10 * difficultyMult, 'STEEL')
      ];

      stages.push({
        id: globalId, chapterId: c, 
        name: isBoss ? `BOSS: CORE ${c}` : `Sector ${c}-${s}`, 
        description: `Deployment zone for Chapter ${c}.`, 
        loreNote: isBoss ? `High intensity signature detected.` : `Neural activity low. Perfect for a clean sweep.`,
        waves: isBoss 
          ? [
              regularDrones, // More drones in boss waves
              [createEnemy(`e${globalId}-boss`, `SINGULARITY ${c}`, hp, atk, def, enemyTrait, true)] // Boss
            ]
          : [[createEnemy(`e${globalId}-mob`, `Void Echo ${globalId}`, hp, atk, def, enemyTrait)]], // Regular enemies
        unlocked: globalId === 1, completed: false, isBoss, 
        expReward: Math.floor((isBoss ? 3500 : 120 * s) * difficultyMult), // NERFED: Rewards (was 4000:150)
        shardReward: Math.floor((isBoss ? 1200 : 60 * s) * difficultyMult) // NERFED: Rewards (was 1500:80)
      });
    }
  }
  return stages;
})();

export const MAX_ENERGY = 10; // New: Max energy shards
export const ENERGY_REGEN_INTERVAL_MS = 60 * 1000; // 1 minute in milliseconds
export const ENERGY_REFILL_COST = 500; // Shards to refill energy

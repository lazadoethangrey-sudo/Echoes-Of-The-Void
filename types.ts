
export enum GameScreen {
  LORE_INTRO = 'LORE_INTRO',
  TITLE = 'TITLE',
  CHAPTER_SELECT = 'CHAPTER_SELECT',
  MAP = 'MAP',
  STORY_INTRO = 'STORY_INTRO',
  BATTLE = 'BATTLE',
  VICTORY = 'VICTORY',
  DEFEAT = 'DEFEAT',
  HERO_MANAGEMENT = 'HERO_MANAGEMENT',
  GACHA = 'GACHA',
  ENEMY_INDEX = 'ENEMY_INDEX'
}

export type MinigameType = 'DODGE' | 'WIRES' | 'DECRYPT' | 'PURGE' | 'RHYTHM' | 'BALANCE' | 'LINK' | 'MATCH';

export type Trait = 'VOID' | 'CRIMSON' | 'AETHER' | 'STEEL' | 'NEBULA' | 'BEHEMOTH' | 'HERO' | 'SOLAR' | 'LUNAR' | 'STORM' | 'VENOM' | 'FROST' | 'CHAOS' | 'PHANTOM' | 'GLITCH' | 'PRIME';

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  chapters: number[]; // Array of chapter IDs belonging to this category
}

export interface Ability {
  type: 'STRONG' | 'MASSIVE_DAMAGE' | 'RESISTANT' | 'WEAKEN' | 'STUN' | 'VOID_RESIST';
  targetTrait?: Trait;
  chance?: number;
  value?: number;
}

export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'UBER_SUPER_RARE' | 'INSANE';

export interface Equipment {
  id: string;
  name: string;
  slot: 'WEAPON' | 'ARMOR';
  stat: 'attack' | 'defense' | 'maxHp';
  value: number;
  description: string;
  rarity?: Rarity;
  trait?: Trait;
}

export interface StatusEffect {
  type: 'WEAKEN' | 'STUN' | 'CORRUPTION' | 'BURN';
  duration: number;
}

export interface Unit {
  id: string;
  name: string;
  level: number;
  exp: number;
  maxExp: number;
  maxHp: number;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  type: 'HERO' | 'ENEMY';
  trait: Trait;
  sprite: string;
  skills: Skill[];
  abilities: Ability[];
  statusEffects?: StatusEffect[];
  rarity?: Rarity;
  equipment: {
    weapon: Equipment | null;
    armor: Equipment | null;
  };
}

export interface Skill {
  name: string;
  description: string;
  power: number;
  type: 'ATTACK' | 'HEAL' | 'BUFF';
  cost?: number;
  effects?: Ability[]; 
  unlocked: boolean;
  unlockCost?: number;
}

export interface DialogueLine {
  speaker: string;
  text: string;
}

export interface Stage {
  id: number;
  chapterId: number;
  name: string;
  description: string;
  loreNote: string;
  waves: Unit[][];
  unlocked: boolean;
  completed: boolean;
  isBoss?: boolean;
  expReward: number;
  shardReward: number;
}

export interface GameSettings {
  musicEnabled: boolean;
  musicVolume: number;
  mouseSensitivity: number;
  screenShakeEnabled: boolean;
}

export interface GameState {
  saveVersion: number;
  screen: GameScreen;
  party: Unit[];
  allHeroes: Unit[];
  inventory: Equipment[];
  currentStage: Stage | null;
  unlockedStages: number[];
  attemptedStages: number[]; // Track stages that have been entered
  storyDialogue: DialogueLine[];
  shards: number;
  heroTickets: number;
  itemTickets: number;
  totalAccountExp: number;
  lastDailyClaim: null | string;
  totalDailyClaims: number;
  lastSaved?: string;
  settings: GameSettings;
  currentChapterId?: number; 
}

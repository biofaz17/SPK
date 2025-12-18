
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export enum BlockCategory {
  MOTION = 'MOTION', 
  CONTROL = 'CONTROL', 
  ACTION = 'ACTION', 
  EVENT = 'EVENT', 
  DECISION = 'DECISION',
}

export enum BlockType {
  MOVE_UP = 'MOVE_UP',
  MOVE_DOWN = 'MOVE_DOWN',
  MOVE_LEFT = 'MOVE_LEFT',
  MOVE_RIGHT = 'MOVE_RIGHT',
  REPEAT_2 = 'REPEAT_2',
  REPEAT_3 = 'REPEAT_3',
  REPEAT_UNTIL = 'REPEAT_UNTIL',
  PAINT = 'PAINT',
  START = 'START',
  IF_OBSTACLE = 'IF_OBSTACLE',
  IF_PATH = 'IF_PATH',
  ELSE_IF = 'ELSE_IF',
  ELSE = 'ELSE',
}

export type AgeGroup = '5-7' | '8-10' | '11-14';

export enum SubscriptionTier {
  FREE = 'FREE',
  STARTER = 'STARTER', 
  PRO = 'PRO',         
}

export interface GridPosition {
  x: number;
  y: number;
}

export interface LevelConfig {
  id: number | string;
  title: string;
  mission?: string;
  gridSize: number;
  startPos: GridPosition;
  goalPos?: GridPosition;
  obstacles: GridPosition[];
  maxBlocks: number;
  availableBlocks: BlockType[];
  tutorialMessage?: string;
  explanation?: string;
  isCreative?: boolean;
  ageGroup: AgeGroup;
  requiredSubscription: SubscriptionTier;
  bnccCode?: string;
  timeLimit?: number;
  introData?: {
    title: string;
    description: string;
    category: BlockCategory;
  };
}

export interface UserSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  password?: string;
  parentEmail: string;
  age: number;
  subscription: SubscriptionTier;
  progress: UserProgress;
  settings: UserSettings;
  activeSkin?: string;
  isGuest?: boolean;
  lastActive?: number;
}

export interface UserProgress {
  unlockedLevels: number;
  stars: number;
  creativeProjects: number;
  totalBlocksUsed: number;
  secretsFound: number;
}

// --- NOVOS TIPOS PARA ADMIN ---
export interface AppStats {
  totalLogins: number;
  totalRegisters: number;
  totalRevenue: number;
  registrationsByDate: Record<string, number>;
  revenueByDate: Record<string, number>;
  mostPlayedLevels: Record<string, number>;
  activeUsersToday: number;
  lastUpdate: number;
}

// Added BLOCK_DEFINITIONS to fix import errors in BlockIcon.tsx and GameScreen.tsx
export const BLOCK_DEFINITIONS: Record<BlockType, { label: string; category: BlockCategory }> = {
  [BlockType.MOVE_UP]: { label: 'Andar Cima', category: BlockCategory.MOTION },
  [BlockType.MOVE_DOWN]: { label: 'Andar Baixo', category: BlockCategory.MOTION },
  [BlockType.MOVE_LEFT]: { label: 'Andar Esq.', category: BlockCategory.MOTION },
  [BlockType.MOVE_RIGHT]: { label: 'Andar Dir.', category: BlockCategory.MOTION },
  [BlockType.REPEAT_2]: { label: 'Repetir 2x', category: BlockCategory.CONTROL },
  [BlockType.REPEAT_3]: { label: 'Repetir 3x', category: BlockCategory.CONTROL },
  [BlockType.REPEAT_UNTIL]: { label: 'Até Chegar', category: BlockCategory.CONTROL },
  [BlockType.PAINT]: { label: 'Pintar', category: BlockCategory.ACTION },
  [BlockType.START]: { label: 'Iniciar', category: BlockCategory.EVENT },
  [BlockType.IF_OBSTACLE]: { label: 'Se Obstáculo', category: BlockCategory.DECISION },
  [BlockType.IF_PATH]: { label: 'Se Caminho', category: BlockCategory.DECISION },
  [BlockType.ELSE_IF]: { label: 'Senão Se', category: BlockCategory.DECISION },
  [BlockType.ELSE]: { label: 'Senão', category: BlockCategory.DECISION },
};

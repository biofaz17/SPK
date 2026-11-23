import type { GridPosition, LevelConfig } from './types';

export interface FinalProjectLevel extends LevelConfig {
  id: number;
  goalPos: GridPosition;
  concept: string;
  brief: string;
  guide: string[];
  code: string;
  gaps: { id: string; label: string; answer: string; tip: string }[];
}

export const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#C3A6FF', '#FBBF24'] as const;

export type SquareType =
  | 'start' | 'goal' | 'drink' | 'all_drink' | 'quiz' | 'game'
  | 'advance' | 'retreat' | 'electric' | 'reversal' | 'king' | 'warp' | 'death';

export interface Player {
  name: string;
  color: string;
}

export interface SquareData {
  type: SquareType;
  icon: string;
}

export interface SquarePos {
  r: number;
  c: number;
}

export interface Card {
  id: string;
  icon: string;
  name: string;
  desc: string;
}

export interface ModalState {
  icon: string;
  eventType: string;
  title: string;
  body: string;
  color: string;
  mode: 'normal' | 'quiz-q' | 'quiz-a' | 'drink-select';
  quizAnswer: string;
  showSafeBtn: boolean;
  safeBtnText: string;
  primaryBtnText: string;
}

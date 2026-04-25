import { SquareData, SquareType } from '../types';

export function rnd(n: number): number {
  return Math.floor(Math.random() * n);
}

export function pick<T>(arr: T[]): T {
  return arr[rnd(arr.length)];
}

export function shuffle<T>(a: T[]): void {
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
}

function noAdjacentOf(arr: SquareType[], types: SquareType[]): void {
  const typeSet = new Set(types);
  for (let i = 0; i < arr.length - 1; i++) {
    if (typeSet.has(arr[i]) && typeSet.has(arr[i + 1])) {
      for (let j = i + 2; j < arr.length; j++) {
        if (!typeSet.has(arr[j])) {
          [arr[i + 1], arr[j]] = [arr[j], arr[i + 1]];
          break;
        }
      }
    }
  }
}

function typeIcon(t: SquareType): string {
  const icons: Partial<Record<SquareType, string>> = {
    drink: '🍺', all_drink: '🥂', quiz: '❓',
    game: '🎲', advance: '⏩', retreat: '⏪',
    electric: '⚡', reversal: '🔄', king: '👑', warp: '🌀', death: '💀',
  };
  return icons[t] ?? '？';
}

export function makeSquares(): SquareData[] {
  const endZone: SquareType[] = ['drink', 'all_drink', 'death'];
  shuffle(endZone);

  const pool: SquareType[] = [
    ...Array<SquareType>(3).fill('drink'),
    ...Array<SquareType>(1).fill('all_drink'),
    ...Array<SquareType>(11).fill('game'),
    ...Array<SquareType>(2).fill('advance'),
    ...Array<SquareType>(1).fill('retreat'),
    'king',
    'warp',
  ];
  shuffle(pool);
  noAdjacentOf(pool, ['advance', 'retreat']);

  const sq: SquareData[] = [{ type: 'start', icon: '🎲' }];
  pool.forEach(t => sq.push({ type: t, icon: typeIcon(t) }));
  endZone.forEach(t => sq.push({ type: t, icon: typeIcon(t) }));
  sq.push({ type: 'goal', icon: '🏆' });
  return sq;
}

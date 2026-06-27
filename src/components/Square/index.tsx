import { SquareData, Player } from '../../types';
import { GOAL } from '../../constants/boardLayout';
import styles from './Square.module.css';

interface Token {
  playerIndex: number;
  name: string;
  color: string;
  isActive: boolean;
}

interface Props {
  id: string;
  index: number;
  square: SquareData;
  tokens: Token[];
  isCurHighlight: boolean;
  isFlashing: boolean;
  isReachable: boolean;
  isTarget: boolean;
  isDimmed: boolean;
  gridColumn: number;
  gridRow: number;
}

// 進行グラデーション: index(0=START)→GOAL で色相を寒色→暖色へ補間。
// スパイラルは外周→中心の順なので、外周が寒色・中心が暖色の渦巻きヒートマップになる。
function progressColor(index: number, alpha: number): string {
  const t = Math.min(Math.max(index / GOAL, 0), 1);
  const hue = 205 - t * 190; // 205(青) → 15(オレンジ)
  return `hsla(${hue.toFixed(0)}, 85%, 55%, ${alpha})`;
}

const TYPE_CLASS: Record<string, string> = {
  start: styles.sqStart,
  goal: styles.sqGoal,
  drink: styles.sqDrink,
  all_drink: styles.sqAllDrink,
  quiz: styles.sqQuiz,
  game: styles.sqGame,
  advance: styles.sqAdvance,
  retreat: styles.sqRetreat,
  electric: styles.sqElectric,
  reversal: styles.sqReversal,
  king: styles.sqKing,
  warp: styles.sqWarp,
  death: styles.sqDeath,
};

export default function Square({
  id, index, square, tokens,
  isCurHighlight, isFlashing, isReachable, isTarget, isDimmed,
  gridColumn, gridRow,
}: Props) {
  const isEndZone = index >= 21 && index < GOAL;
  const label = index === 0 ? 'START' : index === GOAL ? 'GOAL' : String(index);

  const cls = [
    styles.sq,
    TYPE_CLASS[square.type] ?? '',
    isEndZone ? styles.sqEndzone : '',
    isCurHighlight ? styles.sqCurHl : '',
    isFlashing ? styles.sqStepFlash : '',
    isReachable ? styles.sqReachable : '',
    isTarget ? styles.sqTarget : '',
    isDimmed ? styles.sqDim : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      id={id}
      className={cls}
      style={{
        gridColumn,
        gridRow,
        ['--prog-color' as string]: progressColor(index, 0.95),
        ['--prog-soft' as string]: progressColor(index, 0.5),
      }}
    >
      <div className={styles.sqLbl}>{label}</div>
      <div className={styles.sqIco}>{square.icon}</div>
      <div className={styles.sqTokens}>
        {tokens.map(t => (
          <div
            key={t.playerIndex}
            className={`${styles.token} ${t.isActive ? styles.activeToken : ''}`}
            style={{
              background: t.color,
              ['--tok-color' as string]: t.color,
            }}
          >
            {t.name[0]}
          </div>
        ))}
      </div>
    </div>
  );
}

export type { Token };

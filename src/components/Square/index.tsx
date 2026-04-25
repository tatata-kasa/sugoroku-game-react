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
  gridColumn: number;
  gridRow: number;
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
  isCurHighlight, isFlashing, isReachable, isTarget,
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
  ].filter(Boolean).join(' ');

  return (
    <div
      id={id}
      className={cls}
      style={{ gridColumn, gridRow }}
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

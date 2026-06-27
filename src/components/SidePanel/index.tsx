import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import ReactDice from 'react-dice-complete';
import { Player } from '../../types';
import { GOAL } from '../../constants/boardLayout';
import styles from './SidePanel.module.css';

export interface SidePanelHandle {
  rollAll: (values?: number[]) => void;
}

interface Props {
  players: Player[];
  positions: number[];
  drinks: number[];
  curPlayer: number;
  rolling: boolean;
  cardUsed: boolean[];
  lastRoll: { value: number; bonus: number } | null;
  onRollDone: (total: number, values: number[]) => void;
  onRollClick: () => void;
  onCardActivate: () => void;
}

const LEGEND = [
  { cls: styles.legDrink,    text: '🍺 飲む' },
  { cls: styles.legAllDrink, text: '🥂 全員飲む' },
  { cls: styles.legGame,     text: '🎲 ゲーム' },
  { cls: styles.legAdvance,  text: '⏩ 進む' },
  { cls: styles.legRetreat,  text: '⏪ 戻る' },
  { cls: styles.legKing,     text: '👑 王様' },
  { cls: styles.legWarp,     text: '🌀 ワープ' },
  { cls: styles.legDeath,    text: '💀 デス' },
];

const SidePanel = forwardRef<SidePanelHandle, Props>(({
  players, positions, drinks, curPlayer, rolling,
  cardUsed, lastRoll, onRollDone, onRollClick, onCardActivate,
}, ref) => {
  const diceRef = useRef<ReactDice>(null);
  const [rollKey, setRollKey] = useState(0);

  useImperativeHandle(ref, () => ({
    rollAll: (values?: number[]) => {
      setRollKey(k => k + 1);
      diceRef.current?.rollAll(values);
    },
  }));

  const cardUnused = !cardUsed[curPlayer];

  return (
    <div className={styles.panel}>
      <div className={styles.title}>🍺 飲みすごろく！</div>

      {/* Player bar */}
      <div className={styles.pbar}>
        {players.map((p, i) => {
          const pos = positions[i];
          const posLabel = pos === 0 ? 'スタート' : pos === GOAL ? '🏆 GOAL' : `${pos}マス目`;
          return (
            <div key={i} className={`${styles.pchip} ${i === curPlayer ? styles.cur : ''}`}>
              <div className={styles.pchipDot} style={{ background: p.color }} />
              <div className={styles.pchipInfo}>
                <div className={styles.pchipName}>{p.name}</div>
                <div className={styles.pchipPos}>{posLabel}</div>
              </div>
              <div className={styles.pchipDrink}>🍺 {drinks[i]}杯</div>
            </div>
          );
        })}
      </div>

      {/* Turn info */}
      <div className={styles.turnInfo}>
        <span className={styles.turnName}>{players[curPlayer].name}</span> のターン
      </div>

      {/* Dice area */}
      <div className={styles.diceRow}>
        <div className={styles.diceWrapper} onClick={onRollClick}>
          <ReactDice
            numDice={1}
            ref={diceRef}
            rollDone={onRollDone}
            faceColor="#ffffff"
            dotColor="#1a1a1a"
            dieSize={70}
            rollTime={2.5}
            disableIndividualRollFocus
            defaultRoll={1}
          />
        </div>
        <div className={styles.diceResultBox}>
          <div
            key={rollKey}
            className={`${styles.diceResultNum} ${lastRoll ? styles.pop : ''}`}
          >
            {lastRoll
              ? lastRoll.bonus > 0
                ? `${lastRoll.value}+${lastRoll.bonus}`
                : lastRoll.value
              : '-'}
          </div>
          <div className={styles.diceResultLabel}>の目</div>
        </div>
      </div>

      {/* Roll / Card buttons */}
      <div className={styles.rollCardRow}>
        <button
          className={styles.rollBtn}
          onClick={onRollClick}
          disabled={rolling}
        >
          サイコロを振る！
        </button>
        <button
          className={`${styles.cardBtn} ${cardUnused ? '' : styles.cardUsed}`}
          onClick={onCardActivate}
          disabled={!cardUnused || rolling}
        >
          {cardUnused ? '🃏 カード' : '🃏 使用済'}
        </button>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {LEGEND.map(l => (
          <span key={l.text} className={`${styles.leg} ${l.cls}`}>{l.text}</span>
        ))}
      </div>
    </div>
  );
});

SidePanel.displayName = 'SidePanel';
export default SidePanel;

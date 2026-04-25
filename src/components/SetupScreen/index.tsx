import { useState } from 'react';
import { Player, COLORS } from '../../types';
import styles from './SetupScreen.module.css';

interface Props {
  onStart: (players: Player[]) => void;
}

const PLAYER_COUNTS = [2, 3, 4, 5, 6] as const;

export default function SetupScreen({ onStart }: Props) {
  const [count, setCount] = useState(3);
  const [names, setNames] = useState<string[]>(Array(6).fill(''));

  const handleCountChange = (n: number) => {
    setCount(n);
  };

  const handleNameChange = (i: number, value: string) => {
    setNames(prev => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  };

  const handleStart = () => {
    const players: Player[] = Array.from({ length: count }, (_, i) => ({
      name: names[i].trim() || `プレイヤー${i + 1}`,
      color: COLORS[i],
    }));
    onStart(players);
  };

  return (
    <div className={styles.setup}>
      <div className={styles.title}>🍺 飲みすごろく</div>
      <div className={styles.sub}>のんで・すごろって・生き抜け！🎉</div>
      <div className={styles.card}>
        <div className={styles.label}>プレイヤー数</div>
        <div className={styles.countRow}>
          {PLAYER_COUNTS.map(n => (
            <button
              key={n}
              className={`${styles.cntBtn} ${count === n ? styles.on : ''}`}
              onClick={() => handleCountChange(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <div className={styles.label}>名前を入力</div>
        <div className={styles.inputs}>
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className={styles.pRow}>
              <div className={styles.dot} style={{ background: COLORS[i] }} />
              <input
                className={styles.input}
                type="text"
                maxLength={8}
                placeholder={`プレイヤー${i + 1}`}
                value={names[i]}
                onChange={e => handleNameChange(i, e.target.value)}
              />
            </div>
          ))}
        </div>
        <button className={styles.startBtn} onClick={handleStart}>
          🎲 ゲームスタート！
        </button>
      </div>
    </div>
  );
}

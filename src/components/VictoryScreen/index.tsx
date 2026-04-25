import { useEffect, useState } from 'react';
import { Player } from '../../types';
import styles from './VictoryScreen.module.css';

interface Props {
  winner: Player;
  players: Player[];
  drinks: number[];
  winnerIndex: number;
  onReset: () => void;
}

interface Confetti {
  id: number;
  left: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  isCircle: boolean;
}

const CONFETTI_COLORS = ['#FF6B35','#FFD700','#FF6B6B','#4ECDC4','#a29bfe','#55efc4','#fd79a8'];

export default function VictoryScreen({ winner, players, drinks, winnerIndex, onReset }: Props) {
  const [confettis, setConfettis] = useState<Confetti[]>([]);

  useEffect(() => {
    const pieces: Confetti[] = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 4 + Math.random() * 10,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      duration: 2 + Math.random() * 2.5,
      delay: Math.random() * 0.8,
      isCircle: Math.random() > 0.5,
    }));
    setConfettis(pieces);
    const t = setTimeout(() => setConfettis([]), 5000);
    return () => clearTimeout(t);
  }, []);

  // Extra drinks: losers + max drinker
  const loserNames = players.filter((_, i) => i !== winnerIndex).map(p => p.name);
  const maxDrinks = Math.max(...drinks);
  const topIdx = drinks.lastIndexOf(maxDrinks);
  const finalDrinks = [...drinks];
  if (players.length > 1) finalDrinks[topIdx]++;

  const ranking = players
    .map((p, i) => ({ p, drinks: finalDrinks[i] }))
    .sort((a, b) => b.drinks - a.drinks);

  return (
    <div className={styles.victory}>
      {confettis.map(c => (
        <div
          key={c.id}
          className={styles.confetti}
          style={{
            left: `${c.left}vw`,
            top: `-${c.size}px`,
            width: `${c.size}px`,
            height: `${c.size}px`,
            background: c.color,
            borderRadius: c.isCircle ? '50%' : '2px',
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`,
          }}
        />
      ))}

      <div className={styles.emoji}>🏆</div>
      <div className={styles.title}>🎉 {winner.name} の勝ち！</div>

      <div className={styles.drinkSection}>
        {loserNames.length > 0 && (
          <div className={styles.extraDrink}>
            <div className={styles.extraRow}>😭 {loserNames.join('・')} は罰杯！🍺</div>
            {players.length > 1 && (
              <div className={styles.extraRow}>
                🍺 最多飲酒 {players[topIdx].name}（{finalDrinks[topIdx]}杯）追加で1杯！
              </div>
            )}
          </div>
        )}
        <div className={styles.ranking}>
          <div className={styles.rankTitle}>最終飲酒ランキング</div>
          {ranking.map(({ p, drinks: d }, i) => (
            <div key={p.name} className={styles.rankRow}>
              <span className={styles.rankNum}>{i + 1}.</span>
              <span className={styles.rankDot} style={{ background: p.color }} />
              <span className={styles.rankName}>{p.name}</span>
              <span className={styles.rankCount}>🍺 {d}杯</span>
            </div>
          ))}
        </div>
      </div>

      <button className={styles.btn} onClick={onReset}>もう一度遊ぶ！</button>
    </div>
  );
}

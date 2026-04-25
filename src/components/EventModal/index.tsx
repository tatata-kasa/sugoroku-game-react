import { useState } from 'react';
import { ModalState, Player } from '../../types';
import styles from './EventModal.module.css';

interface Props {
  modal: ModalState;
  players: Player[];
  drinks: number[];
  onPrimary: () => void;
  onSafe: () => void;
  onDrinkConfirm: (indices: number[]) => void;
}

export default function EventModal({
  modal, players, drinks, onPrimary, onSafe, onDrinkConfirm,
}: Props) {
  const [checked, setChecked] = useState<boolean[]>(() =>
    new Array(players.length).fill(false)
  );

  const toggleCheck = (i: number) => {
    setChecked(prev => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const handleDrinkConfirm = () => {
    const indices = checked.reduce<number[]>((acc, v, i) => (v ? [...acc, i] : acc), []);
    setChecked(new Array(players.length).fill(false));
    onDrinkConfirm(indices);
  };

  const handleSkipDrink = () => {
    setChecked(new Array(players.length).fill(false));
    onSafe();
  };

  return (
    <div className={styles.bg}>
      <div className={styles.modal}>
        <div className={styles.icon}>{modal.icon}</div>
        <div className={styles.type}>{modal.eventType}</div>
        <div className={styles.title}>{modal.title}</div>
        <div className={styles.body}>{modal.body}</div>

        {/* Quiz answer area */}
        {modal.mode === 'quiz-a' && (
          <div className={styles.answer}>
            <div className={styles.answerLabel}>✅ 正解はこちら</div>
            <div className={styles.answerText}>{modal.quizAnswer}</div>
          </div>
        )}

        {/* Drink selection area */}
        {modal.mode === 'drink-select' && (
          <div className={styles.playerSelect}>
            <div className={styles.playerSelectLabel}>🍺 誰が飲んだ？（複数選択OK）</div>
            <div className={styles.playerChecks}>
              {players.map((p, i) => (
                <label
                  key={i}
                  className={`${styles.playerCheck} ${checked[i] ? styles.checked : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked[i]}
                    onChange={() => toggleCheck(i)}
                    style={{ display: 'none' }}
                  />
                  <span className={styles.checkDot} style={{ background: p.color }} />
                  <span className={styles.checkName}>{p.name}</span>
                  <span className={styles.checkCount}>現在 {drinks[i]}杯</span>
                </label>
              ))}
            </div>
            <button className={styles.confirmBtn} onClick={handleDrinkConfirm}>
              確定！🍺
            </button>
          </div>
        )}

        {/* Button row */}
        <div className={styles.btnRow}>
          {modal.mode !== 'drink-select' && (
            <button
              className={styles.btn}
              style={{ background: modal.color }}
              onClick={onPrimary}
            >
              {modal.primaryBtnText}
            </button>
          )}
          {modal.showSafeBtn && (
            <button
              className={`${styles.btn} ${styles.btnSafe}`}
              onClick={modal.mode === 'drink-select' ? handleSkipDrink : onSafe}
            >
              {modal.safeBtnText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { Player, SquareData, ModalState } from '../../types';
import { GOAL } from '../../constants/boardLayout';
import { DRINK, ALL_DRINK, GAME, ADVANCE, RETREAT, KING, CARDS } from '../../constants/gameData';
import { rnd, pick, makeSquares } from '../../utils/gameUtils';
import Board from '../Board';
import SidePanel, { SidePanelHandle } from '../SidePanel';
import EventModal from '../EventModal';
import VictoryScreen from '../VictoryScreen';
import styles from './GameScreen.module.css';

interface Props {
  players: Player[];
  onReset: () => void;
}

const DEFAULT_MODAL: ModalState = {
  icon: '', eventType: '', title: '', body: '', color: '#FF6B35',
  mode: 'normal', quizAnswer: '', showSafeBtn: false, safeBtnText: '', primaryBtnText: 'わかった！',
};

function computeReachable(curPos: number): Set<number> {
  const seen = new Set<number>();
  for (let d = 1; d <= 6; d++) {
    const raw = curPos + d;
    const pos = raw <= GOAL ? raw : Math.max(0, 2 * GOAL - raw);
    if (pos >= 0 && pos <= GOAL) seen.add(pos);
  }
  return seen;
}

export default function GameScreen({ players, onReset }: Props) {
  const n = players.length;

  // --- Game state ---
  const [positions,      setPositions]     = useState<number[]>(() => new Array(n).fill(0));
  const [drinks,         setDrinks]        = useState<number[]>(() => new Array(n).fill(0));
  const [cur,            setCur]           = useState(0);
  const [squares]                          = useState<SquareData[]>(makeSquares);
  const [rolling,        setRolling]       = useState(false);
  const [over,           setOver]          = useState(false);
  const [cardUsed,       setCardUsed]      = useState<boolean[]>(() => new Array(n).fill(false));
  const [cardEffect,     setCardEffect]    = useState<string | null>(null);
  const [flashingSquare, setFlashingSquare] = useState<number | null>(null);
  const [reachable,      setReachable]     = useState<Set<number>>(() => computeReachable(0));
  const [targetSquare,   setTargetSquare]  = useState<number | null>(null);
  const [modal,          setModal]         = useState<ModalState | null>(null);
  const [winnerIndex,    setWinnerIndex]   = useState<number | null>(null);
  const [lastRoll,       setLastRoll]      = useState<{ value: number; bonus: number } | null>(null);
  const [screenFlash,    setScreenFlash]   = useState<string | null>(null);

  // --- Refs (callback-safe access to latest values) ---
  const posRef          = useRef<number[]>(new Array(n).fill(0));
  const drinksRef       = useRef<number[]>(new Array(n).fill(0));
  const curRef          = useRef(0);
  const cardEffectRef   = useRef<string | null>(null);
  const pendingBonusRef = useRef(0);
  const lastRollValRef  = useRef(0);
  const modalCbRef      = useRef<(() => void) | null>(null);
  const drinkCbRef      = useRef<((indices: number[]) => void) | null>(null);
  const overRef         = useRef(false);
  const sidePanelRef    = useRef<SidePanelHandle>(null);

  // Keep refs in sync (safe to do during render since refs don't trigger re-renders)
  posRef.current       = positions;
  drinksRef.current    = drinks;
  curRef.current       = cur;
  cardEffectRef.current = cardEffect;
  overRef.current      = over;

  // --- Set reachable on turn change ---
  useEffect(() => {
    if (!rolling && !over) {
      setReachable(computeReachable(positions[cur]));
    }
  }, [cur]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Game functions via gRef (always latest via re-assignment each render) ---
  const gRef = useRef({
    stepForward:    (_pi: number, _steps: number, _cb: () => void) => {},
    stepBack:       (_pi: number, _steps: number, _cb: () => void) => {},
    doSquareEvent:  (_pos: number, _pi: number, _depth: number) => {},
    showModal:      (_icon: string, _type: string, _title: string, _body: string, _color: string, _cb: () => void) => {},
    showDrinkSelect:(_cb: (indices: number[]) => void) => {},
    nextTurn:       () => {},
    showVictory:    (_wi: number) => {},
    flashScreen:    (_color: string) => {},
    updateDrinks:   (_pi: number, _delta: number) => {},
    updateAllDrinks:() => {},
  });

  // Move one step forward; stops at GOAL without checking victory (caller handles it)
  gRef.current.stepForward = (pi, stepsLeft, onDone) => {
    if (stepsLeft <= 0) { onDone(); return; }
    if (posRef.current[pi] >= GOAL) { onDone(); return; }
    const nextPos = posRef.current[pi] + 1;
    const newPos  = [...posRef.current];
    newPos[pi]    = nextPos;
    posRef.current = newPos;
    flushSync(() => {
      setPositions([...newPos]);
      setFlashingSquare(nextPos);
    });
    setTimeout(() => {
      setFlashingSquare(null);
      gRef.current.stepForward(pi, stepsLeft - 1, onDone);
    }, 270);
  };

  gRef.current.stepBack = (pi, stepsLeft, onDone) => {
    if (stepsLeft <= 0) { onDone(); return; }
    const prevPos = Math.max(posRef.current[pi] - 1, 0);
    const newPos  = [...posRef.current];
    newPos[pi]    = prevPos;
    posRef.current = newPos;
    flushSync(() => {
      setPositions([...newPos]);
      setFlashingSquare(prevPos);
    });
    setTimeout(() => {
      setFlashingSquare(null);
      gRef.current.stepBack(pi, stepsLeft - 1, onDone);
    }, 270);
  };

  gRef.current.updateDrinks = (pi, delta) => {
    const newD = [...drinksRef.current];
    newD[pi] += delta;
    drinksRef.current = newD;
    setDrinks([...newD]);
  };

  gRef.current.updateAllDrinks = () => {
    const newD = drinksRef.current.map(d => d + 1);
    drinksRef.current = newD;
    setDrinks([...newD]);
  };

  gRef.current.flashScreen = (color) => {
    setScreenFlash(color);
    setTimeout(() => setScreenFlash(null), 700);
  };

  gRef.current.showVictory = (wi) => {
    overRef.current = true;
    setOver(true);
    setWinnerIndex(wi);
  };

  gRef.current.showModal = (icon, eventType, title, body, color, cb) => {
    modalCbRef.current = cb;
    setModal({
      ...DEFAULT_MODAL,
      icon, eventType, title, body, color,
      mode: 'normal',
      primaryBtnText: 'わかった！',
      showSafeBtn: false,
    });
  };

  gRef.current.showDrinkSelect = (cb) => {
    drinkCbRef.current = cb;
    setModal({
      ...DEFAULT_MODAL,
      icon: '🍺', eventType: '飲んだ人を選択', title: '誰が飲んだ？',
      body: '飲んだ人を選んでください（複数選択OK）',
      color: '#FF6B35',
      mode: 'drink-select',
      showSafeBtn: true,
      safeBtnText: '誰も飲まなかった 😅',
      primaryBtnText: 'わかった！',
    });
  };

  gRef.current.nextTurn = () => {
    setCardEffect(null);
    cardEffectRef.current = null;
    const next = (curRef.current + 1) % n;
    curRef.current = next;
    setCur(next);
    setRolling(false);
    setLastRoll(null);
    setTargetSquare(null);
    setReachable(computeReachable(posRef.current[next]));
  };

  gRef.current.doSquareEvent = (pos, pi, chainDepth) => {
    if (cardEffectRef.current === 'skip') {
      cardEffectRef.current = null;
      setCardEffect(null);
      gRef.current.showModal('🛡️', '🃏 カード効果！', 'イベントをスキップ！',
        'カードの効果でこのマスのイベントをスキップ！飲まなくてOK！',
        '#C8A951', () => gRef.current.nextTurn());
      return;
    }

    const sq    = squares[pos];
    const pname = players[pi].name;

    switch (sq.type) {
      case 'drink': {
        const e = pick(DRINK);
        if (cardEffectRef.current === 'transfer') {
          cardEffectRef.current = null;
          setCardEffect(null);
          const ri = (pi + 1) % n;
          gRef.current.updateDrinks(ri, 1);
          gRef.current.showModal('🔀', '🃏 カード効果！', '飲み転嫁！',
            `${pname}の代わりに${players[ri].name}が飲む！`,
            '#C8A951', () => gRef.current.nextTurn());
        } else {
          gRef.current.updateDrinks(pi, 1);
          gRef.current.showModal('🍺', '飲むマス', `${pname}が飲む！`,
            e.body, '#ff4d4d', () => gRef.current.nextTurn());
        }
        break;
      }
      case 'all_drink': {
        const e = pick(ALL_DRINK);
        gRef.current.updateAllDrinks();
        gRef.current.showModal('🥂', '全員飲むマス', '全員で乾杯！🥂',
          e.body, '#ff8c42', () => gRef.current.nextTurn());
        break;
      }
      case 'game': {
        const e = pick(GAME);
        gRef.current.showModal('🎲', 'ゲームマス', 'ミニゲーム！', e.body, '#9333ea', () => {
          gRef.current.showDrinkSelect(indices => {
            indices.forEach(i => gRef.current.updateDrinks(i, 1));
            gRef.current.nextTurn();
          });
        });
        break;
      }
      case 'advance': {
        const e = pick(ADVANCE);
        gRef.current.showModal('⏩', 'ラッキーマス', 'チャンス！', e.body, '#22c55e', () => {
          gRef.current.stepForward(pi, e.steps, () => {
            if (posRef.current[pi] >= GOAL) gRef.current.showVictory(pi);
            else if (chainDepth < 3) gRef.current.doSquareEvent(posRef.current[pi], pi, chainDepth + 1);
            else gRef.current.nextTurn();
          });
        });
        break;
      }
      case 'retreat': {
        const e = pick(RETREAT);
        gRef.current.showModal('⏪', 'アンラッキーマス', 'ガーン…', e.body, '#64748b', () => {
          gRef.current.stepBack(pi, e.steps, () => {
            if (chainDepth < 3) gRef.current.doSquareEvent(posRef.current[pi], pi, chainDepth + 1);
            else gRef.current.nextTurn();
          });
        });
        break;
      }
      case 'electric': {
        gRef.current.updateAllDrinks();
        gRef.current.flashScreen('rgba(255,230,50,0.85)');
        gRef.current.showModal('⚡', '電気マス', 'ビリビリ⚡！！',
          '全員まとめて一気飲み！このマスに言い訳は通じない！',
          '#D97706', () => gRef.current.nextTurn());
        break;
      }
      case 'reversal': {
        if (n < 2) {
          gRef.current.showModal('🔄', '逆転マス', '効果なし…',
            'プレイヤーが1人なので逆転できなかった。',
            '#06B6D4', () => gRef.current.nextTurn());
        } else {
          const p1 = rnd(n);
          let p2: number;
          do { p2 = rnd(n); } while (p2 === p1);
          const swapped = [...posRef.current];
          [swapped[p1], swapped[p2]] = [swapped[p2], swapped[p1]];
          posRef.current = swapped;
          flushSync(() => setPositions([...swapped]));
          gRef.current.showModal('🔄', '逆転マス', 'まさかの位置交換！',
            `${players[p1].name} ↔ ${players[p2].name} の位置が入れ替わった！`,
            '#06B6D4', () => gRef.current.nextTurn());
        }
        break;
      }
      case 'king': {
        const cmd = pick(KING);
        gRef.current.showModal('👑', '王様マス', `👑 ${pname}が王様！`, cmd, '#D97706', () => {
          gRef.current.showDrinkSelect(indices => {
            indices.forEach(i => gRef.current.updateDrinks(i, 1));
            gRef.current.nextTurn();
          });
        });
        break;
      }
      case 'warp': {
        let dest: number;
        do { dest = 1 + rnd(GOAL - 1); } while (squares[dest].type === 'warp');
        gRef.current.showModal('🌀', 'ワープマス', '吸い込まれた！',
          `${pname}が虚空に消えた… → ${dest}マス目へワープ！`, '#7C3AED', () => {
            const newPos = [...posRef.current];
            newPos[pi] = dest;
            posRef.current = newPos;
            flushSync(() => setPositions([...newPos]));
            setFlashingSquare(dest);
            setTimeout(() => {
              setFlashingSquare(null);
              if (dest >= GOAL) gRef.current.showVictory(pi);
              else if (chainDepth < 3) gRef.current.doSquareEvent(dest, pi, chainDepth + 1);
              else gRef.current.nextTurn();
            }, 400);
          });
        break;
      }
      case 'death': {
        // ペナルティ緩和: スタートではなく盤の左下コーナー(12マス目)まで引き戻す。
        // デスは GOAL 手前(endZone)で踏むため、12 への後退は必ず後退になる。
        const DEATH_BACK = 12;
        gRef.current.showModal('💀', 'デスマス', '即死…💀',
          `${pname}は左下マスまで引き戻し！罰として1杯必飲！`, '#111827', () => {
            gRef.current.flashScreen('rgba(0,0,0,0.92)');
            setTimeout(() => {
              const newPos = [...posRef.current];
              newPos[pi] = DEATH_BACK;
              posRef.current = newPos;
              gRef.current.updateDrinks(pi, 1);
              flushSync(() => setPositions([...newPos]));
              setFlashingSquare(DEATH_BACK);
              setTimeout(() => {
                setFlashingSquare(null);
                gRef.current.showModal('🍺', '引き戻し完了',
                  `左下まで戻された${pname}！`, '罰として1杯！',
                  '#ff4d4d', () => gRef.current.nextTurn());
              }, 400);
            }, 350);
          });
        break;
      }
      default:
        gRef.current.nextTurn();
    }
  };

  // --- Roll handling ---
  const handleRollClick = () => {
    if (rolling || over) return;
    setRolling(true);
    setReachable(new Set());

    let rollVal = rnd(6) + 1;
    if (cardEffectRef.current === 'roll2') {
      const r2 = rnd(6) + 1;
      rollVal = Math.max(rollVal, r2);
      cardEffectRef.current = null;
      setCardEffect(null);
    }

    let bonus = 0;
    if (cardEffectRef.current === 'bonus') {
      bonus = 2;
      cardEffectRef.current = null;
      setCardEffect(null);
    }

    pendingBonusRef.current = bonus;
    lastRollValRef.current  = rollVal;
    // 出目はサイコロのアニメーションが止まってから（handleRollDone で）表示する
    setLastRoll(null);

    sidePanelRef.current?.rollAll([rollVal]);
  };

  // Called by ReactDice when animation completes
  const handleRollDone = (_total: number, _values: number[]) => {
    const pi         = curRef.current;
    const rollVal    = lastRollValRef.current;
    const bonus      = pendingBonusRef.current;
    pendingBonusRef.current = 0;

    // サイコロが止まった瞬間に初めて出目を表示する
    setLastRoll({ value: rollVal, bonus });

    const totalSteps = rollVal + bonus;
    const startPos   = posRef.current[pi];
    const rawPos     = startPos + totalSteps;
    const finalPos   = rawPos <= GOAL ? rawPos : Math.max(0, 2 * GOAL - rawPos);

    setTargetSquare(finalPos);
    setTimeout(() => {
      setTargetSquare(null);
      movePlayer(pi, totalSteps);
    }, 700);
  };

  const movePlayer = (pi: number, totalSteps: number) => {
    const startPos = posRef.current[pi];
    const rawPos   = startPos + totalSteps;

    if (rawPos === GOAL) {
      gRef.current.stepForward(pi, totalSteps, () => gRef.current.showVictory(pi));
    } else if (rawPos > GOAL) {
      const stepsToGoal = GOAL - startPos;
      const stepsBack   = rawPos - GOAL;
      gRef.current.stepForward(pi, stepsToGoal, () => {
        setTimeout(() => {
          gRef.current.stepBack(pi, stepsBack, () => {
            gRef.current.doSquareEvent(posRef.current[pi], pi, 0);
          });
        }, 480);
      });
    } else {
      gRef.current.stepForward(pi, totalSteps, () => {
        gRef.current.doSquareEvent(posRef.current[pi], pi, 0);
      });
    }
  };

  // --- Modal handlers ---
  const handleModalPrimary = () => {
    if (!modal) return;

    if (modal.mode === 'quiz-q') {
      setModal(prev => prev
        ? { ...prev, mode: 'quiz-a', showSafeBtn: true, safeBtnText: '全員セーフ 😅', primaryBtnText: '飲む！🍺（間違えた人）' }
        : null);
      return;
    }

    if (modal.mode === 'quiz-a') {
      setModal(null);
      setTimeout(() => {
        gRef.current.showDrinkSelect(indices => {
          indices.forEach(i => gRef.current.updateDrinks(i, 1));
          gRef.current.nextTurn();
        });
      }, 300);
      return;
    }

    // normal
    setModal(null);
    const cb = modalCbRef.current;
    modalCbRef.current = null;
    if (cb) setTimeout(cb, 200);
  };

  const handleModalSafe = () => {
    setModal(null);
    modalCbRef.current = null;
    drinkCbRef.current = null;
    setTimeout(() => gRef.current.nextTurn(), 200);
  };

  const handleDrinkConfirm = (indices: number[]) => {
    setModal(null);
    const cb = drinkCbRef.current;
    drinkCbRef.current = null;
    if (cb) setTimeout(() => cb(indices), 200);
  };

  // --- Card ---
  const handleCardActivate = () => {
    const pi = curRef.current;
    if (cardUsed[pi] || rolling || over) return;

    const card  = CARDS[rnd(CARDS.length)];
    const pname = players[pi].name;

    setCardUsed(prev => { const next = [...prev]; next[pi] = true; return next; });

    if (card.id === 'party') {
      const newD = drinksRef.current.map((d, i) => (i !== pi ? d + 1 : d));
      drinksRef.current = newD;
      setDrinks([...newD]);
      gRef.current.showModal(card.icon, `🃏 カード: ${card.name}`,
        `${pname}がカードを使った！`, card.desc, '#C8A951', () => {});
      return;
    }

    if (card.id === 'nominate') {
      gRef.current.showModal(card.icon, `🃏 カード: ${card.name}`,
        `${pname}がカードを使った！`, card.desc, '#C8A951', () => {
          gRef.current.showDrinkSelect(indices => {
            indices.forEach(i => gRef.current.updateDrinks(i, 1));
          });
        });
      return;
    }

    // Deferred effect (applied on next roll/action)
    cardEffectRef.current = card.id;
    setCardEffect(card.id);
    gRef.current.showModal(card.icon, `🃏 カード: ${card.name}`,
      `${pname}がカードを使った！`, card.desc, '#C8A951', () => {});
  };

  return (
    <div className={styles.game}>
      {screenFlash && (
        <div className={styles.screenFlash} style={{ background: screenFlash }} />
      )}

      <Board
        squares={squares}
        positions={positions}
        players={players}
        curPlayer={cur}
        flashingSquare={flashingSquare}
        reachableSquares={reachable}
        targetSquare={targetSquare}
      />

      <SidePanel
        ref={sidePanelRef}
        players={players}
        positions={positions}
        drinks={drinks}
        curPlayer={cur}
        rolling={rolling}
        cardUsed={cardUsed}
        lastRoll={lastRoll}
        onRollDone={handleRollDone}
        onRollClick={handleRollClick}
        onCardActivate={handleCardActivate}
      />

      {modal && (
        <EventModal
          modal={modal}
          players={players}
          drinks={drinks}
          onPrimary={handleModalPrimary}
          onSafe={handleModalSafe}
          onDrinkConfirm={handleDrinkConfirm}
        />
      )}

      {winnerIndex !== null && (
        <VictoryScreen
          winner={players[winnerIndex]}
          players={players}
          drinks={drinks}
          winnerIndex={winnerIndex}
          onReset={onReset}
        />
      )}
    </div>
  );
}

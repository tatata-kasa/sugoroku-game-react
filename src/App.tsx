import { useState } from 'react';
import { Player } from './types';
import SetupScreen from './components/SetupScreen';
import GameScreen from './components/GameScreen';

type Phase = 'setup' | 'playing';

export default function App() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameKey, setGameKey] = useState(0);

  const handleStart = (ps: Player[]) => {
    setPlayers(ps);
    setPhase('playing');
  };

  const handleReset = () => {
    setPhase('setup');
    setGameKey(k => k + 1);
  };

  return (
    <>
      {phase === 'setup' && <SetupScreen onStart={handleStart} />}
      {phase === 'playing' && (
        <GameScreen key={gameKey} players={players} onReset={handleReset} />
      )}
    </>
  );
}

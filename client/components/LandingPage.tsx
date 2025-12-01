import React, { useEffect, useState } from 'react';

interface LandingPageProps {
  onStartGame: (playerNames: string[]) => void;
  isStarting: boolean;
  initialNames?: string[];
  validateNames: (names: string[]) => string | null;
}

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;

const LandingPage: React.FC<LandingPageProps> = ({ onStartGame, isStarting, initialNames, validateNames }) => {
  const initialCount = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, initialNames?.length || 4));
  const [playerCount, setPlayerCount] = useState<number>(initialCount);
  const [playerNames, setPlayerNames] = useState<string[]>(() => {
    const base = Array(MAX_PLAYERS).fill('');
    initialNames?.forEach((name, index) => {
      if (index < MAX_PLAYERS) base[index] = name;
    });
    return base;
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!initialNames || initialNames.length === 0) return;
    setPlayerCount(Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, initialNames.length)));
    setPlayerNames(prev => {
      const base = Array(MAX_PLAYERS).fill('');
      initialNames.forEach((name, index) => {
        if (index < MAX_PLAYERS) base[index] = name;
      });
      return base;
    });
  }, [initialNames]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isStarting) return;

    const namesToUse = playerNames
      .slice(0, playerCount)
      .map((name, index) => name.trim() || `שחקן ${index + 1}`);

    const validationError = validateNames(namesToUse);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage(null);
    onStartGame(namesToUse);
  };

  const handleNameChange = (index: number, value: string) => {
    setPlayerNames(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  return (
    <div className="landing-page">
      <div className="landing-card">
        <div className="landing-header">
          <p className="landing-tag"></p>
          <h1>ברוכים הבאים לקטאן</h1>
          <p className="landing-subtitle">
          </p>
        </div>

        <form className="landing-form" onSubmit={handleSubmit}>
          <label className="landing-label">כמה שחקנים משתתפים?</label>
          <div className="count-selector" role="group" aria-label="בחירת מספר שחקנים">
            {Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, offset) => offset + MIN_PLAYERS).map(count => (
              <button
                key={count}
                type="button"
                className={`count-option ${playerCount === count ? 'active' : ''}`}
                onClick={() => setPlayerCount(count)}
              >
                {count} שחקנים
              </button>
            ))}
          </div>

          <label className="landing-label">שמות שחקנים</label>
          <div className="names-grid">
            {Array.from({ length: playerCount }, (_, index) => index).map(index => (
              <div className="name-field" key={`player-name-${index}`}>
                <span className="name-field-label">שחקן {index + 1}</span>
                <input
                  type="text"
                  value={playerNames[index]}
                  onChange={event => handleNameChange(index, event.target.value)}
                  placeholder={`שחקן ${index + 1}`}
                />
              </div>
            ))}
          </div>

          {errorMessage && <div className="landing-error">{errorMessage}</div>}

          <button type="submit" className="start-game-btn" disabled={isStarting}>
            {isStarting ? 'מאתחל לוח...' : 'התחל משחק'}
          </button>
        </form>

        <ul className="landing-highlights">
         
        </ul>
      </div>
    </div>
  );
};

export default LandingPage;

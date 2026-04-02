import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../LanguageContext';
import { playCorrectSound, playWrongSound, playLevelUpSound, speakPrompt } from '../sounds';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ITEMS = [
  { emoji: '🍎', name: 'Apple' },
  { emoji: '🍌', name: 'Banana' },
  { emoji: '🍇', name: 'Grapes' },
  { emoji: '🍊', name: 'Orange' },
  { emoji: '🍓', name: 'Strawberry' },
  { emoji: '🍉', name: 'Watermelon' },
  { emoji: '🍒', name: 'Cherry' },
  { emoji: '🥕', name: 'Carrot' },
  { emoji: '🥦', name: 'Broccoli' },
  { emoji: '🌽', name: 'Corn' },
  { emoji: '🍕', name: 'Pizza' },
  { emoji: '🍩', name: 'Donut' },
  { emoji: '🧁', name: 'Cupcake' },
  { emoji: '🍪', name: 'Cookie' },
  { emoji: '🥑', name: 'Avocado' },
  { emoji: '🍋', name: 'Lemon' },
  { emoji: '🍑', name: 'Peach' },
  { emoji: '🥝', name: 'Kiwi' },
  { emoji: '🌶️', name: 'Pepper' },
  { emoji: '🍔', name: 'Burger' },
];

const TOTAL_ROUNDS = 10;
const OPTIONS_COUNT = 5;

const MONSTER_FACES = ['👾', '🐲', '😋', '🤩'];

export default function FeedMonster({ onBack }) {
  const { t, lang } = useLanguage();

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState(null);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [monsterState, setMonsterState] = useState('idle'); // idle | eating | sad
  const [gameOver, setGameOver] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const generateRound = useCallback(() => {
    const shuffled = shuffle(ITEMS);
    const correctItem = shuffled[0];
    const wrongItems = shuffled.slice(1, OPTIONS_COUNT);
    const allOptions = shuffle([correctItem, ...wrongItems]);
    setTarget(correctItem);
    setOptions(allOptions);
    setSelected(null);
    setIsCorrect(null);
    setMonsterState('idle');
    setAnimKey((k) => k + 1);

    setTimeout(() => {
      speakPrompt(correctItem.name, lang);
    }, 400);
  }, [lang]);

  useEffect(() => {
    if (!gameOver) {
      generateRound();
    }
  }, [round, gameOver, generateRound]);

  const handleSelect = (item, index) => {
    if (selected !== null) return;
    setSelected(index);

    if (item.emoji === target.emoji) {
      setIsCorrect(true);
      setMonsterState('eating');
      setScore((s) => s + 1);
      playCorrectSound(item.name, lang);

      setTimeout(() => {
        if (round + 1 >= TOTAL_ROUNDS) {
          setGameOver(true);
          playLevelUpSound(lang);
        } else {
          setRound((r) => r + 1);
        }
      }, 1500);
    } else {
      setIsCorrect(false);
      setMonsterState('sad');
      playWrongSound(target.name, lang);

      setTimeout(() => {
        if (round + 1 >= TOTAL_ROUNDS) {
          setGameOver(true);
          playLevelUpSound(lang);
        } else {
          setRound((r) => r + 1);
        }
      }, 1800);
    }
  };

  const handlePlayAgain = () => {
    setRound(0);
    setScore(0);
    setGameOver(false);
  };

  const monsterEmoji = monsterState === 'eating' ? '😋' : monsterState === 'sad' ? '😢' : '👾';

  const monsterAnimation =
    monsterState === 'eating'
      ? 'monster-eat 0.5s ease 3'
      : monsterState === 'sad'
      ? 'monster-shake 0.4s ease 2'
      : 'monster-bounce 2s ease-in-out infinite';

  if (gameOver) {
    const stars = score >= 9 ? '🌟🌟🌟' : score >= 7 ? '⭐⭐' : score >= 5 ? '⭐' : '💪';
    return (
      <div style={styles.container}>
        <div style={styles.gameOverCard}>
          <div style={{ fontSize: 80 }}>
            {score >= 7 ? '😋' : '👾'}
          </div>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{stars}</div>
          <div style={styles.gameOverTitle}>
            Great Job!
          </div>
          <div style={styles.gameOverScore}>
            {score} / {TOTAL_ROUNDS}
          </div>
          <div style={{ fontSize: 18, color: '#666', marginBottom: 24 }}>
            {score >= 9
              ? 'Amazing! 🎉'
              : score >= 7
              ? 'Well done! 👏'
              : 'Keep practicing! 💪'}
          </div>
          <button style={styles.playAgainBtn} onClick={handlePlayAgain}>
            🔄 Play Again
          </button>
          <button style={styles.backBtnLarge} onClick={onBack}>
            ← Back
          </button>
        </div>
        <style>{keyframes}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{keyframes}</style>

      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>
          ← Back
        </button>
        <div style={styles.scoreBox}>
          ⭐ {score}/{TOTAL_ROUNDS}
        </div>
        <div style={styles.roundBox}>
          {round + 1}/{TOTAL_ROUNDS}
        </div>
      </div>

      {/* Monster Area */}
      <div style={styles.monsterArea}>
        <div
          key={animKey + monsterState}
          style={{
            fontSize: 100,
            animation: monsterAnimation,
            transition: 'transform 0.3s',
            filter: monsterState === 'eating' ? 'drop-shadow(0 0 20px #4CAF50)' : 'none',
          }}
        >
          {monsterEmoji}
        </div>

        {/* Speech bubble */}
        <div style={styles.speechBubble}>
          <span style={{ fontSize: 20, fontWeight: 'bold' }}>
            Feed me the{' '}
            <span style={{ color: '#E91E63', fontSize: 24 }}>
              {target ? target.name : '...'}
            </span>
            !
          </span>
        </div>
      </div>

      {/* Food Grid */}
      <div style={styles.grid}>
        {options.map((item, i) => {
          let bg = '#fff';
          let border = '3px solid #ddd';
          let itemAnim = '';

          if (selected === i) {
            if (isCorrect) {
              bg = '#C8E6C9';
              border = '3px solid #4CAF50';
              itemAnim = 'pop 0.4s ease';
            } else {
              bg = '#FFCDD2';
              border = '3px solid #F44336';
              itemAnim = 'shake 0.4s ease';
            }
          } else if (selected !== null && item.emoji === target.emoji) {
            bg = '#C8E6C9';
            border = '3px solid #4CAF50';
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(item, i)}
              disabled={selected !== null}
              style={{
                ...styles.foodBtn,
                background: bg,
                border,
                animation: itemAnim,
                opacity: selected !== null && selected !== i && item.emoji !== target.emoji ? 0.5 : 1,
                cursor: selected !== null ? 'default' : 'pointer',
              }}
            >
              <span style={{ fontSize: 52 }}>{item.emoji}</span>
              <span style={{ fontSize: 14, fontWeight: 'bold', color: '#555', marginTop: 4 }}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div style={styles.progressContainer}>
        <div
          style={{
            ...styles.progressBar,
            width: `${((round) / TOTAL_ROUNDS) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}

const keyframes = `
  @keyframes monster-bounce {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-12px) scale(1.05); }
  }
  @keyframes monster-eat {
    0% { transform: scale(1); }
    30% { transform: scale(1.3) rotate(-5deg); }
    60% { transform: scale(0.9) rotate(5deg); }
    100% { transform: scale(1.1); }
  }
  @keyframes monster-shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-10px); }
    40% { transform: translateX(10px); }
    60% { transform: translateX(-6px); }
    80% { transform: translateX(6px); }
  }
  @keyframes pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-8px); }
    75% { transform: translateX(8px); }
  }
  @keyframes float-in {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #E8F5E9 0%, #FFF3E0 50%, #F3E5F5 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px',
    fontFamily: '"Nunito", "Segoe UI", sans-serif',
    userSelect: 'none',
  },
  header: {
    width: '100%',
    maxWidth: 500,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backBtn: {
    background: 'rgba(255,255,255,0.8)',
    border: '2px solid #ccc',
    borderRadius: 20,
    padding: '8px 16px',
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
    color: '#555',
  },
  scoreBox: {
    background: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: '8px 16px',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF9800',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  roundBox: {
    background: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: '8px 16px',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9C27B0',
  },
  monsterArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  speechBubble: {
    background: '#fff',
    borderRadius: 20,
    padding: '12px 24px',
    marginTop: 8,
    boxShadow: '0 3px 12px rgba(0,0,0,0.1)',
    position: 'relative',
    textAlign: 'center',
    maxWidth: 320,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    maxWidth: 380,
    width: '100%',
    padding: '0 8px',
  },
  foodBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    padding: '14px 8px',
    minHeight: 90,
    minWidth: 90,
    boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease',
    WebkitTapHighlightColor: 'transparent',
  },
  progressContainer: {
    width: '100%',
    maxWidth: 380,
    height: 8,
    background: '#ddd',
    borderRadius: 4,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
    borderRadius: 4,
    transition: 'width 0.5s ease',
  },
  gameOverCard: {
    background: '#fff',
    borderRadius: 30,
    padding: '40px 32px',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    marginTop: 40,
    maxWidth: 360,
    width: '100%',
    animation: 'float-in 0.6s ease',
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  gameOverScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  playAgainBtn: {
    background: 'linear-gradient(135deg, #4CAF50, #66BB6A)',
    color: '#fff',
    border: 'none',
    borderRadius: 30,
    padding: '16px 40px',
    fontSize: 20,
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(76,175,80,0.4)',
    marginBottom: 12,
    display: 'block',
    width: '100%',
  },
  backBtnLarge: {
    background: 'transparent',
    color: '#888',
    border: '2px solid #ddd',
    borderRadius: 30,
    padding: '12px 32px',
    fontSize: 18,
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'block',
    width: '100%',
  },
};

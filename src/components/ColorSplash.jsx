import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../LanguageContext';
import { playCorrectSound, playWrongSound, playLevelUpSound, speakPrompt } from '../sounds';

const COLORS = [
  { name: 'red', hex: '#FF4444' },
  { name: 'blue', hex: '#4488FF' },
  { name: 'green', hex: '#44CC44' },
  { name: 'yellow', hex: '#FFD700' },
  { name: 'purple', hex: '#9944CC' },
  { name: 'orange', hex: '#FF8800' },
  { name: 'pink', hex: '#FF69B4' },
];

const SHAPES = [
  { type: 'circle', label: 'Circle' },
  { type: 'square', label: 'Square' },
  { type: 'star', label: 'Star' },
  { type: 'diamond', label: 'Diamond' },
  { type: 'heart', label: 'Heart' },
  { type: 'triangle', label: 'Triangle' },
];

const TOTAL_ROUNDS = 10;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRound() {
  const target = pickRandom(COLORS);
  const shape = pickRandom(SHAPES);
  const others = COLORS.filter(c => c.name !== target.name);
  const shuffled = shuffle(others).slice(0, 3);
  const options = shuffle([target, ...shuffled]);
  return { target, shape, options };
}

function ShapeRenderer({ type, size, color, style: extraStyle }) {
  const base = {
    width: size,
    height: size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.4s ease, border-color 0.4s ease',
    ...extraStyle,
  };

  if (type === 'circle') {
    return (
      <div style={{
        ...base,
        borderRadius: '50%',
        background: color || '#E0E0E0',
        border: color ? 'none' : '4px dashed #BDBDBD',
      }} />
    );
  }
  if (type === 'square') {
    return (
      <div style={{
        ...base,
        borderRadius: 16,
        background: color || '#E0E0E0',
        border: color ? 'none' : '4px dashed #BDBDBD',
      }} />
    );
  }
  if (type === 'diamond') {
    return (
      <div style={{
        ...base,
        background: color || '#E0E0E0',
        border: color ? 'none' : '4px dashed #BDBDBD',
        borderRadius: 12,
        transform: 'rotate(45deg)',
      }} />
    );
  }
  if (type === 'star') {
    return (
      <div style={{
        ...base,
        fontSize: size * 0.85,
        lineHeight: 1,
        background: 'transparent',
        border: 'none',
        filter: color ? 'none' : 'grayscale(1) brightness(1.5)',
        color: color || '#BDBDBD',
      }}>
        ★
      </div>
    );
  }
  if (type === 'heart') {
    return (
      <div style={{
        ...base,
        fontSize: size * 0.75,
        lineHeight: 1,
        background: 'transparent',
        border: 'none',
        filter: color ? 'none' : 'grayscale(1) brightness(1.5)',
        color: color || '#BDBDBD',
      }}>
        ♥
      </div>
    );
  }
  if (type === 'triangle') {
    if (color) {
      return (
        <div style={{
          ...base,
          width: 0,
          height: 0,
          background: 'transparent',
          borderLeft: `${size / 2}px solid transparent`,
          borderRight: `${size / 2}px solid transparent`,
          borderBottom: `${size}px solid ${color}`,
        }} />
      );
    }
    return (
      <div style={{
        ...base,
        fontSize: size * 0.85,
        lineHeight: 1,
        background: 'transparent',
        border: 'none',
        color: '#BDBDBD',
      }}>
        △
      </div>
    );
  }

  return <div style={{ ...base, background: color || '#E0E0E0', borderRadius: '50%' }} />;
}

function PaintBucket({ color, onClick, shaking }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 72,
        height: 88,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 0,
        animation: shaking ? 'csSplashShake 0.5s ease' : 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
      aria-label={`${color.name} paint bucket`}
    >
      {/* Paint drip */}
      <div style={{
        width: 50,
        height: 12,
        borderRadius: '0 0 12px 12px',
        background: color.hex,
        marginBottom: -2,
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          position: 'absolute',
          bottom: -6,
          left: 8,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color.hex,
        }} />
      </div>
      {/* Bucket body */}
      <div style={{
        width: 56,
        height: 52,
        borderRadius: '6px 6px 14px 14px',
        background: color.hex,
        border: '3px solid rgba(0,0,0,0.15)',
        position: 'relative',
        boxShadow: `0 4px 8px rgba(0,0,0,0.2), inset 0 -8px 12px rgba(0,0,0,0.15)`,
      }}>
        {/* Bucket highlight */}
        <div style={{
          position: 'absolute',
          top: 6,
          left: 6,
          width: 10,
          height: 20,
          borderRadius: 6,
          background: 'rgba(255,255,255,0.35)',
        }} />
        {/* Handle */}
        <div style={{
          position: 'absolute',
          top: -18,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 36,
          height: 18,
          borderRadius: '18px 18px 0 0',
          border: '3px solid rgba(0,0,0,0.25)',
          borderBottom: 'none',
          background: 'transparent',
        }} />
      </div>
      {/* Label */}
      <div style={{
        marginTop: 4,
        fontSize: 12,
        fontWeight: 700,
        color: '#555',
        textTransform: 'capitalize',
      }}>
        {color.name}
      </div>
    </button>
  );
}

function SplashDroplets({ color, active }) {
  if (!active) return null;

  const droplets = [];
  const count = 8;
  for (let i = 0; i < count; i++) {
    const angle = (360 / count) * i;
    const dist = 60 + Math.random() * 40;
    const size = 12 + Math.random() * 16;
    const delay = i * 0.04;
    droplets.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: '50%',
          background: color,
          top: '50%',
          left: '50%',
          marginTop: -size / 2,
          marginLeft: -size / 2,
          animation: `csSplashDrop 0.7s ${delay}s ease-out forwards`,
          opacity: 0,
          ['--splash-x']: `${Math.cos((angle * Math.PI) / 180) * dist}px`,
          ['--splash-y']: `${Math.sin((angle * Math.PI) / 180) * dist}px`,
        }}
      />
    );
  }

  return <>{droplets}</>;
}

const styleTag = `
@keyframes csSplashDrop {
  0% { transform: translate(0,0) scale(0); opacity: 1; }
  60% { opacity: 1; }
  100% { transform: translate(var(--splash-x), var(--splash-y)) scale(1.3); opacity: 0; }
}
@keyframes csSplashShake {
  0%,100% { transform: translateX(0); }
  15% { transform: translateX(-8px); }
  30% { transform: translateX(8px); }
  45% { transform: translateX(-6px); }
  60% { transform: translateX(6px); }
  75% { transform: translateX(-3px); }
  90% { transform: translateX(3px); }
}
@keyframes csSplashBounce {
  0% { transform: scale(1); }
  30% { transform: scale(1.25); }
  50% { transform: scale(0.9); }
  70% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
@keyframes csSplashFillPulse {
  0% { transform: scale(0); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes csSplashFadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes csSplashRainbow {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}
`;

export default function ColorSplash({ onBack }) {
  const { t, lang } = useLanguage();
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [roundData, setRoundData] = useState(null);
  const [splashedColor, setSplashedColor] = useState(null);
  const [splashActive, setSplashActive] = useState(false);
  const [shakingBucket, setShakingBucket] = useState(null);
  const [bouncing, setBouncing] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'
  const [canTap, setCanTap] = useState(true);
  const timeoutRef = useRef(null);
  const hasSpoken = useRef(false);

  const startRound = useCallback((r) => {
    const data = generateRound();
    setRoundData(data);
    setSplashedColor(null);
    setSplashActive(false);
    setShakingBucket(null);
    setBouncing(false);
    setFeedback(null);
    setCanTap(true);
    hasSpoken.current = false;
  }, []);

  useEffect(() => {
    startRound(round);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [round, startRound]);

  useEffect(() => {
    if (roundData && !hasSpoken.current && !gameOver) {
      hasSpoken.current = true;
      const timer = setTimeout(() => {
        speakPrompt(roundData.target.name, lang);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [roundData, lang, gameOver]);

  const handleBucketTap = (color) => {
    if (!canTap || !roundData) return;

    if (color.name === roundData.target.name) {
      // Correct!
      setCanTap(false);
      setSplashedColor(color.hex);
      setSplashActive(true);
      setBouncing(true);
      setFeedback('correct');
      const newScore = score + 1;
      setScore(newScore);
      playCorrectSound(color.name, lang);

      timeoutRef.current = setTimeout(() => {
        if (round + 1 >= TOTAL_ROUNDS) {
          playLevelUpSound(lang);
          setGameOver(true);
        } else {
          setRound(r => r + 1);
        }
      }, 1500);
    } else {
      // Wrong
      setShakingBucket(color.name);
      setFeedback('wrong');
      playWrongSound(roundData.target.name, lang);

      timeoutRef.current = setTimeout(() => {
        setShakingBucket(null);
        setFeedback(null);
      }, 700);
    }
  };

  const handlePlayAgain = () => {
    setRound(0);
    setScore(0);
    setGameOver(false);
    setRoundData(null);
  };

  if (gameOver) {
    const stars = score >= 9 ? '🌟🌟🌟' : score >= 7 ? '🌟🌟' : score >= 5 ? '🌟' : '💪';
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Nunito', 'Segoe UI', sans-serif",
        padding: 20,
      }}>
        <style>{styleTag}</style>
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 28,
          padding: '40px 32px',
          textAlign: 'center',
          maxWidth: 340,
          width: '100%',
          animation: 'csSplashFadeIn 0.6s ease',
          boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
        }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>{stars}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#333', marginBottom: 4 }}>
            {t?.gameOver || 'Game Over!'}
          </div>
          <div style={{ fontSize: 20, color: '#666', marginBottom: 8 }}>
            {t?.score || 'Score'}: {score} / {TOTAL_ROUNDS}
          </div>
          <div style={{
            fontSize: 16,
            color: '#999',
            marginBottom: 24,
          }}>
            {score >= 9 ? (t?.amazing || 'Amazing!') : score >= 7 ? (t?.great || 'Great job!') : score >= 5 ? (t?.good || 'Good work!') : (t?.keepTrying || 'Keep trying!')}
          </div>
          <button
            onClick={handlePlayAgain}
            style={{
              width: '100%',
              padding: '16px 0',
              fontSize: 20,
              fontWeight: 700,
              border: 'none',
              borderRadius: 16,
              background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
              color: '#fff',
              cursor: 'pointer',
              marginBottom: 12,
              boxShadow: '0 4px 12px rgba(255,107,107,0.4)',
            }}
          >
            🎨 {t?.playAgain || 'Play Again'}
          </button>
          <button
            onClick={onBack}
            style={{
              width: '100%',
              padding: '14px 0',
              fontSize: 18,
              fontWeight: 600,
              border: '2px solid #ddd',
              borderRadius: 16,
              background: '#fff',
              color: '#666',
              cursor: 'pointer',
            }}
          >
            ← {t?.back || 'Back'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #E3F2FD 0%, #F3E5F5 50%, #FFF3E0 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{styleTag}</style>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        position: 'relative',
        zIndex: 10,
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.8)',
            border: 'none',
            borderRadius: 12,
            padding: '8px 16px',
            fontSize: 18,
            fontWeight: 700,
            color: '#555',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          ← {t?.back || 'Back'}
        </button>
        <div style={{
          background: 'rgba(255,255,255,0.8)',
          borderRadius: 12,
          padding: '8px 16px',
          fontSize: 16,
          fontWeight: 700,
          color: '#555',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          ⭐ {score} / {TOTAL_ROUNDS}
        </div>
      </div>

      {/* Round indicator */}
      <div style={{
        textAlign: 'center',
        padding: '4px 0',
        fontSize: 14,
        fontWeight: 600,
        color: '#999',
      }}>
        {t?.round || 'Round'} {round + 1} / {TOTAL_ROUNDS}
      </div>

      {/* Prompt */}
      {roundData && (
        <div style={{
          textAlign: 'center',
          padding: '12px 20px',
          animation: 'csSplashFadeIn 0.4s ease',
        }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: 20,
            padding: '10px 28px',
            fontSize: 24,
            fontWeight: 800,
            color: '#333',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          }}>
            🎨 {t?.splashIt || 'Splash it'}{' '}
            <span style={{ color: roundData.target.hex, textTransform: 'uppercase' }}>
              {roundData.target.name}
            </span>
            !
          </div>
        </div>
      )}

      {/* Center object area */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        {roundData && (
          <div style={{
            position: 'relative',
            animation: bouncing ? 'csSplashBounce 0.6s ease' : 'none',
          }}>
            {/* Splash droplets */}
            <SplashDroplets color={splashedColor} active={splashActive} />

            {/* The shape */}
            <ShapeRenderer
              type={roundData.shape.type}
              size={140}
              color={splashedColor}
              style={{}}
            />

            {/* Feedback emoji */}
            {feedback === 'correct' && (
              <div style={{
                position: 'absolute',
                top: -30,
                right: -20,
                fontSize: 36,
                animation: 'csSplashBounce 0.5s ease',
              }}>
                ✅
              </div>
            )}
            {feedback === 'wrong' && (
              <div style={{
                position: 'absolute',
                top: -30,
                right: -20,
                fontSize: 36,
                animation: 'csSplashShake 0.5s ease',
              }}>
                ❌
              </div>
            )}
          </div>
        )}
      </div>

      {/* Paint buckets area */}
      {roundData && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          padding: '20px 16px 36px',
          flexWrap: 'wrap',
        }}>
          {roundData.options.map((color) => (
            <PaintBucket
              key={color.name}
              color={color}
              shaking={shakingBucket === color.name}
              onClick={() => handleBucketTap(color)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

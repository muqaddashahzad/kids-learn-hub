import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '../LanguageContext';
import { playCorrectSound, playWrongSound, playLevelUpSound, speakPrompt } from '../sounds';

const ITEMS_POOL = [
  { name: 'car', emoji: '🚗' },
  { name: 'star', emoji: '⭐' },
  { name: 'apple', emoji: '🍎' },
  { name: 'cat', emoji: '🐱' },
  { name: 'tree', emoji: '🌳' },
  { name: 'fish', emoji: '🐟' },
  { name: 'moon', emoji: '🌙' },
  { name: 'ball', emoji: '⚽' },
  { name: 'bird', emoji: '🐦' },
  { name: 'flower', emoji: '🌸' },
  { name: 'house', emoji: '🏠' },
  { name: 'sun', emoji: '☀️' },
  { name: 'heart', emoji: '❤️' },
  { name: 'boat', emoji: '⛵' },
  { name: 'book', emoji: '📖' },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TOTAL_ROUNDS = 10;
const ITEMS_PER_ROUND = 3;

export default function MatchShadow({ onBack }) {
  const { t, lang } = useLanguage();
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [roundItems, setRoundItems] = useState([]);
  const [shadowOrder, setShadowOrder] = useState([]);
  const [matched, setMatched] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [feedback, setFeedback] = useState(null); // { type: 'correct'|'wrong', shadowIdx }
  const [bounceBack, setBounceBack] = useState(null);

  const dragRef = useRef(null);
  const shadowRefs = useRef({});
  const itemRefs = useRef({});
  const containerRef = useRef(null);

  const startRound = useCallback((roundNum) => {
    const picked = shuffle(ITEMS_POOL).slice(0, ITEMS_PER_ROUND);
    setRoundItems(picked);
    setShadowOrder(shuffle(picked));
    setMatched([]);
    setDragging(null);
    setFeedback(null);
    setBounceBack(null);
    setTimeout(() => speakPrompt('Match the shadows', lang), 300);
  }, [lang]);

  useEffect(() => {
    if (!gameOver) {
      startRound(round);
    }
  }, [round, gameOver, startRound]);

  const handleDragStart = (e, item, idx) => {
    if (matched.includes(item.name)) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = itemRefs.current[idx]?.getBoundingClientRect();
    dragRef.current = {
      item,
      idx,
      offsetX: clientX - (rect ? rect.left : 0),
      offsetY: clientY - (rect ? rect.top : 0),
      startX: rect ? rect.left : clientX,
      startY: rect ? rect.top : clientY,
    };
    setDragging(idx);
    setDragPos({ x: clientX, y: clientY });
  };

  const handleDragMove = useCallback((e) => {
    if (!dragRef.current) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragPos({ x: clientX, y: clientY });
  }, []);

  const handleDragEnd = useCallback((e) => {
    if (!dragRef.current) return;
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const { item } = dragRef.current;

    let foundMatch = false;
    for (let si = 0; si < shadowOrder.length; si++) {
      const shadowEl = shadowRefs.current[si];
      if (!shadowEl || matched.includes(shadowOrder[si].name)) continue;
      const rect = shadowEl.getBoundingClientRect();
      if (
        clientX >= rect.left - 10 &&
        clientX <= rect.right + 10 &&
        clientY >= rect.top - 10 &&
        clientY <= rect.bottom + 10
      ) {
        if (shadowOrder[si].name === item.name) {
          // Correct match
          foundMatch = true;
          const newMatched = [...matched, item.name];
          setMatched(newMatched);
          setFeedback({ type: 'correct', shadowIdx: si });
          playCorrectSound(item.name, lang);
          setScore((s) => s + 1);
          setTimeout(() => setFeedback(null), 600);

          if (newMatched.length === ITEMS_PER_ROUND) {
            setTimeout(() => {
              if (round + 1 >= TOTAL_ROUNDS) {
                playLevelUpSound(lang);
                setGameOver(true);
              } else {
                setRound((r) => r + 1);
              }
            }, 800);
          }
        } else {
          // Wrong match
          foundMatch = true;
          setFeedback({ type: 'wrong', shadowIdx: si });
          playWrongSound(item.name, lang);
          setBounceBack(dragRef.current.idx);
          setTimeout(() => {
            setFeedback(null);
            setBounceBack(null);
          }, 500);
        }
        break;
      }
    }

    if (!foundMatch) {
      setBounceBack(dragRef.current.idx);
      setTimeout(() => setBounceBack(null), 400);
    }

    dragRef.current = null;
    setDragging(null);
  }, [shadowOrder, matched, lang, round]);

  useEffect(() => {
    const onMove = (e) => handleDragMove(e);
    const onEnd = (e) => handleDragEnd(e);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  const handlePlayAgain = () => {
    setRound(0);
    setScore(0);
    setGameOver(false);
  };

  if (gameOver) {
    const finalScore = score;
    const maxScore = TOTAL_ROUNDS * ITEMS_PER_ROUND;
    return (
      <div style={styles.container}>
        <div style={styles.gameOverBox}>
          <div style={{ fontSize: 60 }}>🏆</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', marginTop: 12, color: '#333' }}>
            {t ? t('Game Over!') : 'Game Over!'}
          </div>
          <div style={{ fontSize: 22, marginTop: 8, color: '#555' }}>
            {t ? t('Score') : 'Score'}: {finalScore} / {maxScore}
          </div>
          <div style={{ fontSize: 48, marginTop: 8 }}>
            {finalScore >= maxScore * 0.8 ? '🌟🌟🌟' : finalScore >= maxScore * 0.5 ? '🌟🌟' : '🌟'}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={handlePlayAgain} style={styles.actionBtn}>
              🔄 {t ? t('Play Again') : 'Play Again'}
            </button>
            <button onClick={onBack} style={{ ...styles.actionBtn, background: '#78909c' }}>
              ◀ {t ? t('Back') : 'Back'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container} ref={containerRef}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>◀ {t ? t('Back') : 'Back'}</button>
        <div style={styles.info}>
          <span style={{ marginRight: 16 }}>⭐ {score}</span>
          <span>{t ? t('Round') : 'Round'} {round + 1}/{TOTAL_ROUNDS}</span>
        </div>
      </div>

      {/* Title */}
      <div style={styles.title}>
        🔦 {t ? t('Match the Shadows!') : 'Match the Shadows!'}
      </div>

      {/* Game area */}
      <div style={styles.gameArea}>
        {/* Objects - Left side */}
        <div style={styles.column}>
          <div style={styles.columnLabel}>{t ? t('Objects') : 'Objects'}</div>
          {roundItems.map((item, idx) => {
            const isMatched = matched.includes(item.name);
            const isDragging = dragging === idx;
            const isBouncing = bounceBack === idx;
            return (
              <div
                key={item.name + '-obj-' + idx}
                ref={(el) => (itemRefs.current[idx] = el)}
                onMouseDown={(e) => handleDragStart(e, item, idx)}
                onTouchStart={(e) => handleDragStart(e, item, idx)}
                style={{
                  ...styles.itemBox,
                  opacity: isMatched ? 0.3 : isDragging ? 0.4 : 1,
                  transform: isBouncing ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.3s ease, opacity 0.3s ease',
                  cursor: isMatched ? 'default' : 'grab',
                  background: isMatched ? '#c8e6c9' : '#fff',
                  pointerEvents: isMatched ? 'none' : 'auto',
                }}
              >
                <span style={{ fontSize: 48, userSelect: 'none' }}>{item.emoji}</span>
              </div>
            );
          })}
        </div>

        {/* Shadows - Right side */}
        <div style={styles.column}>
          <div style={styles.columnLabel}>{t ? t('Shadows') : 'Shadows'}</div>
          {shadowOrder.map((item, si) => {
            const isMatched = matched.includes(item.name);
            const hasFeedback = feedback && feedback.shadowIdx === si;
            const isCorrectFeedback = hasFeedback && feedback.type === 'correct';
            const isWrongFeedback = hasFeedback && feedback.type === 'wrong';
            return (
              <div
                key={item.name + '-shadow-' + si}
                ref={(el) => (shadowRefs.current[si] = el)}
                style={{
                  ...styles.shadowBox,
                  background: isCorrectFeedback
                    ? '#a5d6a7'
                    : isWrongFeedback
                    ? '#ef9a9a'
                    : isMatched
                    ? '#c8e6c9'
                    : '#e0e0e0',
                  boxShadow: isCorrectFeedback
                    ? '0 0 20px #4caf50'
                    : isWrongFeedback
                    ? '0 0 20px #f44336'
                    : '0 2px 6px rgba(0,0,0,0.12)',
                  transition: 'background 0.3s, box-shadow 0.3s',
                }}
              >
                {isMatched ? (
                  <span style={{ fontSize: 48, userSelect: 'none' }}>{item.emoji}</span>
                ) : (
                  <span
                    style={{
                      fontSize: 52,
                      filter: 'brightness(0)',
                      opacity: 0.3,
                      userSelect: 'none',
                    }}
                  >
                    {item.emoji}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dragging ghost */}
      {dragging !== null && (
        <div
          style={{
            position: 'fixed',
            left: dragPos.x - 35,
            top: dragPos.y - 35,
            fontSize: 52,
            pointerEvents: 'none',
            zIndex: 9999,
            filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.3))',
            transition: 'none',
            userSelect: 'none',
          }}
        >
          {roundItems[dragging]?.emoji}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
    padding: 12,
    fontFamily: '"Nunito", "Segoe UI", sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    userSelect: 'none',
    touchAction: 'none',
  },
  header: {
    width: '100%',
    maxWidth: 600,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backBtn: {
    background: '#78909c',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '10px 18px',
    fontSize: 18,
    fontWeight: 'bold',
    cursor: 'pointer',
    minHeight: 44,
    minWidth: 44,
  },
  info: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#37474f',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a148c',
    marginBottom: 12,
    textAlign: 'center',
  },
  gameArea: {
    display: 'flex',
    justifyContent: 'center',
    gap: 24,
    width: '100%',
    maxWidth: 600,
    flex: 1,
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  columnLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  itemBox: {
    width: 80,
    height: 80,
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 3px 8px rgba(0,0,0,0.15)',
    border: '3px solid #90caf9',
  },
  shadowBox: {
    width: 90,
    height: 90,
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px dashed #9e9e9e',
  },
  gameOverBox: {
    background: '#fff',
    borderRadius: 24,
    padding: '32px 28px',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    marginTop: 60,
    maxWidth: 360,
    width: '90%',
  },
  actionBtn: {
    background: '#7c4dff',
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    padding: '14px 28px',
    fontSize: 20,
    fontWeight: 'bold',
    cursor: 'pointer',
    minHeight: 52,
  },
};

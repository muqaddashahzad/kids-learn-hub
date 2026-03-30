import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../LanguageContext';
import { playCorrectSound, playWrongSound, playLevelUpSound, speakName } from '../sounds';

const ALL_ITEMS = [
  { name: 'cat', emoji: '🐱' },
  { name: 'dog', emoji: '🐶' },
  { name: 'rabbit', emoji: '🐰' },
  { name: 'bear', emoji: '🐻' },
  { name: 'fish', emoji: '🐟' },
  { name: 'bird', emoji: '🐦' },
  { name: 'apple', emoji: '🍎' },
  { name: 'banana', emoji: '🍌' },
  { name: 'grape', emoji: '🍇' },
  { name: 'pizza', emoji: '🍕' },
  { name: 'star', emoji: '⭐' },
  { name: 'heart', emoji: '❤️' },
  { name: 'sun', emoji: '☀️' },
  { name: 'moon', emoji: '🌙' },
  { name: 'flower', emoji: '🌸' },
  { name: 'car', emoji: '🚗' },
  { name: 'ball', emoji: '⚽' },
  { name: 'butterfly', emoji: '🦋' },
];

const DIFFICULTIES = {
  easy: { pairs: 3, cols: 3, rows: 2 },
  medium: { pairs: 6, cols: 4, rows: 3 },
  hard: { pairs: 8, cols: 4, rows: 4 },
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MatchPairs({ onBack }) {
  const { t, lang } = useLanguage();
  const [difficulty, setDifficulty] = useState(null);
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState(new Set());
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [lockBoard, setLockBoard] = useState(false);
  const mounted = useRef(true);
  const timerRef = useRef(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer
  useEffect(() => {
    if (startTime && !gameOver) {
      timerRef.current = setInterval(() => {
        if (mounted.current) setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [startTime, gameOver]);

  const startGame = useCallback((diff) => {
    const config = DIFFICULTIES[diff];
    const items = shuffle(ALL_ITEMS).slice(0, config.pairs);
    const deck = shuffle([...items, ...items].map((item, idx) => ({
      id: idx,
      name: item.name,
      emoji: item.emoji,
    })));
    setDifficulty(diff);
    setCards(deck);
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setStartTime(Date.now());
    setElapsed(0);
    setGameOver(false);
    setLockBoard(false);
  }, []);

  const handleFlip = useCallback((idx) => {
    if (lockBoard || flipped.includes(idx) || matched.has(cards[idx].name)) return;

    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);

    // Speak name
    speakName(cards[idx].name, lang);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      setLockBoard(true);
      const [first, second] = newFlipped;

      if (cards[first].name === cards[second].name) {
        // Match!
        playCorrectSound(cards[first].name, lang);
        const newMatched = new Set([...matched, cards[first].name]);
        setMatched(newMatched);
        setFlipped([]);
        setLockBoard(false);

        const totalPairs = DIFFICULTIES[difficulty]?.pairs || 3;
        if (newMatched.size === totalPairs) {
          playLevelUpSound(lang);
          setTimeout(() => { if (mounted.current) setGameOver(true); }, 600);
        }
      } else {
        // No match
        playWrongSound(cards[first].name, lang);
        setTimeout(() => {
          if (mounted.current) {
            setFlipped([]);
            setLockBoard(false);
          }
        }, 1000);
      }
    }
  }, [lockBoard, flipped, matched, cards, lang, difficulty]);

  const restart = () => {
    setDifficulty(null);
  };

  // Difficulty select
  if (!difficulty) {
    return (
      <div className="game-screen">
        <div className="game-header">
          <button className="back-btn" onClick={onBack} style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer' }}>←</button>
          <span className="game-title" style={{ fontSize: '24px', fontWeight: 'bold' }}>🃏 Match Pairs</span>
        </div>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🧠</div>
          <div style={{ fontSize: '24px', marginBottom: '30px', fontWeight: 'bold' }}>Pick a Level!</div>
          {[
            { key: 'easy', label: '⭐ Easy', sub: '3 pairs (2×3)', color: '#4CAF50' },
            { key: 'medium', label: '⭐⭐ Medium', sub: '6 pairs (3×4)', color: '#FF9800' },
            { key: 'hard', label: '⭐⭐⭐ Hard', sub: '8 pairs (4×4)', color: '#f44336' },
          ].map((d) => (
            <button key={d.key} onClick={() => startGame(d.key)}
              style={{
                display: 'block', width: '80%', margin: '12px auto', padding: '16px',
                fontSize: '22px', borderRadius: '20px', border: 'none',
                background: d.color, color: '#fff', cursor: 'pointer',
              }}>
              {d.label}<br /><span style={{ fontSize: '16px' }}>{d.sub}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (gameOver) {
    const config = DIFFICULTIES[difficulty];
    const perfectMoves = config.pairs;
    const stars = moves <= perfectMoves + 2 ? 3 : moves <= perfectMoves * 2 ? 2 : 1;
    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    const msg = stars === 3 ? 'Perfect memory!' : stars === 2 ? 'Great job!' : 'Good try!';
    const min = Math.floor(elapsed / 60);
    const sec = elapsed % 60;
    return (
      <div className="game-screen">
        <div className="result-screen">
          <div className="result-emoji" style={{ fontSize: '60px' }}>{starStr}</div>
          <div className="result-score" style={{ fontSize: '28px', margin: '12px 0' }}>
            {moves} moves · {min > 0 ? `${min}m ` : ''}{sec}s
          </div>
          <div className="result-message" style={{ fontSize: '24px', marginBottom: '24px' }}>{msg}</div>
          <button className="play-again-btn" onClick={restart}
            style={{ fontSize: '22px', padding: '14px 36px', borderRadius: '30px', border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer' }}>
            🔄 Play Again
          </button>
          <br />
          <button className="back-btn" onClick={onBack}
            style={{ marginTop: '16px', fontSize: '18px', padding: '10px 28px', borderRadius: '20px', border: 'none', background: '#ff9800', color: '#fff', cursor: 'pointer' }}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  const config = DIFFICULTIES[difficulty];
  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={onBack} style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer' }}>←</button>
        <span className="game-title" style={{ fontSize: '20px', fontWeight: 'bold' }}>🃏 Match Pairs</span>
        <span style={{ fontSize: '16px' }}>🔄 {moves} · ⏱ {min > 0 ? `${min}:` : ''}{String(sec).padStart(2, '0')}</span>
      </div>

      <div style={{ textAlign: 'center', fontSize: '16px', color: '#777', margin: '6px 0' }}>
        {matched.size} / {config.pairs} pairs found
      </div>

      <div className="display-area" style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
        gap: '8px',
        padding: '12px',
        maxWidth: '400px',
        margin: '0 auto',
      }}>
        {cards.map((card, idx) => {
          const isFlipped = flipped.includes(idx);
          const isMatched = matched.has(card.name);
          const showFace = isFlipped || isMatched;

          return (
            <button key={card.id} onClick={() => handleFlip(idx)}
              style={{
                aspectRatio: '1',
                fontSize: showFace ? (difficulty === 'hard' ? '32px' : '40px') : (difficulty === 'hard' ? '28px' : '36px'),
                borderRadius: '14px',
                border: isMatched ? '3px solid #4CAF50' : '3px solid #90caf9',
                background: isMatched ? '#e8f5e9' : showFace ? '#fff' : 'linear-gradient(135deg, #42a5f5, #1976d2)',
                cursor: isMatched ? 'default' : 'pointer',
                transition: 'transform 0.3s, background 0.3s',
                transform: showFace ? 'rotateY(0deg)' : 'rotateY(0deg)',
                opacity: isMatched ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              }}>
              {showFace ? card.emoji : '❓'}
            </button>
          );
        })}
      </div>
    </div>
  );
}

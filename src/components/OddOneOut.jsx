import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../LanguageContext';
import { playCorrectSound, playWrongSound, playLevelUpSound, speakPrompt } from '../sounds';

const CATEGORIES = [
  {
    name: 'fruits',
    items: [
      { name: 'apple', emoji: '🍎' },
      { name: 'banana', emoji: '🍌' },
      { name: 'orange', emoji: '🍊' },
      { name: 'grape', emoji: '🍇' },
      { name: 'strawberry', emoji: '🍓' },
      { name: 'watermelon', emoji: '🍉' },
    ],
    odd: [
      { name: 'car', emoji: '🚗', reason: 'not a fruit' },
      { name: 'book', emoji: '📖', reason: 'not a fruit' },
      { name: 'shoe', emoji: '👟', reason: 'not a fruit' },
      { name: 'hat', emoji: '🎩', reason: 'not a fruit' },
    ],
  },
  {
    name: 'animals',
    items: [
      { name: 'cat', emoji: '🐱' },
      { name: 'dog', emoji: '🐶' },
      { name: 'bird', emoji: '🐦' },
      { name: 'rabbit', emoji: '🐰' },
      { name: 'fish', emoji: '🐟' },
      { name: 'bear', emoji: '🐻' },
    ],
    odd: [
      { name: 'book', emoji: '📖', reason: 'not an animal' },
      { name: 'pizza', emoji: '🍕', reason: 'not an animal' },
      { name: 'sun', emoji: '☀️', reason: 'not an animal' },
      { name: 'ball', emoji: '⚽', reason: 'not an animal' },
    ],
  },
  {
    name: 'vehicles',
    items: [
      { name: 'car', emoji: '🚗' },
      { name: 'bus', emoji: '🚌' },
      { name: 'train', emoji: '🚂' },
      { name: 'airplane', emoji: '✈️' },
      { name: 'bicycle', emoji: '🚲' },
      { name: 'boat', emoji: '⛵' },
    ],
    odd: [
      { name: 'apple', emoji: '🍎', reason: 'not a vehicle' },
      { name: 'cat', emoji: '🐱', reason: 'not a vehicle' },
      { name: 'flower', emoji: '🌸', reason: 'not a vehicle' },
      { name: 'cookie', emoji: '🍪', reason: 'not a vehicle' },
    ],
  },
  {
    name: 'food',
    items: [
      { name: 'pizza', emoji: '🍕' },
      { name: 'burger', emoji: '🍔' },
      { name: 'cookie', emoji: '🍪' },
      { name: 'cake', emoji: '🎂' },
      { name: 'ice cream', emoji: '🍦' },
      { name: 'donut', emoji: '🍩' },
    ],
    odd: [
      { name: 'tree', emoji: '🌳', reason: 'not food' },
      { name: 'star', emoji: '⭐', reason: 'not food' },
      { name: 'house', emoji: '🏠', reason: 'not food' },
      { name: 'pencil', emoji: '✏️', reason: 'not food' },
    ],
  },
  {
    name: 'nature',
    items: [
      { name: 'flower', emoji: '🌸' },
      { name: 'tree', emoji: '🌳' },
      { name: 'sun', emoji: '☀️' },
      { name: 'rainbow', emoji: '🌈' },
      { name: 'cloud', emoji: '☁️' },
      { name: 'leaf', emoji: '🍃' },
    ],
    odd: [
      { name: 'robot', emoji: '🤖', reason: 'not nature' },
      { name: 'phone', emoji: '📱', reason: 'not nature' },
      { name: 'guitar', emoji: '🎸', reason: 'not nature' },
      { name: 'trophy', emoji: '🏆', reason: 'not nature' },
    ],
  },
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

export default function OddOneOut({ onBack }) {
  const { t, lang } = useLanguage();
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [items, setItems] = useState([]);
  const [oddIndex, setOddIndex] = useState(-1);
  const [feedback, setFeedback] = useState(null);
  const [selected, setSelected] = useState(-1);
  const [gameOver, setGameOver] = useState(false);
  const [explanation, setExplanation] = useState('');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const generateRound = useCallback(() => {
    const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const picked = shuffle(cat.items).slice(0, 3);
    const odd = cat.odd[Math.floor(Math.random() * cat.odd.length)];
    const all = shuffle([...picked, odd]);
    const oi = all.findIndex((item) => item.name === odd.name);
    setItems(all);
    setOddIndex(oi);
    setFeedback(null);
    setSelected(-1);
    setExplanation(`${odd.emoji} ${odd.name} is ${odd.reason}!`);
    speakPrompt('Which one does not belong?', lang).catch(() => {});
  }, [lang]);

  useEffect(() => {
    if (!gameOver) generateRound();
  }, [round, gameOver, generateRound]);

  const handlePick = useCallback((idx) => {
    if (feedback !== null) return;
    setSelected(idx);
    if (idx === oddIndex) {
      setFeedback('correct');
      setScore((s) => s + 1);
      playCorrectSound(items[idx].name, lang);
      setTimeout(() => {
        if (!mounted.current) return;
        if (round + 1 >= TOTAL_ROUNDS) {
          playLevelUpSound(lang);
          setGameOver(true);
        } else {
          setRound((r) => r + 1);
        }
      }, 1800);
    } else {
      setFeedback('wrong');
      playWrongSound(items[idx].name, lang);
      setTimeout(() => {
        if (!mounted.current) return;
        if (round + 1 >= TOTAL_ROUNDS) {
          setGameOver(true);
        } else {
          setRound((r) => r + 1);
        }
      }, 2000);
    }
  }, [feedback, oddIndex, items, lang, round]);

  const restart = () => {
    setRound(0);
    setScore(0);
    setGameOver(false);
  };

  if (gameOver) {
    const emoji = score >= 8 ? '🏆' : score >= 5 ? '⭐' : '💪';
    const msg = score >= 8 ? 'Amazing!' : score >= 5 ? 'Good job!' : 'Keep trying!';
    return (
      <div className="game-screen">
        <div className="result-screen">
          <div className="result-emoji" style={{ fontSize: '80px' }}>{emoji}</div>
          <div className="result-score" style={{ fontSize: '36px', margin: '16px 0' }}>
            {score} / {TOTAL_ROUNDS}
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

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={onBack} style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer' }}>← </button>
        <span className="game-title" style={{ fontSize: '22px', fontWeight: 'bold' }}>🤔 Odd One Out</span>
        <span style={{ fontSize: '18px' }}>⭐ {score}/{round + 1}</span>
      </div>

      <div style={{ textAlign: 'center', fontSize: '22px', margin: '10px 0', color: '#555' }}>
        Round {round + 1} of {TOTAL_ROUNDS}
      </div>

      <div style={{ textAlign: 'center', fontSize: '24px', margin: '12px 0', fontWeight: 'bold', color: '#333' }}>
        Which one doesn't belong? 🤔
      </div>

      <div className="display-area" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '20px', maxWidth: '360px', margin: '0 auto' }}>
        {items.map((item, idx) => {
          let bg = '#f0f0f0';
          let border = '3px solid #ddd';
          if (selected === idx && feedback === 'correct') { bg = '#c8e6c9'; border = '3px solid #4CAF50'; }
          if (selected === idx && feedback === 'wrong') { bg = '#ffcdd2'; border = '3px solid #f44336'; }
          if (feedback === 'correct' && idx === oddIndex && selected !== idx) { bg = '#c8e6c9'; border = '3px solid #4CAF50'; }
          return (
            <button key={idx} onClick={() => handlePick(idx)}
              style={{
                fontSize: '64px', padding: '20px', borderRadius: '20px',
                background: bg, border, cursor: 'pointer',
                transition: 'transform 0.2s, background 0.3s',
                transform: selected === idx ? 'scale(1.1)' : 'scale(1)',
              }}>
              {item.emoji}
            </button>
          );
        })}
      </div>

      {feedback && (
        <div className="feedback" style={{
          textAlign: 'center', fontSize: '22px', margin: '16px 0', padding: '12px',
          borderRadius: '16px',
          background: feedback === 'correct' ? '#e8f5e9' : '#fce4ec',
          color: feedback === 'correct' ? '#2e7d32' : '#c62828',
          fontWeight: 'bold',
        }}>
          {feedback === 'correct' ? `✅ Correct! ${explanation}` : `❌ Not quite! ${explanation}`}
        </div>
      )}
    </div>
  );
}

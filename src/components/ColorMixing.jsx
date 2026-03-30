import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../LanguageContext';
import { playCorrectSound, playWrongSound, playLevelUpSound, speakPrompt } from '../sounds';

const COLOR_MAP = {
  red: '#f44336',
  blue: '#2196F3',
  yellow: '#FFEB3B',
  white: '#f5f5f5',
  black: '#333333',
  purple: '#9C27B0',
  orange: '#FF9800',
  green: '#4CAF50',
  pink: '#E91E63',
  gray: '#9E9E9E',
};

const MIXES = [
  { c1: 'red', c2: 'blue', result: 'purple', distractors: ['orange', 'green', 'pink'] },
  { c1: 'red', c2: 'yellow', result: 'orange', distractors: ['purple', 'green', 'pink'] },
  { c1: 'blue', c2: 'yellow', result: 'green', distractors: ['purple', 'orange', 'pink'] },
  { c1: 'red', c2: 'white', result: 'pink', distractors: ['purple', 'orange', 'gray'] },
  { c1: 'black', c2: 'white', result: 'gray', distractors: ['purple', 'pink', 'green'] },
];

const TOTAL_ROUNDS = 8;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ColorMixing({ onBack }) {
  const { t, lang } = useLanguage();
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [mix, setMix] = useState(null);
  const [options, setOptions] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [selected, setSelected] = useState(null);
  const [mixing, setMixing] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const generateRound = useCallback(() => {
    const m = MIXES[Math.floor(Math.random() * MIXES.length)];
    const opts = shuffle([m.result, ...shuffle(m.distractors).slice(0, 2)]);
    setMix(m);
    setOptions(opts);
    setFeedback(null);
    setSelected(null);
    setMixing(true);

    setTimeout(() => {
      if (mounted.current) setMixing(false);
    }, 1500);

    speakPrompt(`${m.c1} plus ${m.c2} makes what color?`, lang).catch(() => {});
  }, [lang]);

  useEffect(() => {
    if (!gameOver) generateRound();
  }, [round, gameOver, generateRound]);

  const handlePick = useCallback((color) => {
    if (feedback !== null || mixing) return;
    setSelected(color);
    if (color === mix.result) {
      setFeedback('correct');
      setScore((s) => s + 1);
      playCorrectSound(color, lang);
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
      playWrongSound(color, lang);
      setTimeout(() => {
        if (!mounted.current) return;
        if (round + 1 >= TOTAL_ROUNDS) {
          setGameOver(true);
        } else {
          setRound((r) => r + 1);
        }
      }, 2000);
    }
  }, [feedback, mixing, mix, lang, round]);

  const restart = () => {
    setRound(0);
    setScore(0);
    setGameOver(false);
  };

  if (gameOver) {
    const emoji = score >= 7 ? '🎨' : score >= 4 ? '🌈' : '💪';
    const msg = score >= 7 ? 'Color master!' : score >= 4 ? 'Great mixing!' : 'Keep exploring colors!';
    return (
      <div className="game-screen">
        <div className="result-screen">
          <div className="result-emoji" style={{ fontSize: '80px' }}>{emoji}</div>
          <div className="result-score" style={{ fontSize: '36px', margin: '16px 0' }}>{score} / {TOTAL_ROUNDS}</div>
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

  if (!mix) return null;

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={onBack} style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer' }}>←</button>
        <span className="game-title" style={{ fontSize: '22px', fontWeight: 'bold' }}>🎨 Color Mixing</span>
        <span style={{ fontSize: '18px' }}>⭐ {score}/{round + 1}</span>
      </div>

      <div style={{ textAlign: 'center', fontSize: '18px', color: '#777', margin: '8px 0' }}>
        Round {round + 1} of {TOTAL_ROUNDS}
      </div>

      <div className="display-area" style={{ textAlign: 'center', padding: '20px', position: 'relative' }}>
        <div style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px', color: '#333' }}>
          Mix the colors! 🎨
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: mixing ? '0px' : '20px', transition: 'gap 1s ease-in-out', margin: '20px 0' }}>
          {/* Color 1 */}
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%',
            background: COLOR_MAP[mix.c1],
            border: mix.c1 === 'white' ? '2px solid #ccc' : 'none',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'transform 1s ease-in-out',
            transform: mixing ? 'translateX(30px) scale(0.9)' : 'translateX(0) scale(1)',
            zIndex: 1,
          }} />

          {/* Plus sign */}
          <div style={{
            fontSize: '36px', fontWeight: 'bold', color: '#555',
            opacity: mixing ? 0 : 1, transition: 'opacity 0.5s',
            width: mixing ? '0' : 'auto',
          }}>+</div>

          {/* Color 2 */}
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%',
            background: COLOR_MAP[mix.c2],
            border: mix.c2 === 'white' ? '2px solid #ccc' : 'none',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'transform 1s ease-in-out',
            transform: mixing ? 'translateX(-30px) scale(0.9)' : 'translateX(0) scale(1)',
            zIndex: 1,
          }} />
        </div>

        {/* Result splash */}
        {!mixing && (
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '16px 0',
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: feedback === 'correct' ? COLOR_MAP[mix.result] : 'linear-gradient(135deg, #ddd, #bbb)',
              boxShadow: feedback === 'correct' ? `0 0 30px ${COLOR_MAP[mix.result]}` : '0 4px 10px rgba(0,0,0,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px', color: '#fff',
              animation: feedback === 'correct' ? 'none' : 'none',
            }}>
              {feedback === 'correct' ? '✨' : '❓'}
            </div>
          </div>
        )}

        <div style={{ fontSize: '20px', color: '#555', margin: '8px 0' }}>
          <span style={{ fontWeight: 'bold', color: COLOR_MAP[mix.c1], textShadow: mix.c1 === 'yellow' ? '0 0 2px #999' : 'none' }}>{mix.c1}</span>
          {' + '}
          <span style={{ fontWeight: 'bold', color: COLOR_MAP[mix.c2], textShadow: mix.c2 === 'white' ? '0 0 2px #999' : 'none' }}>{mix.c2}</span>
          {' = ?'}
        </div>
      </div>

      <div className="options-grid" style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', padding: '0 20px' }}>
        {options.map((color, idx) => {
          let border = '3px solid #ddd';
          let transform = 'scale(1)';
          if (selected === color && feedback === 'correct') { border = '4px solid #4CAF50'; transform = 'scale(1.1)'; }
          if (selected === color && feedback === 'wrong') { border = '4px solid #f44336'; }
          if (feedback === 'wrong' && color === mix.result) { border = '4px solid #4CAF50'; }
          return (
            <button key={idx} className="option-btn" onClick={() => handlePick(color)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                padding: '14px 20px', borderRadius: '20px', background: '#fff',
                border, cursor: 'pointer', transition: 'transform 0.2s', transform,
                minWidth: '90px',
              }}>
              <div style={{
                width: '50px', height: '50px', borderRadius: '50%',
                background: COLOR_MAP[color],
                border: color === 'white' ? '2px solid #ccc' : 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }} />
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#555', textTransform: 'capitalize' }}>{color}</span>
            </button>
          );
        })}
      </div>

      {feedback && (
        <div className="feedback" style={{
          textAlign: 'center', fontSize: '22px', margin: '16px', padding: '12px',
          borderRadius: '16px', fontWeight: 'bold',
          background: feedback === 'correct' ? '#e8f5e9' : '#fce4ec',
          color: feedback === 'correct' ? '#2e7d32' : '#c62828',
        }}>
          {feedback === 'correct'
            ? `✅ ${mix.c1} + ${mix.c2} = ${mix.result}!`
            : `❌ It makes ${mix.result}!`}
        </div>
      )}
    </div>
  );
}

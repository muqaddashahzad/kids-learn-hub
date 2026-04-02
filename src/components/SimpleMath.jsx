import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../LanguageContext';
import { playCorrectSound, playWrongSound, playLevelUpSound, speakPrompt } from '../sounds';

const EMOJIS = ['🍎', '🌟', '🐱', '🎈', '🍪', '🌸', '🐶', '🍕', '⚽', '🦋'];
const TOTAL_ROUNDS = 10;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateOptions(correct, min, max) {
  const opts = new Set([correct]);
  while (opts.size < 4) {
    let n = Math.floor(Math.random() * (max - min + 1)) + min;
    if (n < 0) n = 0;
    opts.add(n);
  }
  return shuffle([...opts]);
}

export default function SimpleMath({ onBack }) {
  const { t, lang } = useLanguage();
  const [difficulty, setDifficulty] = useState(null); // 'easy','medium','hard'
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [problem, setProblem] = useState(null);
  const [options, setOptions] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [selected, setSelected] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const generateProblem = useCallback(() => {
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    let a, b, op, answer;

    if (difficulty === 'easy') {
      a = Math.floor(Math.random() * 4) + 1;
      b = Math.floor(Math.random() * 4) + 1;
      op = '+';
      answer = a + b;
    } else if (difficulty === 'medium') {
      a = Math.floor(Math.random() * 7) + 1;
      b = Math.floor(Math.random() * 7) + 1;
      op = '+';
      answer = a + b;
    } else {
      if (Math.random() < 0.5) {
        a = Math.floor(Math.random() * 7) + 1;
        b = Math.floor(Math.random() * 7) + 1;
        op = '+';
        answer = a + b;
      } else {
        a = Math.floor(Math.random() * 8) + 2;
        b = Math.floor(Math.random() * a) + 1;
        op = '−';
        answer = a - b;
      }
    }

    const maxOpt = difficulty === 'easy' ? 10 : 20;
    setProblem({ a, b, op, answer, emoji });
    setOptions(generateOptions(answer, Math.max(0, answer - 3), answer + 3));
    setFeedback(null);
    setSelected(null);

    const prompt = `${a} ${op === '+' ? 'plus' : 'minus'} ${b} equals what?`;
    speakPrompt(prompt, lang).catch(() => {});
  }, [difficulty, lang]);

  useEffect(() => {
    if (difficulty && !gameOver) generateProblem();
  }, [round, difficulty, gameOver, generateProblem]);

  const handleAnswer = useCallback((val) => {
    if (feedback !== null) return;
    setSelected(val);
    if (val === problem.answer) {
      setFeedback('correct');
      setScore((s) => s + 1);
      playCorrectSound(String(val), lang);
      setTimeout(() => {
        if (!mounted.current) return;
        if (round + 1 >= TOTAL_ROUNDS) {
          playLevelUpSound(lang);
          setGameOver(true);
        } else {
          setRound((r) => r + 1);
        }
      }, 1500);
    } else {
      setFeedback('wrong');
      playWrongSound(String(val), lang);
      setTimeout(() => {
        if (!mounted.current) return;
        if (round + 1 >= TOTAL_ROUNDS) {
          setGameOver(true);
        } else {
          setRound((r) => r + 1);
        }
      }, 2000);
    }
  }, [feedback, problem, lang, round]);

  const restart = () => {
    setRound(0);
    setScore(0);
    setGameOver(false);
    setDifficulty(null);
  };

  // Difficulty select
  if (!difficulty) {
    return (
      <div className="game-screen">
        <div className="game-header">
          <button className="back-btn" onClick={onBack}>←</button>
          <span className="game-title">🧮 Simple Math</span>
        </div>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🧮</div>
          <div style={{ fontSize: '24px', marginBottom: '30px', fontWeight: 'bold' }}>Pick a Level!</div>
          {[
            { key: 'easy', label: '⭐ Easy', sub: 'Add 1-5', color: '#4CAF50' },
            { key: 'medium', label: '⭐⭐ Medium', sub: 'Add 1-10', color: '#FF9800' },
            { key: 'hard', label: '⭐⭐⭐ Hard', sub: 'Add & Subtract', color: '#f44336' },
          ].map((d) => (
            <button key={d.key} onClick={() => setDifficulty(d.key)}
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
    const emoji = score >= 8 ? '🏆' : score >= 5 ? '🌟' : '💪';
    const msg = score >= 8 ? 'Math genius!' : score >= 5 ? 'Great counting!' : 'Keep practicing!';
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

  if (!problem) return null;

  const emojiRowA = Array(problem.a).fill(problem.emoji).join(' ');
  const emojiRowB = Array(problem.b).fill(problem.emoji).join(' ');

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <span className="game-title">🧮 Math</span>
        <span style={{ fontSize: '18px' }}>⭐ {score}/{round + 1}</span>
      </div>

      <div style={{ textAlign: 'center', fontSize: '18px', color: '#777', margin: '8px 0' }}>
        Round {round + 1} of {TOTAL_ROUNDS}
      </div>

      <div className="display-area" style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{ fontSize: '36px', lineHeight: '1.6', margin: '10px 0', wordBreak: 'break-word' }}>
          {emojiRowA}
        </div>
        <div style={{ fontSize: '48px', fontWeight: 'bold', color: problem.op === '+' ? '#4CAF50' : '#f44336', margin: '4px 0' }}>
          {problem.op}
        </div>
        <div style={{ fontSize: '36px', lineHeight: '1.6', margin: '10px 0', wordBreak: 'break-word' }}>
          {emojiRowB}
        </div>
        <div style={{ fontSize: '48px', fontWeight: 'bold', margin: '8px 0', color: '#333' }}>= ❓</div>
      </div>

      <div className="options-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '0 24px', maxWidth: '360px', margin: '0 auto' }}>
        {options.map((val, idx) => {
          let bg = '#e3f2fd';
          let border = '3px solid #90caf9';
          if (selected === val && feedback === 'correct') { bg = '#c8e6c9'; border = '3px solid #4CAF50'; }
          if (selected === val && feedback === 'wrong') { bg = '#ffcdd2'; border = '3px solid #f44336'; }
          if (feedback === 'wrong' && val === problem.answer) { bg = '#c8e6c9'; border = '3px solid #4CAF50'; }
          return (
            <button key={idx} className="option-btn" onClick={() => handleAnswer(val)}
              style={{
                fontSize: '40px', padding: '18px', borderRadius: '20px',
                background: bg, border, cursor: 'pointer', fontWeight: 'bold',
                color: '#1565c0', transition: 'transform 0.2s',
                transform: selected === val ? 'scale(1.1)' : 'scale(1)',
              }}>
              {val}
            </button>
          );
        })}
      </div>

      {feedback && (
        <div className="feedback" style={{
          textAlign: 'center', fontSize: '24px', margin: '16px', padding: '12px',
          borderRadius: '16px', fontWeight: 'bold',
          background: feedback === 'correct' ? '#e8f5e9' : '#fce4ec',
          color: feedback === 'correct' ? '#2e7d32' : '#c62828',
        }}>
          {feedback === 'correct'
            ? `✅ ${problem.a} ${problem.op} ${problem.b} = ${problem.answer}!`
            : `❌ It was ${problem.answer}!`}
        </div>
      )}
    </div>
  );
}

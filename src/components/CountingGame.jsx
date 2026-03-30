import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../LanguageContext';
import { playCorrectSound, playWrongSound, playLevelUpSound, speakPrompt } from '../sounds';

const EMOJI_SETS = [
  { emoji: '🍎', name: 'apples' },
  { emoji: '🍌', name: 'bananas' },
  { emoji: '🐱', name: 'cats' },
  { emoji: '🐶', name: 'dogs' },
  { emoji: '⭐', name: 'stars' },
  { emoji: '🌸', name: 'flowers' },
  { emoji: '🐟', name: 'fish' },
  { emoji: '🦋', name: 'butterflies' },
  { emoji: '🍓', name: 'strawberries' },
  { emoji: '🐥', name: 'chicks' },
  { emoji: '🎈', name: 'balloons' },
  { emoji: '🍪', name: 'cookies' },
];

const BUTTON_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9',
];

function generateRound(difficulty) {
  const maxNum = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 8 : 10;
  const correct = Math.floor(Math.random() * maxNum) + 1;
  const emojiSet = EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)];

  const options = new Set([correct]);
  while (options.size < 4) {
    let opt = Math.floor(Math.random() * maxNum) + 1;
    if (opt !== correct) options.add(opt);
  }
  const shuffled = Array.from(options).sort(() => Math.random() - 0.5);

  return { correct, emojiSet, options: shuffled };
}

function getDifficulty(round) {
  if (round < 4) return 'easy';
  if (round < 7) return 'medium';
  return 'hard';
}

export default function CountingGame({ onBack }) {
  const { t, lang } = useLanguage();
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [current, setCurrent] = useState(() => generateRound('easy'));
  const [feedback, setFeedback] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [selected, setSelected] = useState(null);
  const spokenRef = useRef(false);

  const TOTAL_ROUNDS = 10;

  useEffect(() => {
    if (!gameOver && !spokenRef.current) {
      spokenRef.current = true;
      speakPrompt(`How many ${current.emojiSet.name}?`, lang).catch(() => {});
    }
  }, [current, gameOver, lang]);

  const handleAnswer = useCallback((num) => {
    if (feedback) return;
    setSelected(num);

    if (num === current.correct) {
      setFeedback('correct');
      playCorrectSound(current.emojiSet.name, lang);
      setScore(s => s + 1);
    } else {
      setFeedback('wrong');
      playWrongSound(current.emojiSet.name, lang);
    }

    setTimeout(() => {
      const nextRound = round + 1;
      if (nextRound >= TOTAL_ROUNDS) {
        const newScore = num === current.correct ? score + 1 : score;
        if (newScore >= 8) playLevelUpSound(lang);
        setGameOver(true);
      } else {
        const difficulty = getDifficulty(nextRound);
        spokenRef.current = false;
        setCurrent(generateRound(difficulty));
        setRound(nextRound);
      }
      setFeedback(null);
      setSelected(null);
    }, 1200);
  }, [feedback, current, round, score, lang]);

  const restart = () => {
    setRound(0);
    setScore(0);
    spokenRef.current = false;
    setCurrent(generateRound('easy'));
    setFeedback(null);
    setGameOver(false);
    setSelected(null);
  };

  if (gameOver) {
    const emoji = score >= 8 ? '🌟' : score >= 5 ? '👏' : '💪';
    const msg = score >= 8
      ? (t?.excellentWork || 'Excellent work!')
      : score >= 5
        ? (t?.goodJob || 'Good job!')
        : (t?.keepPracticing || 'Keep practicing!');

    return (
      <div className="game-screen">
        <div className="result-screen">
          <div className="result-emoji">{emoji}</div>
          <div className="result-score">{score}/{TOTAL_ROUNDS}</div>
          <div className="result-message">{msg}</div>
          <button className="play-again-btn" onClick={restart}>
            {t?.playAgain || 'Play Again'}
          </button>
          <button className="back-btn" onClick={onBack} style={{ marginTop: 12 }}>
            {t?.back || '← Back'}
          </button>
        </div>
      </div>
    );
  }

  const emojis = Array.from({ length: current.correct }, (_, i) => (
    <span key={i} style={{
      fontSize: current.correct <= 5 ? 48 : current.correct <= 8 ? 36 : 28,
      margin: 4,
      display: 'inline-block',
      animation: 'bounceIn 0.3s ease',
    }}>
      {current.emojiSet.emoji}
    </span>
  ));

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={onBack}>{t?.back || '←'}</button>
        <h2 className="game-title">{t?.counting || 'Counting'}</h2>
        <span style={{ fontSize: 16, fontWeight: 'bold', color: '#555' }}>
          {round + 1}/{TOTAL_ROUNDS} ⭐{score}
        </span>
      </div>

      <div className="display-area" style={{
        minHeight: 180,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
        padding: 16,
      }}>
        {emojis}
      </div>

      <p style={{
        textAlign: 'center',
        fontSize: 22,
        fontWeight: 'bold',
        margin: '12px 0',
        color: '#333',
      }}>
        {t?.howMany || 'How many'} {current.emojiSet.emoji}?
      </p>

      <div className="options-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 16,
        padding: '0 20px',
        maxWidth: 360,
        margin: '0 auto',
      }}>
        {current.options.map((num, i) => (
          <button
            key={num}
            className="option-btn"
            onClick={() => handleAnswer(num)}
            style={{
              fontSize: 40,
              fontWeight: 'bold',
              padding: '20px 0',
              borderRadius: 20,
              border: 'none',
              color: '#fff',
              backgroundColor:
                selected === num
                  ? (feedback === 'correct' ? '#2ECC71' : '#E74C3C')
                  : BUTTON_COLORS[num - 1],
              cursor: 'pointer',
              transform: selected === num && feedback === 'wrong' ? 'translateX(5px)' : 'none',
              transition: 'all 0.2s',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              minHeight: 70,
            }}
          >
            {num}
          </button>
        ))}
      </div>

      {feedback && (
        <div className="feedback" style={{
          textAlign: 'center',
          fontSize: 36,
          marginTop: 16,
        }}>
          {feedback === 'correct' ? '✅' : '❌'}
        </div>
      )}
    </div>
  );
}

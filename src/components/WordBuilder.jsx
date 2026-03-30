import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../LanguageContext';
import { playCorrectSound, playWrongSound, playLevelUpSound, speakName } from '../sounds';

const WORDS = [
  { word: 'CAT', emoji: '🐱' },
  { word: 'DOG', emoji: '🐶' },
  { word: 'SUN', emoji: '☀️' },
  { word: 'HAT', emoji: '🎩' },
  { word: 'CUP', emoji: '☕' },
  { word: 'BUS', emoji: '🚌' },
  { word: 'PIG', emoji: '🐷' },
  { word: 'COW', emoji: '🐄' },
  { word: 'BED', emoji: '🛏️' },
  { word: 'KEY', emoji: '🔑' },
];

const TILE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD',
  '#01A3A4', '#F368E0',
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function WordBuilder({ onBack }) {
  const { t, lang } = useLanguage();
  const [wordIndex, setWordIndex] = useState(0);
  const [placed, setPlaced] = useState([]);
  const [tiles, setTiles] = useState([]);
  const [shakeTile, setShakeTile] = useState(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [order, setOrder] = useState(() => shuffleArray([...Array(10).keys()]));

  const currentWord = WORDS[order[wordIndex]];

  useEffect(() => {
    if (!gameOver && currentWord) {
      const letters = currentWord.word.split('').map((ch, i) => ({
        letter: ch,
        id: i,
        used: false,
      }));
      setTiles(shuffleArray(letters));
      setPlaced([]);
      setCompleted(false);
      speakName(currentWord.word, lang).catch(() => {});
    }
  }, [wordIndex, gameOver, lang, order]);

  const handleTileTap = useCallback((tile) => {
    if (completed || tile.used) return;

    const nextIndex = placed.length;
    const expectedLetter = currentWord.word[nextIndex];

    if (tile.letter === expectedLetter) {
      const newPlaced = [...placed, tile];
      setPlaced(newPlaced);
      setTiles(prev => prev.map(t =>
        t.id === tile.id ? { ...t, used: true } : t
      ));

      if (newPlaced.length === currentWord.word.length) {
        setCompleted(true);
        playCorrectSound(currentWord.word, lang);
        speakName(currentWord.word, lang).catch(() => {});
        setScore(s => s + 1);

        setTimeout(() => {
          if (wordIndex + 1 >= 10) {
            playLevelUpSound(lang);
            setGameOver(true);
          } else {
            setWordIndex(i => i + 1);
          }
        }, 1500);
      } else {
        // Small positive feedback
      }
    } else {
      playWrongSound(tile.letter, lang);
      setShakeTile(tile.id);
      setTimeout(() => setShakeTile(null), 500);
    }
  }, [placed, completed, currentWord, wordIndex, lang, score]);

  const restart = () => {
    setWordIndex(0);
    setScore(0);
    setGameOver(false);
    setCompleted(false);
    setOrder(shuffleArray([...Array(10).keys()]));
  };

  if (gameOver) {
    const emoji = score >= 8 ? '🏆' : score >= 5 ? '⭐' : '💪';
    const msg = score >= 8
      ? (t?.amazingSpeller || 'Amazing speller!')
      : score >= 5
        ? (t?.goodJob || 'Good job!')
        : (t?.keepPracticing || 'Keep practicing!');

    return (
      <div className="game-screen">
        <div className="result-screen">
          <div className="result-emoji">{emoji}</div>
          <div className="result-score">{score}/10</div>
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

  if (!currentWord) return null;

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={onBack}>{t?.back || '←'}</button>
        <h2 className="game-title">{t?.wordBuilder || 'Word Builder'}</h2>
        <span style={{ fontSize: 16, fontWeight: 'bold', color: '#555' }}>
          {wordIndex + 1}/10 ⭐{score}
        </span>
      </div>

      {/* Emoji display */}
      <div style={{
        textAlign: 'center', fontSize: 80, margin: '16px 0 8px',
        filter: completed ? 'none' : 'none',
      }}>
        {currentWord.emoji}
      </div>

      <p style={{
        textAlign: 'center', fontSize: 18, color: '#888', margin: '0 0 16px',
      }}>
        {t?.spellTheWord || 'Spell the word!'}
      </p>

      {/* Answer slots */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 8,
        marginBottom: 24,
      }}>
        {currentWord.word.split('').map((ch, i) => {
          const filled = placed[i];
          return (
            <div key={i} style={{
              width: 64, height: 72, borderRadius: 12,
              border: `3px ${filled ? 'solid #2ECC71' : 'dashed #BBB'}`,
              backgroundColor: filled ? '#E8F8F5' : '#FAFAFA',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              fontSize: 36, fontWeight: 'bold',
              color: filled ? '#2ECC71' : '#DDD',
              transition: 'all 0.3s',
              transform: filled ? 'scale(1.05)' : 'none',
            }}>
              {filled ? filled.letter : '_'}
            </div>
          );
        })}
      </div>

      {/* Scrambled letter tiles */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 10,
        flexWrap: 'wrap', padding: '0 16px',
      }}>
        {tiles.map((tile, i) => (
          <button
            key={tile.id}
            onClick={() => handleTileTap(tile)}
            disabled={tile.used}
            style={{
              width: 68, height: 72, borderRadius: 14,
              border: 'none', cursor: tile.used ? 'default' : 'pointer',
              backgroundColor: tile.used
                ? '#EEE'
                : TILE_COLORS[tile.id % TILE_COLORS.length],
              color: tile.used ? '#CCC' : '#FFF',
              fontSize: 34, fontWeight: 'bold',
              boxShadow: tile.used
                ? 'none'
                : '0 4px 10px rgba(0,0,0,0.2)',
              transition: 'all 0.2s',
              transform: shakeTile === tile.id
                ? 'translateX(8px)'
                : tile.used
                  ? 'scale(0.9)'
                  : 'none',
              animation: shakeTile === tile.id
                ? 'shake 0.5s ease'
                : 'none',
              opacity: tile.used ? 0.4 : 1,
            }}
          >
            {tile.letter}
          </button>
        ))}
      </div>

      {completed && (
        <div style={{
          textAlign: 'center', marginTop: 20,
          fontSize: 28, fontWeight: 'bold', color: '#2ECC71',
        }}>
          ✅ {currentWord.word}!
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          50% { transform: translateX(8px); }
          75% { transform: translateX(-4px); }
        }
      `}</style>
    </div>
  );
}

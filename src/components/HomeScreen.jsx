import { useState, useEffect } from 'react'
import { useLanguage } from '../LanguageContext'

const CARD_STYLES = {
  colors: { border: '#ff9a9e', bg: 'linear-gradient(135deg, #fff5f5, #ffe0e0)' },
  shapes: { border: '#a18cd1', bg: 'linear-gradient(135deg, #f5f0ff, #e8dff5)' },
  animals: { border: '#FFB347', bg: 'linear-gradient(135deg, #fff8f0, #ffe8cc)' },
  fruits: { border: '#FF6B6B', bg: 'linear-gradient(135deg, #fff5f5, #ffe0e0)' },
  alphabet: { border: '#4FC3F7', bg: 'linear-gradient(135deg, #f0f9ff, #d6eeff)' },
  vegetables: { border: '#66BB6A', bg: 'linear-gradient(135deg, #f0fff4, #d4f5e0)' },
  kitchen: { border: '#FF8A65', bg: 'linear-gradient(135deg, #fff3e0, #ffe0b2)' },
  home: { border: '#7986CB', bg: 'linear-gradient(135deg, #f3f0ff, #e0d8ff)' },
  objects: { border: '#4DB6AC', bg: 'linear-gradient(135deg, #e0f7fa, #b2dfdb)' },
  ballooncolors: { border: '#FF6B6B', bg: 'linear-gradient(135deg, #fff5f5, #ffe0e0)' },
  balloonshapes: { border: '#4ECDC4', bg: 'linear-gradient(135deg, #f0fffe, #d0f5f2)' },
  tools: { border: '#90A4AE', bg: 'linear-gradient(135deg, #f5f5f5, #e0e0e0)' },
  counting: { border: '#FF7043', bg: 'linear-gradient(135deg, #fff3e0, #ffe0b2)' },
  music: { border: '#AB47BC', bg: 'linear-gradient(135deg, #f3e5f5, #e1bee7)' },
  tracing: { border: '#42A5F5', bg: 'linear-gradient(135deg, #e3f2fd, #bbdefb)' },
  wordbuilder: { border: '#26A69A', bg: 'linear-gradient(135deg, #e0f2f1, #b2dfdb)' },
  oddoneout: { border: '#EF5350', bg: 'linear-gradient(135deg, #ffebee, #ffcdd2)' },
  math: { border: '#FFA726', bg: 'linear-gradient(135deg, #fff8e1, #ffecb3)' },
  colormixing: { border: '#EC407A', bg: 'linear-gradient(135deg, #fce4ec, #f8bbd0)' },
  matchpairs: { border: '#5C6BC0', bg: 'linear-gradient(135deg, #e8eaf6, #c5cae9)' },
  sudoku: { border: '#84fab0', bg: 'linear-gradient(135deg, #f0fff4, #d4f5e0)' },
}

export default function HomeScreen({ onNavigate }) {
  const { lang, setLang, t } = useLanguage()
  const [scores, setScores] = useState({})

  useEffect(() => {
    const saved = localStorage.getItem('kidslearn-scores')
    if (saved) setScores(JSON.parse(saved))
  }, [])

  const cards = [
    // Existing games
    {
      id: 'colors', emoji: '🎨', title: t.learnColors, age: t.ages24,
      desc: t.colorDesc, cls: 'colors'
    },
    {
      id: 'shapes', emoji: '⭐', title: t.learnShapes, age: t.ages24,
      desc: t.shapeDesc, cls: 'shapes'
    },
    // NEW categories
    {
      id: 'animals', emoji: '🐾', age: t.ages24, cls: 'animals',
      title: t.categoryTitles?.animals || 'Animals',
      desc: t.categoryDescs?.animals || 'Learn animal names and sounds!',
    },
    {
      id: 'fruits', emoji: '🍎', age: t.ages24, cls: 'fruits',
      title: t.categoryTitles?.fruits || 'Fruits',
      desc: t.categoryDescs?.fruits || 'Learn fruit names!',
    },
    {
      id: 'alphabet', emoji: '🔤', age: t.ages24, cls: 'alphabet',
      title: t.categoryTitles?.alphabet || 'Alphabet',
      desc: t.categoryDescs?.alphabet || 'A for Apple, B for Bear...',
    },
    {
      id: 'vegetables', emoji: '🥕', age: t.ages24, cls: 'vegetables',
      title: t.categoryTitles?.vegetables || 'Vegetables',
      desc: t.categoryDescs?.vegetables || 'Learn vegetable names!',
    },
    {
      id: 'kitchen', emoji: '🍳', age: t.ages24, cls: 'kitchen',
      title: t.categoryTitles?.kitchen || 'Kitchen Items',
      desc: t.categoryDescs?.kitchen || 'Learn kitchen item names!',
    },
    {
      id: 'home-items', emoji: '🏠', age: t.ages24, cls: 'home',
      title: t.categoryTitles?.home || 'Home Items',
      desc: t.categoryDescs?.home || 'Learn things found at home!',
    },
    {
      id: 'objects', emoji: '🎒', age: t.ages24, cls: 'objects',
      title: t.categoryTitles?.objects || 'Everyday Objects',
      desc: t.categoryDescs?.objects || 'Learn everyday object names!',
    },
    {
      id: 'tools', emoji: '🔧', age: t.ages24, cls: 'tools',
      title: t.categoryTitles?.tools || 'Tools',
      desc: t.categoryDescs?.tools || 'Learn tool names!',
    },
    // Fun games
    {
      id: 'counting', emoji: '🔢', age: t.ages24, cls: 'counting',
      title: t.countingTitle || 'Counting',
      desc: t.countingDesc || 'Count objects and pick the number!',
    },
    {
      id: 'music', emoji: '🎵', age: t.ages24, cls: 'music',
      title: t.musicTitle || 'Music & Sounds',
      desc: t.musicDesc || 'Play piano, xylophone & drums!',
    },
    {
      id: 'tracing', emoji: '✍️', age: t.ages24, cls: 'tracing',
      title: t.tracingTitle || 'Trace Letters',
      desc: t.tracingDesc || 'Trace ABC with your finger!',
    },
    {
      id: 'word-builder', emoji: '🔤', age: t.ages24, cls: 'wordbuilder',
      title: t.wordBuilderTitle || 'Word Builder',
      desc: t.wordBuilderDesc || 'Spell words by tapping letters!',
    },
    {
      id: 'odd-one-out', emoji: '🎯', age: t.ages24, cls: 'oddoneout',
      title: t.oddOneOutTitle || 'Odd One Out',
      desc: t.oddOneOutDesc || 'Find which one doesn\'t belong!',
    },
    {
      id: 'math', emoji: '🧮', age: t.ages24, cls: 'math',
      title: t.mathTitle || 'Simple Math',
      desc: t.mathDesc || 'Fun addition with pictures!',
    },
    {
      id: 'color-mixing', emoji: '🌈', age: t.ages24, cls: 'colormixing',
      title: t.colorMixingTitle || 'Color Mixing',
      desc: t.colorMixingDesc || 'Mix colors to make new ones!',
    },
    {
      id: 'match-pairs', emoji: '🃏', age: t.ages24, cls: 'matchpairs',
      title: t.matchPairsTitle || 'Match Pairs',
      desc: t.matchPairsDesc || 'Flip cards and find matching pairs!',
    },
    // Sudoku
    {
      id: 'sudoku', emoji: '🧩', title: t.sudoku, age: t.ages612,
      desc: t.sudokuDesc, cls: 'sudoku'
    },
  ]

  return (
    <div className="home-screen">
      <div style={{ fontSize: '4rem', marginTop: '20px' }}>📚</div>
      <h1 className="home-title">KidsLearn Hub 🌟</h1>

      <div className="language-selector">
        <div className="lang-label">{t.chooseLanguage}</div>
        <div className="lang-buttons">
          <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>
            🇬🇧 English
          </button>
          <button className={`lang-btn ${lang === 'ur' ? 'active' : ''}`} onClick={() => setLang('ur')}>
            🇵🇰 اردو
          </button>
          <button className={`lang-btn ${lang === 'hi' ? 'active' : ''}`} onClick={() => setLang('hi')}>
            🇮🇳 हिन्दी
          </button>
        </div>
      </div>

      <p className="home-subtitle">{t.pickGame}</p>
      <div className="game-cards">
        {cards.map(card => {
          const style = CARD_STYLES[card.cls] || {}
          return (
            <div
              key={card.id}
              className="game-card"
              style={{
                borderColor: style.border || 'transparent',
                borderWidth: '3px',
                borderStyle: 'solid',
                background: style.bg || '#fff',
              }}
              onClick={() => onNavigate(card.id)}
            >
              <div className="card-emoji">{card.emoji}</div>
              <div className="card-info">
                <div className="card-title">{card.title}</div>
                <span className="card-age">{card.age}</span>
                <div className="card-desc">{card.desc}</div>
                {scores[card.id] !== undefined && (
                  <div className="best-score">Best: {scores[card.id]}/10 ⭐</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <p style={{ marginTop: '30px', color: '#aaa', fontSize: '0.85rem' }}>
        {t.madeWith}
      </p>
    </div>
  )
}

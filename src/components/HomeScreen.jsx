import { useState, useEffect } from 'react'
import { useLanguage } from '../LanguageContext'

export default function HomeScreen({ onNavigate }) {
  const { lang, setLang, t } = useLanguage()
  const [scores, setScores] = useState({})

  useEffect(() => {
    const saved = localStorage.getItem('kidslearn-scores')
    if (saved) setScores(JSON.parse(saved))
  }, [])

  const cards = [
    {
      id: 'colors',
      emoji: '🎨',
      title: t.learnColors,
      age: t.ages24,
      desc: t.colorDesc,
      cls: 'colors'
    },
    {
      id: 'shapes',
      emoji: '⭐',
      title: t.learnShapes,
      age: t.ages24,
      desc: t.shapeDesc,
      cls: 'shapes'
    },
    {
      id: 'balloon-colors',
      emoji: '🎈',
      title: t.popColors || 'Balloon Pop!',
      age: t.ages24,
      desc: t.popColorsDesc || 'Pop the right color balloons!',
      cls: 'ballooncolors'
    },
    {
      id: 'balloon-shapes',
      emoji: '🫧',
      title: t.popShapes || 'Shape Pop!',
      age: t.ages24,
      desc: t.popShapesDesc || 'Pop the right falling shapes!',
      cls: 'balloonshapes'
    },
    {
      id: 'sudoku',
      emoji: '🧩',
      title: t.sudoku,
      age: t.ages612,
      desc: t.sudokuDesc,
      cls: 'sudoku'
    }
  ]

  return (
    <div className="home-screen">
      <div style={{ fontSize: '4rem', marginTop: '20px' }}>📚</div>
      <h1 className="home-title">KidsLearn Hub 🌟</h1>

      <div className="language-selector">
        <div className="lang-label">{t.chooseLanguage}</div>
        <div className="lang-buttons">
          <button
            className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
            onClick={() => setLang('en')}
          >
            🇬🇧 English
          </button>
          <button
            className={`lang-btn ${lang === 'ur' ? 'active' : ''}`}
            onClick={() => setLang('ur')}
          >
            🇵🇰 اردو
          </button>
          <button
            className={`lang-btn ${lang === 'hi' ? 'active' : ''}`}
            onClick={() => setLang('hi')}
          >
            🇮🇳 हिन्दी
          </button>
        </div>
      </div>

      <p className="home-subtitle">{t.pickGame}</p>
      <div className="game-cards">
        {cards.map(card => (
          <div
            key={card.id}
            className={`game-card ${card.cls}`}
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
        ))}
      </div>
      <p style={{ marginTop: '30px', color: '#aaa', fontSize: '0.85rem' }}>
        {t.madeWith}
      </p>
    </div>
  )
}

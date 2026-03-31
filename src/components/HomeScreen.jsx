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
  feedmonster: { border: '#7C4DFF', bg: 'linear-gradient(135deg, #f3e5f5, #d1c4e9)' },
  matchshadow: { border: '#546E7A', bg: 'linear-gradient(135deg, #eceff1, #cfd8dc)' },
  colorsplash: { border: '#E91E63', bg: 'linear-gradient(135deg, #fce4ec, #f8bbd0)' },
}

const componentStyles = `
  @keyframes hs-float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-12px); }
  }
  @keyframes hs-bounce {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-6px) scale(1.1); }
  }
  @keyframes hs-cardIn {
    from { opacity: 0; transform: translateY(40px) scale(0.92); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes hs-shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes hs-sparkle {
    0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
    50% { opacity: 1; transform: scale(1) rotate(180deg); }
  }
  @keyframes hs-gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes hs-starFloat {
    0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(-10vh) rotate(720deg); opacity: 0; }
  }
  @keyframes hs-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  @keyframes hs-wiggle {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-3deg); }
    75% { transform: rotate(3deg); }
  }
  @keyframes hs-emojiBounce {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    25% { transform: translateY(-4px) rotate(-5deg); }
    75% { transform: translateY(-2px) rotate(5deg); }
  }

  .hs-root {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%);
    background-size: 400% 400%;
    animation: hs-gradientShift 15s ease infinite;
    position: relative;
    overflow-x: hidden;
    padding-bottom: 40px;
  }
  .hs-root::before {
    content: '';
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background:
      radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }

  .hs-star {
    position: fixed;
    color: rgba(255,255,255,0.6);
    pointer-events: none;
    z-index: 0;
    font-size: 14px;
  }

  .hs-glass-container {
    position: relative;
    z-index: 1;
    max-width: 900px;
    margin: 0 auto;
    padding: 20px 16px;
  }

  .hs-header {
    text-align: center;
    padding: 30px 20px 20px;
  }
  .hs-header-icon {
    font-size: 4.5rem;
    animation: hs-float 3s ease-in-out infinite;
    display: inline-block;
    filter: drop-shadow(0 4px 12px rgba(0,0,0,0.15));
  }
  .hs-title {
    font-size: 2.4rem;
    font-weight: 900;
    background: linear-gradient(135deg, #fff, #ffd700, #ff6b9d, #fff);
    background-size: 300% 300%;
    animation: hs-gradientShift 4s ease infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 10px 0 4px;
    text-shadow: none;
    letter-spacing: -0.5px;
    line-height: 1.2;
  }
  .hs-title-star {
    display: inline-block;
    animation: hs-bounce 2s ease-in-out infinite;
    -webkit-text-fill-color: initial;
  }

  .hs-lang-box {
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 24px;
    padding: 16px 20px;
    margin: 16px auto;
    max-width: 440px;
    border: 1px solid rgba(255,255,255,0.25);
    box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  }
  .hs-lang-label {
    color: rgba(255,255,255,0.9);
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 10px;
  }
  .hs-lang-pills {
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
  }
  .hs-lang-pill {
    padding: 8px 20px;
    border-radius: 50px;
    border: 2px solid rgba(255,255,255,0.3);
    background: rgba(255,255,255,0.1);
    color: white;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    outline: none;
  }
  .hs-lang-pill:hover {
    background: rgba(255,255,255,0.25);
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  }
  .hs-lang-pill.active {
    background: white;
    color: #764ba2;
    border-color: white;
    box-shadow: 0 4px 20px rgba(255,255,255,0.4);
    transform: scale(1.05);
  }

  .hs-subtitle {
    color: rgba(255,255,255,0.95);
    font-size: 1.15rem;
    font-weight: 600;
    text-align: center;
    margin: 24px 0 20px;
    text-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .hs-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
    padding: 0 4px;
  }
  @media (min-width: 640px) {
    .hs-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 18px;
    }
  }
  @media (min-width: 900px) {
    .hs-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }
  }

  .hs-card {
    border-radius: 22px;
    padding: 20px 14px 16px;
    cursor: pointer;
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    opacity: 0;
    animation: hs-cardIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6);
  }
  .hs-card::before {
    content: '';
    position: absolute;
    top: 0; left: -100%; right: -100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    transition: left 0.6s;
    pointer-events: none;
  }
  .hs-card:hover::before, .hs-card:active::before {
    left: 100%;
  }
  .hs-card:hover, .hs-card:active {
    transform: translateY(-6px) scale(1.03);
    box-shadow: 0 12px 40px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.6);
  }
  .hs-card:active {
    transform: translateY(-2px) scale(0.98);
  }

  .hs-card-emoji {
    font-size: 2.8rem;
    display: inline-block;
    animation: hs-emojiBounce 3s ease-in-out infinite;
    filter: drop-shadow(0 3px 6px rgba(0,0,0,0.1));
    margin-bottom: 8px;
  }
  .hs-card-title {
    font-size: 1rem;
    font-weight: 800;
    color: #2d3436;
    margin-bottom: 4px;
    line-height: 1.2;
  }
  .hs-card-age {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 50px;
    font-size: 0.65rem;
    font-weight: 700;
    color: white;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .hs-card-desc {
    font-size: 0.75rem;
    color: #636e72;
    line-height: 1.3;
  }
  .hs-card-score {
    margin-top: 6px;
    padding: 3px 10px;
    border-radius: 50px;
    background: rgba(255,215,0,0.2);
    font-size: 0.7rem;
    font-weight: 700;
    color: #f39c12;
    border: 1px solid rgba(255,215,0,0.3);
  }

  .hs-card-glow {
    position: absolute;
    top: -2px; left: -2px; right: -2px; bottom: -2px;
    border-radius: 24px;
    opacity: 0;
    transition: opacity 0.35s;
    pointer-events: none;
    z-index: -1;
  }
  .hs-card:hover .hs-card-glow {
    opacity: 0.5;
  }

  .hs-footer {
    text-align: center;
    margin-top: 36px;
    padding: 16px;
    color: rgba(255,255,255,0.6);
    font-size: 0.8rem;
    font-weight: 500;
  }
`

// Floating stars/particles data (static, no heavy JS)
const STARS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${(i * 37 + 13) % 100}%`,
  size: 10 + (i % 4) * 6,
  duration: 12 + (i % 5) * 4,
  delay: (i % 7) * 2.5,
  char: ['✦', '✧', '⭐', '🌟', '✨', '💫'][i % 6],
}))

export default function HomeScreen({ onNavigate }) {
  const { lang, setLang, t } = useLanguage()
  const [scores, setScores] = useState({})

  useEffect(() => {
    const saved = localStorage.getItem('kidslearn-scores')
    if (saved) setScores(JSON.parse(saved))
  }, [])

  const allCards = {
    'colors': { id: 'colors', emoji: '🎨', title: t.learnColors, age: t.ages24, desc: t.colorDesc, cls: 'colors' },
    'shapes': { id: 'shapes', emoji: '⭐', title: t.learnShapes, age: t.ages24, desc: t.shapeDesc, cls: 'shapes' },
    'animals': { id: 'animals', emoji: '🐾', age: t.ages24, cls: 'animals', title: t.categoryTitles?.animals || 'Animals', desc: t.categoryDescs?.animals || 'Learn animal names and sounds!' },
    'fruits': { id: 'fruits', emoji: '🍎', age: t.ages24, cls: 'fruits', title: t.categoryTitles?.fruits || 'Fruits', desc: t.categoryDescs?.fruits || 'Learn fruit names!' },
    'alphabet': { id: 'alphabet', emoji: '🔤', age: t.ages24, cls: 'alphabet', title: t.categoryTitles?.alphabet || 'Alphabet', desc: t.categoryDescs?.alphabet || 'A for Apple, B for Bear...' },
    'vegetables': { id: 'vegetables', emoji: '🥕', age: t.ages24, cls: 'vegetables', title: t.categoryTitles?.vegetables || 'Vegetables', desc: t.categoryDescs?.vegetables || 'Learn vegetable names!' },
    'kitchen': { id: 'kitchen', emoji: '🍳', age: t.ages24, cls: 'kitchen', title: t.categoryTitles?.kitchen || 'Kitchen Items', desc: t.categoryDescs?.kitchen || 'Learn kitchen item names!' },
    'home-items': { id: 'home-items', emoji: '🏠', age: t.ages24, cls: 'home', title: t.categoryTitles?.home || 'Home Items', desc: t.categoryDescs?.home || 'Learn things found at home!' },
    'objects': { id: 'objects', emoji: '🎒', age: t.ages24, cls: 'objects', title: t.categoryTitles?.objects || 'Everyday Objects', desc: t.categoryDescs?.objects || 'Learn everyday object names!' },
    'tools': { id: 'tools', emoji: '🔧', age: t.ages24, cls: 'tools', title: t.categoryTitles?.tools || 'Tools', desc: t.categoryDescs?.tools || 'Learn tool names!' },
    'counting': { id: 'counting', emoji: '🔢', age: t.ages24, cls: 'counting', title: t.countingTitle || 'Counting', desc: t.countingDesc || 'Count objects and pick the number!' },
    'music': { id: 'music', emoji: '🎵', age: t.ages24, cls: 'music', title: t.musicTitle || 'Music & Sounds', desc: t.musicDesc || 'Play piano, xylophone & drums!' },
    'tracing': { id: 'tracing', emoji: '✍️', age: t.ages24, cls: 'tracing', title: t.tracingTitle || 'Trace Letters', desc: t.tracingDesc || 'Trace ABC with your finger!' },
    'word-builder': { id: 'word-builder', emoji: '🔤', age: t.ages24, cls: 'wordbuilder', title: t.wordBuilderTitle || 'Word Builder', desc: t.wordBuilderDesc || 'Spell words by tapping letters!' },
    'odd-one-out': { id: 'odd-one-out', emoji: '🎯', age: t.ages24, cls: 'oddoneout', title: t.oddOneOutTitle || 'Odd One Out', desc: t.oddOneOutDesc || 'Find which one doesn\'t belong!' },
    'math': { id: 'math', emoji: '🧮', age: t.ages24, cls: 'math', title: t.mathTitle || 'Simple Math', desc: t.mathDesc || 'Fun addition with pictures!' },
    'match-pairs': { id: 'match-pairs', emoji: '🃏', age: t.ages24, cls: 'matchpairs', title: t.matchPairsTitle || 'Match Pairs', desc: t.matchPairsDesc || 'Flip cards and find matching pairs!' },
    'feed-monster': { id: 'feed-monster', emoji: '👾', age: t.ages24, cls: 'feedmonster', title: t.feedMonsterTitle || 'Feed the Monster', desc: t.feedMonsterDesc || 'Feed the hungry monster the right food!' },
    'match-shadow': { id: 'match-shadow', emoji: '🌑', age: t.ages24, cls: 'matchshadow', title: t.matchShadowTitle || 'Match Shadow', desc: t.matchShadowDesc || 'Drag objects to their matching shadow!' },
    'sudoku': { id: 'sudoku', emoji: '🧩', title: t.sudoku, age: t.ages612, desc: t.sudokuDesc, cls: 'sudoku' },
  }

  const groups = [
    { title: 'Colors & Art', emoji: '🎨', cardIds: ['colors'] },
    { title: 'Shapes', emoji: '⭐', cardIds: ['shapes'] },
    { title: 'Animals', emoji: '🐾', cardIds: ['animals'] },
    { title: 'Letters & Words', emoji: '🔤', cardIds: ['alphabet', 'tracing', 'word-builder'] },
    { title: 'Numbers & Logic', emoji: '🔢', cardIds: ['counting', 'math', 'sudoku'] },
    { title: 'Food & Nature', emoji: '🍎', cardIds: ['fruits', 'vegetables'] },
    { title: 'Things Around Us', emoji: '🏠', cardIds: ['kitchen', 'home-items', 'objects', 'tools'] },
    { title: 'Fun Games', emoji: '🎮', cardIds: ['odd-one-out', 'match-pairs', 'feed-monster', 'match-shadow'] },
    { title: 'Music', emoji: '🎵', cardIds: ['music'] },
  ]

  return (
    <>
      <style>{componentStyles}</style>
      <div className="hs-root">
        {/* Floating stars background */}
        {STARS.map(s => (
          <div
            key={s.id}
            className="hs-star"
            style={{
              left: s.left,
              fontSize: `${s.size}px`,
              animation: `hs-starFloat ${s.duration}s linear ${s.delay}s infinite`,
            }}
          >
            {s.char}
          </div>
        ))}

        <div className="hs-glass-container">
          {/* Header */}
          <div className="hs-header">
            <div className="hs-header-icon">📚</div>
            <h1 className="hs-title">
              KidsLearn Hub <span className="hs-title-star">🌟</span>
            </h1>
          </div>

          {/* Language Selector */}
          <div className="hs-lang-box">
            <div className="hs-lang-label">{t.chooseLanguage}</div>
            <div className="hs-lang-pills">
              <button
                className={`hs-lang-pill ${lang === 'en' ? 'active' : ''}`}
                onClick={() => setLang('en')}
              >
                🇬🇧 English
              </button>
              <button
                className={`hs-lang-pill ${lang === 'ur' ? 'active' : ''}`}
                onClick={() => setLang('ur')}
              >
                🇵🇰 اردو
              </button>
              <button
                className={`hs-lang-pill ${lang === 'hi' ? 'active' : ''}`}
                onClick={() => setLang('hi')}
              >
                🇮🇳 हिन्दी
              </button>
            </div>
          </div>

          {/* Subtitle */}
          <p className="hs-subtitle">{t.pickGame}</p>

          {/* Grouped Cards */}
          {groups.map((group, gIdx) => {
            let cardIndex = 0
            for (let g = 0; g < gIdx; g++) cardIndex += groups[g].cardIds.length
            return (
              <div key={group.title} style={{ marginTop: gIdx === 0 ? 0 : '24px' }}>
                {/* Section Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 4px', marginBottom: '10px',
                  borderBottom: '2px solid rgba(255,255,255,0.2)',
                }}>
                  <span style={{ fontSize: '1.5rem' }}>{group.emoji}</span>
                  <span style={{
                    color: 'white', fontSize: '1.15rem', fontWeight: '800',
                    textShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}>{group.title}</span>
                </div>

                {/* Cards Grid */}
                <div className="hs-grid">
                  {group.cardIds.map((cardId, idx) => {
                    const card = allCards[cardId]
                    if (!card) return null
                    const style = CARD_STYLES[card.cls] || {}
                    const borderColor = style.border || '#ddd'
                    const globalIdx = cardIndex + idx
                    return (
                      <div
                        key={card.id}
                        className="hs-card"
                        style={{
                          background: style.bg || '#fff',
                          borderLeft: `4px solid ${borderColor}`,
                          animationDelay: `${globalIdx * 0.06}s`,
                        }}
                        onClick={() => onNavigate(card.id)}
                      >
                        <div
                          className="hs-card-glow"
                          style={{
                            boxShadow: `0 0 30px ${borderColor}, 0 0 60px ${borderColor}40`,
                          }}
                        />
                        <div
                          className="hs-card-emoji"
                          style={{ animationDelay: `${(globalIdx * 0.3) % 3}s` }}
                        >
                          {card.emoji}
                        </div>
                        <div className="hs-card-title">{card.title}</div>
                        <div
                          className="hs-card-age"
                          style={{ background: borderColor }}
                        >
                          {card.age}
                        </div>
                        <div className="hs-card-desc">{card.desc}</div>
                        {scores[card.id] !== undefined && (
                          <div className="hs-card-score">
                            Best: {scores[card.id]}/10 ⭐
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Footer */}
          <div className="hs-footer">{t.madeWith}</div>
        </div>
      </div>
    </>
  )
}

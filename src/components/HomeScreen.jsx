import { useState, useEffect } from 'react'
import { useLanguage } from '../LanguageContext'

const CARD_COLORS = {
  colors:      { accent: '#FF6B8A', bg: 'linear-gradient(145deg, #FF6B8A, #FF8E9E)', icon: '🎨' },
  shapes:      { accent: '#A855F7', bg: 'linear-gradient(145deg, #A855F7, #C084FC)', icon: '⭐' },
  animals:     { accent: '#F59E0B', bg: 'linear-gradient(145deg, #F59E0B, #FBBF24)', icon: '🐾' },
  fruits:      { accent: '#EF4444', bg: 'linear-gradient(145deg, #EF4444, #F87171)', icon: '🍎' },
  alphabet:    { accent: '#3B82F6', bg: 'linear-gradient(145deg, #3B82F6, #60A5FA)', icon: '🔤' },
  vegetables:  { accent: '#22C55E', bg: 'linear-gradient(145deg, #22C55E, #4ADE80)', icon: '🥕' },
  kitchen:     { accent: '#F97316', bg: 'linear-gradient(145deg, #F97316, #FB923C)', icon: '🍳' },
  home:        { accent: '#6366F1', bg: 'linear-gradient(145deg, #6366F1, #818CF8)', icon: '🏠' },
  objects:     { accent: '#14B8A6', bg: 'linear-gradient(145deg, #14B8A6, #2DD4BF)', icon: '🎒' },
  tools:       { accent: '#64748B', bg: 'linear-gradient(145deg, #64748B, #94A3B8)', icon: '🔧' },
  counting:    { accent: '#EC4899', bg: 'linear-gradient(145deg, #EC4899, #F472B6)', icon: '🔢' },
  music:       { accent: '#8B5CF6', bg: 'linear-gradient(145deg, #8B5CF6, #A78BFA)', icon: '🎵' },
  tracing:     { accent: '#0EA5E9', bg: 'linear-gradient(145deg, #0EA5E9, #38BDF8)', icon: '✍️' },
  wordbuilder: { accent: '#059669', bg: 'linear-gradient(145deg, #059669, #34D399)', icon: '📝' },
  oddoneout:   { accent: '#DC2626', bg: 'linear-gradient(145deg, #DC2626, #EF4444)', icon: '🎯' },
  math:        { accent: '#D97706', bg: 'linear-gradient(145deg, #D97706, #F59E0B)', icon: '🧮' },
  matchpairs:  { accent: '#7C3AED', bg: 'linear-gradient(145deg, #7C3AED, #A78BFA)', icon: '🃏' },
  sudoku:      { accent: '#10B981', bg: 'linear-gradient(145deg, #10B981, #34D399)', icon: '🧩' },
  feedmonster: { accent: '#7C3AED', bg: 'linear-gradient(145deg, #7C3AED, #9333EA)', icon: '👾' },
  matchshadow: { accent: '#475569', bg: 'linear-gradient(145deg, #475569, #64748B)', icon: '🌑' },
}

const styles = `
  @keyframes hs-fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes hs-gradBg {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes hs-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
  @keyframes hs-starRise {
    0% { transform: translateY(100vh) scale(0.5); opacity: 0; }
    10% { opacity: 0.7; }
    90% { opacity: 0.7; }
    100% { transform: translateY(-10vh) scale(1); opacity: 0; }
  }

  * { box-sizing: border-box; }

  .hs-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4c1d95 60%, #581c87 100%);
    background-size: 300% 300%;
    animation: hs-gradBg 20s ease infinite;
    position: relative;
    overflow-x: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .hs-particle {
    position: fixed;
    pointer-events: none;
    z-index: 0;
    opacity: 0.5;
  }

  .hs-wrap {
    position: relative;
    z-index: 1;
    max-width: 520px;
    margin: 0 auto;
    padding: 0 12px 32px;
  }

  /* ---- Header ---- */
  .hs-hero {
    text-align: center;
    padding: 20px 0 6px;
  }
  .hs-logo {
    font-size: 2.4rem;
    display: inline-block;
    animation: hs-float 3s ease-in-out infinite;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
  }
  .hs-appname {
    font-size: 1.5rem;
    font-weight: 900;
    color: #fff;
    margin: 4px 0 0;
    letter-spacing: -0.5px;
    text-shadow: 0 2px 12px rgba(139,92,246,0.5);
  }
  .hs-tagline {
    color: rgba(255,255,255,0.7);
    font-size: 0.8rem;
    font-weight: 500;
    margin: 2px 0 0;
  }

  /* ---- Lang selector ---- */
  .hs-langs {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin: 10px 0 14px;
  }
  .hs-lang {
    padding: 5px 14px;
    border-radius: 20px;
    border: 1.5px solid rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.8);
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s;
    outline: none;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  .hs-lang:active { transform: scale(0.95); }
  .hs-lang.on {
    background: rgba(255,255,255,0.95);
    color: #4c1d95;
    border-color: #fff;
    box-shadow: 0 2px 12px rgba(255,255,255,0.3);
    font-weight: 700;
  }

  /* ---- Grid ---- */
  .hs-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  @media (min-width: 520px) {
    .hs-wrap { max-width: 720px; }
    .hs-grid { grid-template-columns: repeat(3, 1fr); gap: 12px; }
  }
  @media (min-width: 860px) {
    .hs-wrap { max-width: 960px; }
    .hs-grid { grid-template-columns: repeat(4, 1fr); gap: 14px; }
  }

  /* ---- Card ---- */
  .hs-card {
    border-radius: 16px;
    padding: 16px 8px 12px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
    overflow: hidden;
    transition: transform 0.25s, box-shadow 0.25s;
    opacity: 0;
    animation: hs-fadeUp 0.5s ease forwards;
    background: rgba(255,255,255,0.06);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.1);
  }
  .hs-card:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 32px rgba(0,0,0,0.25);
    border-color: rgba(255,255,255,0.2);
  }
  .hs-card:active {
    transform: scale(0.97);
  }

  .hs-card-icon-wrap {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
    font-size: 1.6rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    position: relative;
  }
  .hs-card-icon-wrap::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(255,255,255,0.25), transparent);
    pointer-events: none;
  }

  .hs-card-name {
    font-size: 0.82rem;
    font-weight: 700;
    color: #fff;
    line-height: 1.2;
    margin-bottom: 3px;
  }
  .hs-card-tag {
    font-size: 0.6rem;
    font-weight: 600;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .hs-card-desc {
    font-size: 0.68rem;
    color: rgba(255,255,255,0.45);
    line-height: 1.2;
    margin-top: 4px;
  }
  .hs-card-best {
    margin-top: 5px;
    padding: 2px 8px;
    border-radius: 20px;
    background: rgba(250,204,21,0.15);
    border: 1px solid rgba(250,204,21,0.3);
    font-size: 0.62rem;
    font-weight: 700;
    color: #facc15;
  }

  /* shimmer on hover */
  .hs-card::before {
    content: '';
    position: absolute;
    top: 0; left: -120%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
    transition: left 0.5s;
    pointer-events: none;
  }
  .hs-card:hover::before { left: 120%; }

  .hs-footer {
    text-align: center;
    margin-top: 24px;
    color: rgba(255,255,255,0.3);
    font-size: 0.7rem;
    font-weight: 500;
  }
`

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${(i * 31 + 7) % 100}%`,
  size: 8 + (i % 3) * 4,
  dur: 14 + (i % 4) * 5,
  delay: (i % 6) * 3,
  ch: ['✦', '✧', '⭐', '💫', '✨', '·'][i % 6],
}))

export default function HomeScreen({ onNavigate }) {
  const { lang, setLang, t } = useLanguage()
  const [scores, setScores] = useState({})

  useEffect(() => {
    const saved = localStorage.getItem('kidslearn-scores')
    if (saved) setScores(JSON.parse(saved))
  }, [])

  // Sorted by category: Visual Learning → Things & Names → Letters & Numbers → Fun Games
  const cards = [
    // --- Visual Learning (colors, shapes, animals) ---
    { id: 'colors', cls: 'colors', title: t.learnColors, age: t.ages24, desc: t.colorDesc },
    { id: 'shapes', cls: 'shapes', title: t.learnShapes, age: t.ages24, desc: t.shapeDesc },
    { id: 'animals', cls: 'animals', title: t.categoryTitles?.animals || 'Animals', age: t.ages24, desc: t.categoryDescs?.animals || 'Learn animal names & sounds!' },
    { id: 'fruits', cls: 'fruits', title: t.categoryTitles?.fruits || 'Fruits', age: t.ages24, desc: t.categoryDescs?.fruits || 'Learn fruit names!' },
    { id: 'vegetables', cls: 'vegetables', title: t.categoryTitles?.vegetables || 'Vegetables', age: t.ages24, desc: t.categoryDescs?.vegetables || 'Learn vegetable names!' },
    // --- Things & Names (objects around us) ---
    { id: 'kitchen', cls: 'kitchen', title: t.categoryTitles?.kitchen || 'Kitchen Items', age: t.ages24, desc: t.categoryDescs?.kitchen || 'Learn kitchen item names!' },
    { id: 'home-items', cls: 'home', title: t.categoryTitles?.home || 'Home Items', age: t.ages24, desc: t.categoryDescs?.home || 'Learn things found at home!' },
    { id: 'objects', cls: 'objects', title: t.categoryTitles?.objects || 'Everyday Objects', age: t.ages24, desc: t.categoryDescs?.objects || 'Learn everyday object names!' },
    { id: 'tools', cls: 'tools', title: t.categoryTitles?.tools || 'Tools', age: t.ages24, desc: t.categoryDescs?.tools || 'Learn tool names!' },
    // --- Letters & Numbers ---
    { id: 'alphabet', cls: 'alphabet', title: t.categoryTitles?.alphabet || 'Alphabet', age: t.ages24, desc: t.categoryDescs?.alphabet || 'A for Apple, B for Bear...' },
    { id: 'tracing', cls: 'tracing', title: t.tracingTitle || 'Learn Writing', age: t.ages24, desc: t.tracingDesc || 'Trace ABC with your finger!' },
    { id: 'counting', cls: 'counting', title: t.countingTitle || 'Counting', age: t.ages24, desc: t.countingDesc || 'Count objects & pick the number!' },
    { id: 'music', cls: 'music', title: t.musicTitle || 'Music & Sounds', age: t.ages24, desc: t.musicDesc || 'Play piano, xylophone & drums!' },
    // --- Fun & Brain Games ---
    { id: 'odd-one-out', cls: 'oddoneout', title: t.oddOneOutTitle || 'Odd One Out', age: t.ages24, desc: t.oddOneOutDesc || "Find which one doesn't belong!" },
    { id: 'match-pairs', cls: 'matchpairs', title: t.matchPairsTitle || 'Match Pairs', age: t.ages24, desc: t.matchPairsDesc || 'Flip cards & find matching pairs!' },
    // Feed the Monster is now Hard mode inside Fruits/Vegetables/Kitchen
    // Match Shadow is now Hard mode inside Objects/Home/Tools
    // --- Older Kids (6+) ---
    { id: 'word-builder', cls: 'wordbuilder', title: t.wordBuilderTitle || 'Word Builder', age: t.ages68 || 'AGE 6-8', desc: t.wordBuilderDesc || 'Spell words by tapping letters!' },
    { id: 'math', cls: 'math', title: t.mathTitle || 'Simple Math', age: t.ages68 || 'AGE 6-8', desc: t.mathDesc || 'Fun addition with pictures!' },
    { id: 'sudoku', cls: 'sudoku', title: t.sudoku, age: t.ages612, desc: t.sudokuDesc },
  ]

  return (
    <>
      <style>{styles}</style>
      <div className="hs-page">
        {PARTICLES.map(p => (
          <div
            key={p.id}
            className="hs-particle"
            style={{
              left: p.left,
              fontSize: `${p.size}px`,
              color: 'rgba(255,255,255,0.4)',
              animation: `hs-starRise ${p.dur}s linear ${p.delay}s infinite`,
            }}
          >{p.ch}</div>
        ))}

        <div className="hs-wrap">
          {/* Compact header */}
          <div className="hs-hero">
            <div className="hs-logo">📚</div>
            <h1 className="hs-appname">KidsLearn Hub</h1>
            <p className="hs-tagline">{t.pickGame}</p>
          </div>

          {/* Language pills */}
          <div className="hs-langs">
            {[
              { code: 'en', label: '🇬🇧 English' },
              { code: 'ur', label: '🇵🇰 اردو' },
              { code: 'hi', label: '🇮🇳 हिन्दी' },
            ].map(l => (
              <button
                key={l.code}
                className={`hs-lang ${lang === l.code ? 'on' : ''}`}
                onClick={() => setLang(l.code)}
              >{l.label}</button>
            ))}
          </div>

          {/* Flat game grid — 20 cards, no gaps */}
          <div className="hs-grid">
            {cards.map((card, i) => {
              const c = CARD_COLORS[card.cls] || { accent: '#888', bg: 'linear-gradient(145deg,#888,#aaa)', icon: '📦' }
              return (
                <div
                  key={card.id}
                  className="hs-card"
                  role="button"
                  tabIndex={0}
                  style={{ animationDelay: `${i * 0.04}s` }}
                  onClick={() => onNavigate(card.id)}
                  onKeyDown={(e) => e.key === 'Enter' && onNavigate(card.id)}
                >
                  <div
                    className="hs-card-icon-wrap"
                    style={{ background: c.bg }}
                  >
                    {c.icon}
                  </div>
                  <div className="hs-card-name">{card.title}</div>
                  <div className="hs-card-tag">{card.age}</div>
                  <div className="hs-card-desc">{card.desc}</div>
                  {scores[card.id] !== undefined && (
                    <div className="hs-card-best">Best: {scores[card.id]}/10 ⭐</div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="hs-footer">{t.madeWith}</div>
        </div>
      </div>
    </>
  )
}

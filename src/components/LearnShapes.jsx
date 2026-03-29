import { useState, useEffect, useCallback, useRef } from 'react'
import { useLanguage } from '../LanguageContext'
import { playCorrectSound, playWrongSound, playLevelUpSound } from '../sounds'

const SHAPES = [
  { name: 'Circle', render: (color, size) => <svg viewBox="0 0 100 100" width={size} height={size}><circle cx="50" cy="50" r="45" fill={color} /></svg> },
  { name: 'Square', render: (color, size) => <svg viewBox="0 0 100 100" width={size} height={size}><rect x="10" y="10" width="80" height="80" fill={color} /></svg> },
  { name: 'Triangle', render: (color, size) => <svg viewBox="0 0 100 100" width={size} height={size}><polygon points="50,5 95,95 5,95" fill={color} /></svg> },
  { name: 'Rectangle', render: (color, size) => <svg viewBox="0 0 120 80" width={size} height={size * 0.67}><rect x="5" y="5" width="110" height="70" fill={color} /></svg> },
  { name: 'Star', render: (color, size) => <svg viewBox="0 0 100 100" width={size} height={size}><polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill={color} /></svg> },
  { name: 'Heart', render: (color, size) => <svg viewBox="0 0 100 100" width={size} height={size}><path d="M50,88 C25,65 5,50 5,30 C5,15 15,5 30,5 C40,5 48,12 50,18 C52,12 60,5 70,5 C85,5 95,15 95,30 C95,50 75,65 50,88Z" fill={color} /></svg> },
  { name: 'Diamond', render: (color, size) => <svg viewBox="0 0 100 100" width={size} height={size}><polygon points="50,5 95,50 50,95 5,50" fill={color} /></svg> },
  { name: 'Oval', render: (color, size) => <svg viewBox="0 0 120 80" width={size} height={size * 0.67}><ellipse cx="60" cy="40" rx="55" ry="35" fill={color} /></svg> },
]

const SHAPE_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFD700', '#DDA0DD', '#FF8C00', '#87CEEB', '#FF4444', '#9944CC', '#FF69B4', '#44BB44']
const ROUNDS_PER_LEVEL = 10

const DIFFICULTIES = [
  { key: 'easy', options: 2, label: '🟢' },   // same color hint
  { key: 'medium', options: 4, label: '🟡' },  // different colors
  { key: 'hard', options: 6, label: '🔴' },    // different colors + timer
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getOptions(correct, all, count = 4) {
  const others = all.filter(s => s.name !== correct.name)
  const picks = shuffle(others).slice(0, count - 1)
  return shuffle([correct, ...picks])
}

function createShapeQueue() {
  return shuffle([...SHAPES])
}

function getRandomColor(exclude) {
  const available = SHAPE_COLORS.filter(c => c !== exclude)
  return available[Math.floor(Math.random() * available.length)]
}

export default function LearnShapes({ onBack }) {
  const { t, lang } = useLanguage()
  const [diffLevel, setDiffLevel] = useState(0)
  const [round, setRound] = useState(1)
  const [totalRounds, setTotalRounds] = useState(0)
  const [score, setScore] = useState(0)
  const [currentShape, setCurrentShape] = useState(null)
  const [shapeColor, setShapeColor] = useState(SHAPE_COLORS[0])
  const [optionColors, setOptionColors] = useState({})
  const [options, setOptions] = useState([])
  const [feedback, setFeedback] = useState('')
  const [selected, setSelected] = useState(null)
  const [gameOver, setGameOver] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [levelUp, setLevelUp] = useState(false)
  const [timer, setTimer] = useState(0)
  const timerRef = useRef(null)
  const shapeQueue = useRef([])

  const diff = DIFFICULTIES[diffLevel]

  const getNextShape = useCallback(() => {
    if (shapeQueue.current.length === 0) {
      shapeQueue.current = createShapeQueue()
    }
    return shapeQueue.current.pop()
  }, [])

  const newRound = useCallback(() => {
    const shape = getNextShape()
    const mainColor = SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)]
    const opts = getOptions(shape, SHAPES, DIFFICULTIES[diffLevel].options)

    setCurrentShape(shape)
    setShapeColor(mainColor)

    // Assign colors to option shapes
    const colors = {}
    if (diffLevel === 0) {
      // EASY: correct option gets SAME color as displayed shape, others get different colors
      opts.forEach(opt => {
        if (opt.name === shape.name) {
          colors[opt.name] = mainColor
        } else {
          colors[opt.name] = getRandomColor(mainColor)
        }
      })
    } else {
      // MEDIUM & HARD: all options get DIFFERENT random colors (no color hint)
      const shuffledColors = shuffle([...SHAPE_COLORS])
      opts.forEach((opt, i) => {
        colors[opt.name] = shuffledColors[i % shuffledColors.length]
      })
    }

    setOptionColors(colors)
    setOptions(opts)
    setFeedback('')
    setSelected(null)
    setDisabled(false)

    // Timer for hard mode
    if (diffLevel === 2) {
      setTimer(10)
    } else {
      setTimer(0)
    }
  }, [getNextShape, diffLevel])

  useEffect(() => { newRound() }, [newRound])

  // Timer countdown for hard mode
  useEffect(() => {
    if (timer > 0 && !disabled && !gameOver && !levelUp) {
      timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000)
      return () => clearTimeout(timerRef.current)
    }
    if (timer === 0 && diffLevel === 2 && !disabled && !gameOver && !levelUp && currentShape) {
      setDisabled(true)
      setFeedback(t.shapesTryAgain(t.shapes[currentShape.name]))
      setTimeout(() => {
        if (round >= ROUNDS_PER_LEVEL) {
          handleLevelComplete()
        } else {
          setRound(r => r + 1)
          setTotalRounds(tr => tr + 1)
          newRound()
        }
      }, 1200)
    }
  }, [timer, disabled, gameOver, levelUp])

  const handleLevelComplete = () => {
    if (diffLevel < DIFFICULTIES.length - 1) {
      setLevelUp(true)
    } else {
      setGameOver(true)
    }
  }

  const handleAnswer = (opt) => {
    if (disabled) return
    setDisabled(true)
    setSelected(opt.name)
    clearTimeout(timerRef.current)

    if (opt.name === currentShape.name) {
      setScore(s => s + 1)
      setFeedback(t.shapesCorrect)
      playCorrectSound(t.shapes[currentShape.name], lang)
    } else {
      setFeedback(t.shapesTryAgain(t.shapes[currentShape.name]))
      playWrongSound(t.shapes[currentShape.name], lang)
    }

    setTimeout(() => {
      if (round >= ROUNDS_PER_LEVEL) {
        handleLevelComplete()
      } else {
        setRound(r => r + 1)
        setTotalRounds(tr => tr + 1)
        newRound()
      }
    }, 1200)
  }

  const goNextLevel = () => {
    playLevelUpSound(lang)
    setDiffLevel(d => d + 1)
    setRound(1)
    setLevelUp(false)
    shapeQueue.current = createShapeQueue()
  }

  const resetDifficulty = () => {
    setDiffLevel(0)
    setRound(1)
    setTotalRounds(0)
    setScore(0)
    setLevelUp(false)
    setGameOver(false)
    shapeQueue.current = createShapeQueue()
    newRound()
  }

  const setManualDifficulty = (level) => {
    setDiffLevel(level)
    setRound(1)
    setTotalRounds(0)
    setScore(0)
    setLevelUp(false)
    setGameOver(false)
    shapeQueue.current = createShapeQueue()
  }

  const playAgain = () => {
    const saved = JSON.parse(localStorage.getItem('kidslearn-scores') || '{}')
    if (!saved.shapes || score > saved.shapes) {
      saved.shapes = score
      localStorage.setItem('kidslearn-scores', JSON.stringify(saved))
    }
    resetDifficulty()
  }

  useEffect(() => {
    if (gameOver) {
      const saved = JSON.parse(localStorage.getItem('kidslearn-scores') || '{}')
      if (!saved.shapes || score > saved.shapes) {
        saved.shapes = score
        localStorage.setItem('kidslearn-scores', JSON.stringify(saved))
      }
    }
  }, [gameOver, score])

  // Level up screen
  if (levelUp) {
    const nextDiff = DIFFICULTIES[diffLevel + 1]
    return (
      <div className="game-screen">
        <div className="result-screen">
          <div className="result-emoji">🎉🌟</div>
          <div className="result-score">{score} / {totalRounds + ROUNDS_PER_LEVEL}</div>
          <div className="result-message" style={{ fontSize: '1.1rem', marginBottom: '8px' }}>
            {t.levelComplete || '🎉 Level Complete!'}
          </div>
          <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: '10px' }}>
            {diffLevel === 0 && (t.nextLevelNoColorHint || '⚠️ Next level: colors won\'t match!')}
            {diffLevel === 1 && (t.timerWarning || '⏱️ Next level: timer mode!')}
          </div>
          <button className="play-again-btn" onClick={goNextLevel}>
            {t.nextLevel || 'Next Level'} ➡️
          </button>
          <br /><br />
          <button className="play-again-btn" style={{ background: '#aaa', fontSize: '0.9rem' }} onClick={resetDifficulty}>
            🔄 {t.resetDifficulty || 'Reset to Easy'}
          </button>
        </div>
      </div>
    )
  }

  if (gameOver) {
    const maxScore = totalRounds + ROUNDS_PER_LEVEL
    const emoji = score >= maxScore * 0.8 ? '🏆' : score >= maxScore * 0.5 ? '⭐' : '💪'
    const msg = score >= maxScore * 0.8 ? t.shapeMaster : score >= maxScore * 0.5 ? t.greatEffort : t.goodTry
    return (
      <div className="game-screen">
        <div className="result-screen">
          <div className="result-emoji">{emoji}</div>
          <div className="result-score">{score} / {maxScore}</div>
          <div className="result-message">{msg}</div>
          <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '12px' }}>
            {t.completedAll || 'You completed all levels! 🏆'}
          </div>
          <button className="play-again-btn" onClick={playAgain}>{t.playAgain}</button>
          <br /><br />
          <button className="play-again-btn" style={{ background: '#aaa' }} onClick={onBack}>{t.home}</button>
        </div>
      </div>
    )
  }

  const optionSize = diff.options <= 4 ? 50 : 40

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <span className="game-title">⭐ {t.learnShapes}</span>
        <span className="score-display">⭐ {score}</span>
      </div>

      {/* Difficulty buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', margin: '4px 0 2px' }}>
        {DIFFICULTIES.map((d, i) => (
          <button
            key={d.key}
            onClick={() => setManualDifficulty(i)}
            style={{
              padding: '4px 12px',
              borderRadius: '20px',
              border: i === diffLevel ? '2px solid #333' : '2px solid #ddd',
              background: i === diffLevel ? (i === 0 ? '#4CAF50' : i === 1 ? '#FFC107' : '#f44336') : '#f5f5f5',
              color: i === diffLevel ? '#fff' : '#666',
              fontWeight: i === diffLevel ? '700' : '400',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            {d.label} {t[d.key]}
          </button>
        ))}
      </div>

      <div className="round-info">
        {t.roundXofY(round, ROUNDS_PER_LEVEL)}
        {timer > 0 && (
          <span style={{ marginLeft: '12px', color: timer <= 3 ? '#f44336' : '#666', fontWeight: '700' }}>
            ⏱️ {timer}s
          </span>
        )}
      </div>

      {/* Main shape display */}
      <div className="display-area">
        {currentShape && (
          <div className="shape-display">
            {currentShape.render(shapeColor, 120)}
          </div>
        )}
      </div>

      {/* Options as SHAPES (not just text) */}
      <div className="options-grid" style={{ gridTemplateColumns: diff.options <= 4 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)' }}>
        {options.map(opt => {
          const isSelected = selected === opt.name
          const isCorrect = isSelected && opt.name === currentShape.name
          const isWrong = isSelected && opt.name !== currentShape.name
          const optColor = optionColors[opt.name] || '#999'

          return (
            <button
              key={opt.name}
              className={`option-btn ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                minHeight: diff.options <= 4 ? '90px' : '75px',
                borderRadius: '16px',
                border: isCorrect ? '3px solid #28a745' : isWrong ? '3px solid #ff3333' : '3px solid #e0e0e0',
                background: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
              onClick={() => handleAnswer(opt)}
            >
              <div style={{ marginBottom: '4px' }}>
                {opt.render(optColor, optionSize)}
              </div>
              <span style={{ fontSize: diff.options <= 4 ? '0.85rem' : '0.7rem', fontWeight: '600', color: '#555' }}>
                {t.shapes[opt.name]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Color hint label for easy mode */}
      {diffLevel === 0 && (
        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>
          💡 {t.colorHint || 'Hint: matching color = correct shape!'}
        </div>
      )}

      {feedback && <div className="feedback">{feedback}</div>}
    </div>
  )
}

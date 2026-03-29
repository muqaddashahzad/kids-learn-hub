import { useState, useEffect, useCallback, useRef } from 'react'
import { useLanguage } from '../LanguageContext'
import { playCorrectSound, playWrongSound, playLevelUpSound } from '../sounds'

const COLORS = [
  { name: 'Red', hex: '#FF4444' },
  { name: 'Blue', hex: '#4488FF' },
  { name: 'Green', hex: '#44BB44' },
  { name: 'Yellow', hex: '#FFD700' },
  { name: 'Orange', hex: '#FF8C00' },
  { name: 'Purple', hex: '#9944CC' },
  { name: 'Pink', hex: '#FF69B4' },
  { name: 'Brown', hex: '#8B4513' },
  { name: 'Black', hex: '#222222' },
  { name: 'White', hex: '#FFFFFF' },
]

const COLOR_TEXT = {
  Yellow: '#222222',
  White: '#222222',
}

const ROUNDS_PER_LEVEL = 10

// Difficulty config
const DIFFICULTIES = [
  { key: 'easy', options: 2, timer: 0, label: '🟢' },
  { key: 'medium', options: 4, timer: 0, label: '🟡' },
  { key: 'hard', options: 6, timer: 10, label: '🔴' },
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
  const others = all.filter(c => c.name !== correct.name)
  const picks = shuffle(others).slice(0, count - 1)
  return shuffle([correct, ...picks])
}

// Create a shuffled queue of all colors, no repeats until all used
function createColorQueue() {
  return shuffle([...COLORS])
}

export default function LearnColors({ onBack }) {
  const { t, lang } = useLanguage()
  const [diffLevel, setDiffLevel] = useState(0) // 0=easy, 1=medium, 2=hard
  const [round, setRound] = useState(1)
  const [totalRounds, setTotalRounds] = useState(0) // total across all levels
  const [score, setScore] = useState(0)
  const [currentColor, setCurrentColor] = useState(null)
  const [options, setOptions] = useState([])
  const [feedback, setFeedback] = useState('')
  const [selected, setSelected] = useState(null)
  const [gameOver, setGameOver] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [levelUp, setLevelUp] = useState(false)
  const [timer, setTimer] = useState(0)
  const timerRef = useRef(null)

  // Color queue - ensures no repeats until all colors shown
  const colorQueue = useRef([])

  const getNextColor = useCallback(() => {
    if (colorQueue.current.length === 0) {
      colorQueue.current = createColorQueue()
    }
    return colorQueue.current.pop()
  }, [])

  const diff = DIFFICULTIES[diffLevel]

  const newRound = useCallback(() => {
    const color = getNextColor()
    setCurrentColor(color)
    setOptions(getOptions(color, COLORS, DIFFICULTIES[diffLevel].options))
    setFeedback('')
    setSelected(null)
    setDisabled(false)
    // Start timer for hard mode
    if (DIFFICULTIES[diffLevel].timer > 0) {
      setTimer(DIFFICULTIES[diffLevel].timer)
    } else {
      setTimer(0)
    }
  }, [getNextColor, diffLevel])

  useEffect(() => { newRound() }, [newRound])

  // Timer countdown for hard mode
  useEffect(() => {
    if (timer > 0 && !disabled && !gameOver && !levelUp) {
      timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000)
      return () => clearTimeout(timerRef.current)
    }
    if (timer === 0 && diff.timer > 0 && !disabled && !gameOver && !levelUp && currentColor) {
      // Time's up - auto wrong
      setDisabled(true)
      setFeedback(t.tryAgain(t.colors[currentColor.name]))
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

    if (opt.name === currentColor.name) {
      setScore(s => s + 1)
      setFeedback(t.correct)
      playCorrectSound(t.colors[currentColor.name], lang)
    } else {
      setFeedback(t.tryAgain(t.colors[currentColor.name]))
      playWrongSound(t.colors[currentColor.name], lang)
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
    colorQueue.current = createColorQueue()
  }

  const resetDifficulty = () => {
    setDiffLevel(0)
    setRound(1)
    setTotalRounds(0)
    setScore(0)
    setLevelUp(false)
    setGameOver(false)
    colorQueue.current = createColorQueue()
    newRound()
  }

  const setManualDifficulty = (level) => {
    setDiffLevel(level)
    setRound(1)
    setTotalRounds(0)
    setScore(0)
    setLevelUp(false)
    setGameOver(false)
    colorQueue.current = createColorQueue()
  }

  const playAgain = () => {
    const saved = JSON.parse(localStorage.getItem('kidslearn-scores') || '{}')
    if (!saved.colors || score > saved.colors) {
      saved.colors = score
      localStorage.setItem('kidslearn-scores', JSON.stringify(saved))
    }
    resetDifficulty()
  }

  useEffect(() => {
    if (gameOver) {
      const saved = JSON.parse(localStorage.getItem('kidslearn-scores') || '{}')
      if (!saved.colors || score > saved.colors) {
        saved.colors = score
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
            {t.levelComplete || 'Level Complete!'}
          </div>
          <div style={{ fontSize: '1rem', color: '#666', marginBottom: '16px' }}>
            {t.diffLabel ? t.diffLabel(t[diff.key]) : `✅ ${t[diff.key]}`} → {t.nextLevel || 'Next'}: {nextDiff.label} {t[nextDiff.key]}
          </div>
          {nextDiff.timer > 0 && (
            <div style={{ fontSize: '0.9rem', color: '#e74c3c', marginBottom: '16px' }}>
              ⏱️ {t.timerWarning || `${nextDiff.timer}s per question!`}
            </div>
          )}
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
    const msg = score >= maxScore * 0.8 ? t.colorExpert : score >= maxScore * 0.5 ? t.keepPracticing : t.niceTry
    return (
      <div className="game-screen">
        <div className="result-screen">
          <div className="result-emoji">{emoji}</div>
          <div className="result-score">{score} / {maxScore}</div>
          <div className="result-message">{msg}</div>
          <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '12px' }}>
            {t.completedAll || 'You completed all difficulty levels!'}
          </div>
          <button className="play-again-btn" onClick={playAgain}>{t.playAgain}</button>
          <br /><br />
          <button className="play-again-btn" style={{ background: '#aaa' }} onClick={onBack}>{t.home}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <span className="game-title">🎨 {t.learnColors}</span>
        <span className="score-display">⭐ {score}</span>
      </div>

      {/* Difficulty indicator + controls */}
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

      <div className="display-area">
        {currentColor && (
          <div
            className="color-circle"
            style={{
              backgroundColor: currentColor.hex,
              border: currentColor.name === 'White' ? '3px solid #ddd' : 'none'
            }}
          />
        )}
      </div>

      <div className="options-grid" style={{ gridTemplateColumns: diff.options <= 4 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)' }}>
        {options.map(opt => {
          const bgColor = opt.hex
          const textColor = COLOR_TEXT[opt.name] || '#FFFFFF'
          const isWhite = opt.name === 'White'
          const isSelected = selected === opt.name
          const isCorrect = isSelected && opt.name === currentColor.name
          const isWrong = isSelected && opt.name !== currentColor.name

          return (
            <button
              key={opt.name}
              className={`color-option-btn ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
              style={{
                backgroundColor: bgColor,
                color: textColor,
                border: isWhite ? '3px solid #ccc' : isCorrect ? '3px solid #28a745' : isWrong ? '3px solid #ff3333' : '3px solid transparent',
                minHeight: diff.options <= 4 ? '70px' : '55px',
                borderRadius: '16px',
                fontSize: diff.options <= 4 ? '1.3rem' : '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textShadow: textColor === '#FFFFFF' ? '1px 1px 2px rgba(0,0,0,0.3)' : 'none',
              }}
              onClick={() => handleAnswer(opt)}
            >
              {t.colors[opt.name]}
            </button>
          )
        })}
      </div>

      {feedback && <div className="feedback">{feedback}</div>}
    </div>
  )
}

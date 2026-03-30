import { useState, useEffect, useRef, useCallback } from 'react'
import { useLanguage } from '../LanguageContext'
import { playCorrectSound, playWrongSound, playLevelUpSound, speakPrompt, speakName } from '../sounds'

const EMOJI_SETS = [
  { emoji: '🍎', name: 'apples', color: '#FF4444' },
  { emoji: '🍌', name: 'bananas', color: '#FFD700' },
  { emoji: '🐱', name: 'cats', color: '#FF8C00' },
  { emoji: '🐶', name: 'dogs', color: '#8B4513' },
  { emoji: '⭐', name: 'stars', color: '#FFD700' },
  { emoji: '🌸', name: 'flowers', color: '#FF69B4' },
  { emoji: '🐟', name: 'fish', color: '#4488FF' },
  { emoji: '🦋', name: 'butterflies', color: '#9944CC' },
  { emoji: '🍓', name: 'strawberries', color: '#FF4444' },
  { emoji: '🐥', name: 'chicks', color: '#FFD700' },
  { emoji: '🎈', name: 'balloons', color: '#FF4444' },
  { emoji: '🍪', name: 'cookies', color: '#D2691E' },
  { emoji: '🍊', name: 'oranges', color: '#FF8C00' },
  { emoji: '🐸', name: 'frogs', color: '#44BB44' },
  { emoji: '💜', name: 'hearts', color: '#9944CC' },
]

const OTHER_COLORS = ['#4ECDC4', '#45B7D1', '#96CEB4', '#BB8FCE', '#85C1E9', '#F7DC6F', '#E8A87C', '#98D8C8']

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateRound(maxNum) {
  const correct = Math.floor(Math.random() * maxNum) + 1
  const emojiSet = EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)]

  const options = new Set([correct])
  while (options.size < 4) {
    const opt = Math.floor(Math.random() * maxNum) + 1
    if (opt !== correct) options.add(opt)
  }

  return { correct, emojiSet, options: shuffle(Array.from(options)) }
}

const TOTAL_ROUNDS = 10

export default function CountingGame({ onBack }) {
  const { t, lang } = useLanguage()
  const [difficulty, setDifficulty] = useState(null) // null = selection screen
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [current, setCurrent] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [gameOver, setGameOver] = useState(false)
  const [selected, setSelected] = useState(null)
  const [disabled, setDisabled] = useState(true)
  const [speaking, setSpeaking] = useState(false)

  const startRound = useCallback(async (diff, roundData) => {
    setFeedback(null)
    setSelected(null)
    setDisabled(true)
    setSpeaking(true)

    if (diff === 'easy') {
      // EASY: Tell them the answer! "There are 3 apples. Choose 3!"
      await speakPrompt(`${roundData.correct}`, lang)
      await new Promise(r => setTimeout(r, 200))
      speakName(`${roundData.correct} ${roundData.emojiSet.name}`, lang)
      await new Promise(r => setTimeout(r, 1200))
    } else if (diff === 'medium') {
      // MEDIUM: Just ask the question, no answer
      await speakPrompt(`How many ${roundData.emojiSet.name}?`, lang)
    }
    // HARD: No voice at all

    setSpeaking(false)
    setDisabled(false)
  }, [lang])

  const startGame = useCallback((diff) => {
    setDifficulty(diff)
    setRound(0)
    setScore(0)
    setGameOver(false)
    const maxNum = diff === 'easy' ? 5 : diff === 'medium' ? 8 : 10
    const roundData = generateRound(maxNum)
    setCurrent(roundData)
    startRound(diff, roundData)
  }, [startRound])

  const handleAnswer = useCallback((num) => {
    if (feedback || disabled) return
    setSelected(num)
    setDisabled(true)

    if (num === current.correct) {
      setFeedback('correct')
      playCorrectSound(String(num), lang)
      setScore(s => s + 1)
    } else {
      setFeedback('wrong')
      playWrongSound(String(current.correct), lang)
    }

    setTimeout(() => {
      const nextRound = round + 1
      if (nextRound >= TOTAL_ROUNDS) {
        const finalScore = num === current.correct ? score + 1 : score
        if (finalScore >= 8) playLevelUpSound(lang)
        setGameOver(true)
      } else {
        const maxNum = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 8 : 10
        const roundData = generateRound(maxNum)
        setCurrent(roundData)
        setRound(nextRound)
        startRound(difficulty, roundData)
      }
      setFeedback(null)
      setSelected(null)
    }, 1500)
  }, [feedback, disabled, current, round, score, lang, difficulty, startRound])

  // Difficulty selection screen
  if (difficulty === null) {
    const DIFFS = [
      { key: 'easy', emoji: '🔊', label: t?.easy || 'Easy', desc: t?.countingEasyDesc || 'Voice tells you the answer! Numbers 1-5' },
      { key: 'medium', emoji: '🧩', label: t?.medium || 'Medium', desc: t?.countingMedDesc || 'Count by yourself! Numbers 1-8' },
      { key: 'hard', emoji: '⚡', label: t?.hard || 'Hard', desc: t?.countingHardDesc || 'No help! Numbers 1-10' },
    ]
    return (
      <div className="game-screen">
        <div className="game-header">
          <button className="back-btn" onClick={onBack}>←</button>
          <span className="game-title">🔢 {t?.countingTitle || 'Counting'}</span>
          <span></span>
        </div>
        <div style={{ textAlign: 'center', padding: '16px 12px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🔢</div>
          <div style={{ fontSize: '1rem', color: '#555', marginBottom: '20px' }}>
            {t?.chooseDifficulty || 'Choose difficulty:'}
          </div>
          {DIFFS.map((d, i) => (
            <button key={d.key} onClick={() => startGame(d.key)} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              width: '90%', margin: '10px auto', padding: '16px',
              borderRadius: '16px', border: 'none',
              background: i === 0 ? 'linear-gradient(135deg, #4CAF50, #66BB6A)' :
                         i === 1 ? 'linear-gradient(135deg, #FF9800, #FFB74D)' :
                         'linear-gradient(135deg, #f44336, #EF5350)',
              color: '#fff', fontSize: '1rem', fontWeight: '700',
              cursor: 'pointer', boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
              textAlign: 'left',
            }}>
              <span style={{ fontSize: '2rem' }}>{d.emoji}</span>
              <div>
                <div>{d.label}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: '400', opacity: 0.9 }}>{d.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Game over screen
  if (gameOver) {
    const emoji = score >= 8 ? '🏆' : score >= 5 ? '⭐' : '💪'
    const msg = score >= 8 ? (t?.amazing || 'Amazing!') : score >= 5 ? (t?.keepPracticing || 'Keep practicing!') : (t?.niceTry || 'Nice try!')
    return (
      <div className="game-screen">
        <div className="result-screen">
          <div className="result-emoji">{emoji}</div>
          <div className="result-score">{score}/{TOTAL_ROUNDS}</div>
          <div className="result-message">{msg}</div>
          <button className="play-again-btn" onClick={() => startGame(difficulty)}>
            {t?.playAgain || 'Play Again 🔄'}
          </button>
          <br /><br />
          <button className="play-again-btn" style={{ background: '#aaa' }} onClick={() => setDifficulty(null)}>
            {t?.home || 'Home 🏠'}
          </button>
        </div>
      </div>
    )
  }

  if (!current) return null

  // Object color for matching
  const objColor = current.emojiSet.color

  // Build emoji grid
  const emojiSize = current.correct <= 5 ? 52 : current.correct <= 8 ? 40 : 32
  const emojis = Array.from({ length: current.correct }, (_, i) => (
    <span key={i} style={{
      fontSize: emojiSize,
      margin: 4,
      display: 'inline-block',
      animation: 'bounceIn 0.3s ease',
    }}>
      {current.emojiSet.emoji}
    </span>
  ))

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={() => setDifficulty(null)}>←</button>
        <span className="game-title">🔢 {t?.countingTitle || 'Counting'}</span>
        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#555' }}>
          {round + 1}/{TOTAL_ROUNDS} ⭐{score}
        </span>
      </div>

      {/* Speaking indicator for Easy mode */}
      {speaking && difficulty === 'easy' && (
        <div style={{
          textAlign: 'center', padding: '10px', margin: '6px 12px',
          background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)', borderRadius: '14px',
          fontSize: '1.2rem', fontWeight: '700', color: '#1565C0',
          animation: 'pulse 1s ease-in-out infinite',
        }}>
          🔊 {current.correct} {current.emojiSet.emoji}
        </div>
      )}

      {/* Objects display */}
      <div className="display-area" style={{
        minHeight: 160, display: 'flex', flexWrap: 'wrap',
        justifyContent: 'center', alignItems: 'center', gap: 4, padding: 16,
      }}>
        {emojis}
      </div>

      {/* Question */}
      <p style={{
        textAlign: 'center', fontSize: '1.3rem', fontWeight: '700',
        margin: '12px 0', color: '#333',
      }}>
        {difficulty === 'easy'
          ? `${t?.choosePrompt ? t.choosePrompt(current.correct) : `Choose ${current.correct}!`}`
          : `${t?.howMany || 'How many'} ${current.emojiSet.emoji}?`
        }
      </p>

      {/* Number buttons */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 14, padding: '0 20px', maxWidth: 340, margin: '0 auto',
      }}>
        {current.options.map((num) => {
          const isSelected = selected === num
          const isCorrect = isSelected && feedback === 'correct'
          const isWrong = isSelected && feedback === 'wrong'
          const isAnswer = num === current.correct

          // EASY: correct answer button matches the object color, others get neutral colors
          let bgColor
          if (isCorrect) {
            bgColor = '#2ECC71'
          } else if (isWrong) {
            bgColor = '#E74C3C'
          } else if (difficulty === 'easy' && isAnswer) {
            // Highlight correct answer with object's color on easy mode
            bgColor = objColor
          } else {
            // Pick a different color for wrong options
            const idx = num % OTHER_COLORS.length
            bgColor = OTHER_COLORS[idx]
          }

          return (
            <button key={num}
              onClick={() => handleAnswer(num)}
              disabled={disabled}
              style={{
                fontSize: '2.5rem', fontWeight: '800', padding: '18px 0',
                borderRadius: 20, border: 'none', color: '#fff',
                backgroundColor: bgColor,
                cursor: disabled ? 'default' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: isSelected ? 'none' : '0 4px 12px rgba(0,0,0,0.2)',
                transform: isWrong ? 'translateX(5px)' : isCorrect ? 'scale(1.1)' : 'scale(1)',
                opacity: disabled && !isSelected ? 0.6 : 1,
                minHeight: 75,
                // Easy mode: make correct answer bigger/bolder
                ...(difficulty === 'easy' && isAnswer && !feedback ? {
                  border: '3px solid #fff',
                  boxShadow: `0 0 20px ${objColor}50, 0 4px 12px rgba(0,0,0,0.2)`,
                  transform: 'scale(1.05)',
                } : {}),
              }}
            >
              {num}
            </button>
          )
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{
          textAlign: 'center', fontSize: '2rem', marginTop: 16,
          animation: 'bounceIn 0.3s ease',
        }}>
          {feedback === 'correct' ? '✅ 🎉' : `❌ → ${current.correct}`}
        </div>
      )}

      {/* Difficulty label */}
      <div style={{
        textAlign: 'center', fontSize: '0.75rem', color: '#aaa', marginTop: 12,
      }}>
        {difficulty === 'easy' ? '🟢 Easy' : difficulty === 'medium' ? '🟡 Medium' : '🔴 Hard'}
      </div>
    </div>
  )
}

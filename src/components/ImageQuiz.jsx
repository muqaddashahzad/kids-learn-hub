import { useState, useEffect, useCallback, useRef } from 'react'
import { useLanguage } from '../LanguageContext'
import { playCorrectSound, playWrongSound, playLevelUpSound, speakPrompt, speakName } from '../sounds'
import { CATEGORIES } from '../data/categories'

const ROUNDS_PER_LEVEL = 10

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getOptions(correct, all, count) {
  const others = all.filter(c => c.name !== correct.name)
  const picks = shuffle(others).slice(0, count - 1)
  return shuffle([correct, ...picks])
}

function createQueue(items) { return shuffle([...items]) }

// Get translated name for an item
function getItemName(t, categoryKey, item) {
  if (t.categories && t.categories[categoryKey] && t.categories[categoryKey][item.name]) {
    return t.categories[categoryKey][item.name]
  }
  return item.name
}

// For alphabet, get the display label (e.g., "A for Apple")
function getAlphabetLabel(t, item) {
  const word = item.word || item.name
  const translatedWord = t.categories?.alphabet?.[item.name] || word
  if (item.word) {
    const forWord = t.forWord || 'for'
    return `${item.name} ${forWord} ${translatedWord}`
  }
  return item.name
}

// ============ EASY MODE: Voice says name BEFORE child taps ============
function EasyMode({ categoryKey, onBack, t, lang }) {
  const items = CATEGORIES[categoryKey].items
  const isAlphabet = categoryKey === 'alphabet'
  const isAnimal = categoryKey === 'animals'

  const [round, setRound] = useState(1)
  const [score, setScore] = useState(0)
  const [current, setCurrent] = useState(null)
  const [options, setOptions] = useState([])
  const [feedback, setFeedback] = useState('')
  const [selected, setSelected] = useState(null)
  const [disabled, setDisabled] = useState(true)
  const [speaking, setSpeaking] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const queue = useRef([])

  const getNext = useCallback(() => {
    if (queue.current.length === 0) queue.current = createQueue(items)
    return queue.current.pop()
  }, [items])

  const newRound = useCallback(async () => {
    const item = getNext()
    setCurrent(item)
    setOptions(getOptions(item, items, Math.min(3, items.length)))
    setFeedback(''); setSelected(null); setDisabled(true); setSpeaking(true)

    // Build the speech text
    let speechText
    if (isAlphabet) {
      const word = t.categories?.alphabet?.[item.name] || item.word || item.name
      const forWord = t.forWord || 'for'
      speechText = `${item.name}, ${forWord} ${word}`
    } else {
      speechText = getItemName(t, categoryKey, item)
    }
    
    // For animals, also say the sound after the name
    if (isAnimal && item.sound) {
      await speakPrompt(speechText, lang)
      // Small delay then say the animal sound
      await new Promise(r => setTimeout(r, 300))
      speakName(item.sound, lang)
      await new Promise(r => setTimeout(r, 800))
    } else {
      await speakPrompt(speechText, lang)
    }
    
    setSpeaking(false)
    setDisabled(false)
  }, [getNext, items, t, lang, categoryKey, isAlphabet, isAnimal])

  useEffect(() => { newRound() }, [])

  const handleAnswer = (opt) => {
    if (disabled) return
    setDisabled(true); setSelected(opt.name)
    const name = getItemName(t, categoryKey, current)
    if (opt.name === current.name) {
      setScore(s => s + 1); setFeedback(t.correct)
      playCorrectSound(name, lang)
      if (isAnimal && current.sound) {
        setTimeout(() => speakName(current.sound, lang), 800)
      }
    } else {
      setFeedback(t.tryAgain(name))
      playWrongSound(name, lang)
    }
    setTimeout(() => {
      if (round >= ROUNDS_PER_LEVEL) {
        setGameOver(true); playLevelUpSound(lang)
      } else { setRound(r => r + 1); newRound() }
    }, 1800)
  }

  if (gameOver) {
    const emoji = score >= 8 ? '🏆' : score >= 5 ? '⭐' : '💪'
    return (
      <div className="result-screen">
        <div className="result-emoji">{emoji}</div>
        <div className="result-score">{score} / {ROUNDS_PER_LEVEL}</div>
        <div className="result-message">
          {score >= 8 ? (t.amazing || 'Amazing!') : score >= 5 ? (t.keepPracticing || 'Keep practicing!') : (t.niceTry || 'Nice try!')}
        </div>
        <button className="play-again-btn" onClick={() => {
          setRound(1); setScore(0); setGameOver(false)
          queue.current = createQueue(items)
          newRound()
        }}>{t.playAgain}</button>
        <br /><br />
        <button className="play-again-btn" style={{ background: '#aaa' }} onClick={onBack}>{t.home}</button>
      </div>
    )
  }

  const currentName = current ? getItemName(t, categoryKey, current) : ''
  const promptText = isAlphabet && current
    ? getAlphabetLabel(t, current)
    : currentName

  return (
    <>
      <div className="round-info">{t.roundXofY(round, ROUNDS_PER_LEVEL)}</div>
      <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#4CAF50', fontWeight: '600' }}>⭐ {score}</div>
      
      {speaking && (
        <div style={{
          textAlign: 'center', padding: '8px', margin: '4px 12px',
          background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)', borderRadius: '12px',
          fontSize: '1.1rem', fontWeight: '600', color: '#1565C0',
          animation: 'pulse 1s ease-in-out infinite',
        }}>
          🔊 {t.choosePrompt ? t.choosePrompt(promptText) : `Choose ${promptText}!`}
        </div>
      )}
      
      <div className="display-area">
        {current && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '5rem', lineHeight: 1.2 }}>{current.emoji}</div>
            {isAlphabet && (
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#FF6B6B', marginTop: '8px' }}>
                {current.name}
              </div>
            )}
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#333', marginTop: '8px' }}>
              {isAlphabet ? getAlphabetLabel(t, current) : currentName}
            </div>
            {isAnimal && current.sound && (
              <div style={{ fontSize: '0.9rem', color: '#888', marginTop: '4px', fontStyle: 'italic' }}>
                "{current.sound}"
              </div>
            )}
          </div>
        )}
      </div>

      <div className="options-grid" style={{ gridTemplateColumns: `repeat(${Math.min(3, options.length)}, 1fr)` }}>
        {options.map(opt => {
          const isSelected = selected === opt.name
          const isCorrect = isSelected && opt.name === current.name
          const isWrong = isSelected && opt.name !== current.name
          return (
            <button key={opt.name}
              className={`option-btn ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '10px 6px', minHeight: '90px', borderRadius: '16px',
                border: isCorrect ? '3px solid #28a745' : isWrong ? '3px solid #ff3333' : '3px solid #e0e0e0',
                background: isCorrect ? '#e8f5e9' : isWrong ? '#fbe9e7' : '#fff',
                cursor: disabled ? 'default' : 'pointer', transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                opacity: disabled && !isSelected ? 0.6 : 1,
              }}
              onClick={() => handleAnswer(opt)}
            >
              <span style={{ fontSize: '2.5rem' }}>{opt.emoji}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#555', marginTop: '4px' }}>
                {isAlphabet ? `${opt.name} - ${opt.word || opt.name}` : getItemName(t, categoryKey, opt)}
              </span>
            </button>
          )
        })}
      </div>
      {feedback && <div className="feedback">{feedback}</div>}
    </>
  )
}

// ============ MEDIUM MODE: Voice says name AFTER child taps ============
function MediumMode({ categoryKey, onBack, t, lang }) {
  const items = CATEGORIES[categoryKey].items
  const isAlphabet = categoryKey === 'alphabet'
  const isAnimal = categoryKey === 'animals'

  const [round, setRound] = useState(1)
  const [score, setScore] = useState(0)
  const [current, setCurrent] = useState(null)
  const [options, setOptions] = useState([])
  const [feedback, setFeedback] = useState('')
  const [selected, setSelected] = useState(null)
  const [disabled, setDisabled] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const queue = useRef([])

  const getNext = useCallback(() => {
    if (queue.current.length === 0) queue.current = createQueue(items)
    return queue.current.pop()
  }, [items])

  const newRound = useCallback(() => {
    const item = getNext()
    setCurrent(item)
    // More options in medium = harder
    setOptions(getOptions(item, items, Math.min(4, items.length)))
    setFeedback(''); setSelected(null); setDisabled(false)
  }, [getNext, items])

  useEffect(() => { newRound() }, [])

  const handleAnswer = (opt) => {
    if (disabled) return
    setDisabled(true); setSelected(opt.name)
    const name = getItemName(t, categoryKey, current)
    if (opt.name === current.name) {
      setScore(s => s + 1); setFeedback(t.correct)
      playCorrectSound(name, lang)
      if (isAnimal && current.sound) {
        setTimeout(() => speakName(current.sound, lang), 800)
      }
    } else {
      setFeedback(t.tryAgain(name))
      playWrongSound(name, lang)
    }
    setTimeout(() => {
      if (round >= ROUNDS_PER_LEVEL) {
        setGameOver(true); playLevelUpSound(lang)
      } else { setRound(r => r + 1); newRound() }
    }, 1800)
  }

  if (gameOver) {
    const emoji = score >= 8 ? '🏆' : score >= 5 ? '⭐' : '💪'
    return (
      <div className="result-screen">
        <div className="result-emoji">{emoji}</div>
        <div className="result-score">{score} / {ROUNDS_PER_LEVEL}</div>
        <div className="result-message">
          {score >= 8 ? (t.amazing || 'Amazing!') : score >= 5 ? (t.keepPracticing || 'Keep practicing!') : (t.niceTry || 'Nice try!')}
        </div>
        <button className="play-again-btn" onClick={() => {
          setRound(1); setScore(0); setGameOver(false)
          queue.current = createQueue(items)
          newRound()
        }}>{t.playAgain}</button>
        <br /><br />
        <button className="play-again-btn" style={{ background: '#aaa' }} onClick={onBack}>{t.home}</button>
      </div>
    )
  }

  const currentName = current ? getItemName(t, categoryKey, current) : ''

  return (
    <>
      <div className="round-info">{t.roundXofY(round, ROUNDS_PER_LEVEL)}</div>
      <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#4CAF50', fontWeight: '600' }}>⭐ {score}</div>
      
      {/* Show the emoji but NO name - child must recognize it */}
      <div className="display-area">
        {current && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '5rem', lineHeight: 1.2 }}>{current.emoji}</div>
            {isAlphabet && (
              <div style={{ fontSize: '3rem', fontWeight: '800', color: '#FF6B6B', marginTop: '8px' }}>
                {current.name}
              </div>
            )}
            <div style={{ fontSize: '1rem', color: '#888', marginTop: '8px' }}>
              {isAlphabet ? (t.whatLetterFor || 'What is this letter for?') : (t.whatIsThis || 'What is this?')}
            </div>
          </div>
        )}
      </div>

      <div className="options-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {options.map(opt => {
          const isSelected = selected === opt.name
          const isCorrect = isSelected && opt.name === current.name
          const isWrong = isSelected && opt.name !== current.name
          return (
            <button key={opt.name}
              className={`option-btn ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '10px 6px', minHeight: '80px', borderRadius: '16px',
                border: isCorrect ? '3px solid #28a745' : isWrong ? '3px solid #ff3333' : '3px solid #e0e0e0',
                background: isCorrect ? '#e8f5e9' : isWrong ? '#fbe9e7' : '#fff',
                cursor: disabled ? 'default' : 'pointer', transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                opacity: disabled && !isSelected ? 0.6 : 1,
              }}
              onClick={() => handleAnswer(opt)}
            >
              <span style={{ fontSize: '2rem' }}>{opt.emoji}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#555', marginTop: '4px' }}>
                {getItemName(t, categoryKey, opt)}
              </span>
            </button>
          )
        })}
      </div>
      {feedback && <div className="feedback">{feedback}</div>}
    </>
  )
}

// ============ HARD MODE: Text only, no emoji hints ============
function HardMode({ categoryKey, onBack, t, lang }) {
  const items = CATEGORIES[categoryKey].items
  const isAlphabet = categoryKey === 'alphabet'
  const isAnimal = categoryKey === 'animals'

  const [round, setRound] = useState(1)
  const [score, setScore] = useState(0)
  const [current, setCurrent] = useState(null)
  const [options, setOptions] = useState([])
  const [feedback, setFeedback] = useState('')
  const [selected, setSelected] = useState(null)
  const [disabled, setDisabled] = useState(false)
  const [timer, setTimer] = useState(10)
  const [gameOver, setGameOver] = useState(false)
  const timerRef = useRef(null)
  const queue = useRef([])

  const getNext = useCallback(() => {
    if (queue.current.length === 0) queue.current = createQueue(items)
    return queue.current.pop()
  }, [items])

  const newRound = useCallback(() => {
    const item = getNext()
    setCurrent(item)
    setOptions(getOptions(item, items, Math.min(4, items.length)))
    setFeedback(''); setSelected(null); setDisabled(false); setTimer(10)
  }, [getNext, items])

  useEffect(() => { newRound() }, [])

  // Timer
  useEffect(() => {
    if (disabled || gameOver) return
    if (timer <= 0) {
      setDisabled(true)
      const name = getItemName(t, categoryKey, current)
      setFeedback(t.tryAgain(name))
      playWrongSound(name, lang)
      setTimeout(() => {
        if (round >= ROUNDS_PER_LEVEL) { setGameOver(true); playLevelUpSound(lang) }
        else { setRound(r => r + 1); newRound() }
      }, 1500)
      return
    }
    timerRef.current = setTimeout(() => setTimer(tl => tl - 1), 1000)
    return () => clearTimeout(timerRef.current)
  }, [timer, disabled, gameOver])

  const handleAnswer = (opt) => {
    if (disabled) return
    setDisabled(true); setSelected(opt.name)
    clearTimeout(timerRef.current)
    const name = getItemName(t, categoryKey, current)
    if (opt.name === current.name) {
      const bonus = timer >= 7 ? 3 : timer >= 4 ? 2 : 1
      setScore(s => s + bonus); setFeedback(`${t.correct} +${bonus}`)
      playCorrectSound(name, lang)
    } else {
      setFeedback(t.tryAgain(name))
      playWrongSound(name, lang)
    }
    setTimeout(() => {
      if (round >= ROUNDS_PER_LEVEL) { setGameOver(true); playLevelUpSound(lang) }
      else { setRound(r => r + 1); newRound() }
    }, 1500)
  }

  if (gameOver) {
    const maxScore = ROUNDS_PER_LEVEL * 3
    const pct = score / maxScore
    const emoji = pct >= 0.7 ? '🏆' : pct >= 0.4 ? '⭐' : '💪'
    return (
      <div className="result-screen">
        <div className="result-emoji">{emoji}</div>
        <div className="result-score">{score} {t.score || 'points'}</div>
        <div className="result-message">
          {pct >= 0.7 ? (t.amazing || 'Amazing!') : pct >= 0.4 ? (t.keepPracticing || 'Keep practicing!') : (t.niceTry || 'Nice try!')}
        </div>
        <button className="play-again-btn" onClick={() => {
          setRound(1); setScore(0); setGameOver(false)
          queue.current = createQueue(items)
          newRound()
        }}>{t.playAgain}</button>
        <br /><br />
        <button className="play-again-btn" style={{ background: '#aaa' }} onClick={onBack}>{t.home}</button>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 12px', fontSize: '0.85rem', color: '#555' }}>
        <span>⚡ {t.roundXofY(round, ROUNDS_PER_LEVEL)}</span>
        <span style={{ color: timer <= 3 ? '#f44336' : '#666', fontWeight: '700' }}>⏱️ {timer}s</span>
        <span>⭐ {score}</span>
      </div>
      
      {/* Show ONLY emoji, no text name */}
      <div className="display-area">
        {current && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '5rem', lineHeight: 1.2 }}>{current.emoji}</div>
            {isAlphabet && (
              <div style={{ fontSize: '3rem', fontWeight: '800', color: '#FF6B6B', marginTop: '8px' }}>
                {current.name}
              </div>
            )}
            <div style={{ fontSize: '1rem', color: '#888', marginTop: '8px' }}>
              {t.whatIsThis || 'What is this?'}
            </div>
          </div>
        )}
      </div>

      {/* Options as TEXT only (no emoji) for harder recognition */}
      <div className="options-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {options.map(opt => {
          const isSelected = selected === opt.name
          const isCorrect = isSelected && opt.name === current.name
          const isWrong = isSelected && opt.name !== current.name
          const optName = getItemName(t, categoryKey, opt)
          return (
            <button key={opt.name}
              className={`option-btn ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
              style={{
                padding: '14px 8px', minHeight: '60px', borderRadius: '16px',
                border: isCorrect ? '3px solid #28a745' : isWrong ? '3px solid #ff3333' : '3px solid #e0e0e0',
                background: isCorrect ? '#e8f5e9' : isWrong ? '#fbe9e7' : '#fff',
                cursor: disabled ? 'default' : 'pointer', transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                opacity: disabled && !isSelected ? 0.6 : 1,
                fontSize: '1rem', fontWeight: '700', color: '#333',
              }}
              onClick={() => handleAnswer(opt)}
            >
              {isAlphabet ? `${opt.name} - ${opt.word || opt.name}` : optName}
            </button>
          )
        })}
      </div>
      {feedback && <div className="feedback">{feedback}</div>}
    </>
  )
}


// ============ MAIN COMPONENT ============
export default function ImageQuiz({ categoryKey, onBack }) {
  const { t, lang } = useLanguage()
  const category = CATEGORIES[categoryKey]
  const [diffLevel, setDiffLevel] = useState(null)

  // Get category title
  const catTitle = t.categoryTitles?.[categoryKey] || (categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1))

  const DIFFICULTIES = [
    { key: 'easy', emoji: '🔊', desc: t.easyQuizDesc || 'Voice guides you! Hear the name, then tap it.' },
    { key: 'medium', emoji: '🧩', desc: t.mediumQuizDesc || 'See the picture, pick the right name!' },
    { key: 'hard', emoji: '⚡', desc: t.hardQuizDesc || 'Speed challenge with timer!' },
  ]

  if (diffLevel === null) {
    return (
      <div className="game-screen">
        <div className="game-header">
          <button className="back-btn" onClick={onBack}>←</button>
          <span className="game-title">{category.emoji} {catTitle}</span>
          <span></span>
        </div>
        <div style={{ textAlign: 'center', padding: '16px 12px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>{category.emoji}</div>
          <div style={{ fontSize: '1rem', color: '#555', marginBottom: '20px' }}>
            {t.chooseDifficulty || 'Choose difficulty:'}
          </div>
          {DIFFICULTIES.map((d, i) => (
            <button key={d.key} onClick={() => setDiffLevel(i)} style={{
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
                <div>{t[d.key] || d.key}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: '400', opacity: 0.9 }}>{d.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={() => setDiffLevel(null)}>←</button>
        <span className="game-title">{category.emoji} {catTitle}</span>
        <span></span>
      </div>
      {diffLevel === 0 && <EasyMode categoryKey={categoryKey} onBack={() => setDiffLevel(null)} t={t} lang={lang} />}
      {diffLevel === 1 && <MediumMode categoryKey={categoryKey} onBack={() => setDiffLevel(null)} t={t} lang={lang} />}
      {diffLevel === 2 && <HardMode categoryKey={categoryKey} onBack={() => setDiffLevel(null)} t={t} lang={lang} />}
    </div>
  )
}

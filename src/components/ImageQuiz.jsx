import { useState, useEffect, useCallback, useRef } from 'react'
import { useLanguage } from '../LanguageContext'
import { playCorrectSound, playWrongSound, playLevelUpSound, speakPrompt, speakName } from '../sounds'
import { playAnimalSound } from '../animalSounds'
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
  const translatedWord = t.categories?.alphabet?.[item.name] || item.word || item.name
  const forWord = t.forWord || 'for'
  return `${item.name} ${forWord} ${translatedWord}`
}

// Build speech text for an item
function buildSpeechText(t, categoryKey, item) {
  if (categoryKey === 'alphabet') {
    const word = t.categories?.alphabet?.[item.name] || item.word || item.name
    const forWord = t.forWord || 'for'
    return `${item.name}, ${forWord} ${word}`
  }
  return getItemName(t, categoryKey, item)
}

// Speak the answer name (NO animal sound here - that plays only on tap)
async function speakAnswer(t, categoryKey, item, lang) {
  const speechText = buildSpeechText(t, categoryKey, item)
  await speakPrompt(speechText, lang)
}

// ============ EASY MODE ============
// Voice says name BEFORE tap, shows emoji + name text, 3 options with emoji+text
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
    await speakAnswer(t, categoryKey, item, lang)
    setSpeaking(false)
    setDisabled(false)
  }, [getNext, items, t, lang, categoryKey])

  useEffect(() => { newRound() }, [])

  const handleAnswer = (opt) => {
    if (disabled) return
    setDisabled(true); setSelected(opt.name)
    const name = getItemName(t, categoryKey, current)
    // Play real animal sound when kid taps ANY animal option
    if (isAnimal) playAnimalSound(opt.name)
    if (opt.name === current.name) {
      setScore(s => s + 1); setFeedback(t.correct)
      playCorrectSound(name, lang)
    } else {
      setFeedback(t.tryAgain(name))
      playWrongSound(name, lang)
    }
    setTimeout(() => {
      if (round >= ROUNDS_PER_LEVEL) { setGameOver(true); playLevelUpSound(lang) }
      else { setRound(r => r + 1); newRound() }
    }, 1800)
  }

  if (gameOver) return <ResultScreen score={score} total={ROUNDS_PER_LEVEL} t={t} onReplay={() => { setRound(1); setScore(0); setGameOver(false); queue.current = createQueue(items); newRound() }} onBack={onBack} />

  const currentName = current ? getItemName(t, categoryKey, current) : ''
  const promptText = isAlphabet && current ? getAlphabetLabel(t, current) : currentName

  return (
    <>
      <div className="round-info">{t.roundXofY(round, ROUNDS_PER_LEVEL)}</div>
      <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#4CAF50', fontWeight: '600' }}>⭐ {score}</div>
      
      {speaking && <SpeakingIndicator text={t.choosePrompt ? t.choosePrompt(promptText) : `Choose ${promptText}!`} />}
      
      <div className="display-area">
        {current && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '5rem', lineHeight: 1.2 }}>{current.emoji}</div>
            {isAlphabet && <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#FF6B6B', marginTop: '8px' }}>{current.name}</div>}
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#333', marginTop: '8px' }}>
              {isAlphabet ? getAlphabetLabel(t, current) : currentName}
            </div>
            {isAnimal && (
              <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px' }}>
                🔊 {t.tapToHearSound || 'Tap to hear the sound!'}
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
              style={optionStyle(isCorrect, isWrong, disabled, isSelected)}
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

// ============ MEDIUM MODE ============
// Voice says name BEFORE tap, 4 options with emoji+text
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
    setOptions(getOptions(item, items, Math.min(4, items.length)))
    setFeedback(''); setSelected(null); setDisabled(true); setSpeaking(true)
    await speakAnswer(t, categoryKey, item, lang)
    setSpeaking(false)
    setDisabled(false)
  }, [getNext, items, t, lang, categoryKey])

  useEffect(() => { newRound() }, [])

  const handleAnswer = (opt) => {
    if (disabled) return
    setDisabled(true); setSelected(opt.name)
    const name = getItemName(t, categoryKey, current)
    if (isAnimal) playAnimalSound(opt.name)
    if (opt.name === current.name) {
      setScore(s => s + 1); setFeedback(t.correct)
      playCorrectSound(name, lang)
    } else {
      setFeedback(t.tryAgain(name))
      playWrongSound(name, lang)
    }
    setTimeout(() => {
      if (round >= ROUNDS_PER_LEVEL) { setGameOver(true); playLevelUpSound(lang) }
      else { setRound(r => r + 1); newRound() }
    }, 1800)
  }

  if (gameOver) return <ResultScreen score={score} total={ROUNDS_PER_LEVEL} t={t} onReplay={() => { setRound(1); setScore(0); setGameOver(false); queue.current = createQueue(items); newRound() }} onBack={onBack} />

  const currentName = current ? getItemName(t, categoryKey, current) : ''
  const promptText = isAlphabet && current ? getAlphabetLabel(t, current) : currentName

  return (
    <>
      <div className="round-info">{t.roundXofY(round, ROUNDS_PER_LEVEL)}</div>
      <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#4CAF50', fontWeight: '600' }}>⭐ {score}</div>
      
      {speaking && <SpeakingIndicator text={t.choosePrompt ? t.choosePrompt(promptText) : `Choose ${promptText}!`} />}
      
      <div className="display-area">
        {current && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '5rem', lineHeight: 1.2 }}>{current.emoji}</div>
            {isAlphabet && <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#FF6B6B', marginTop: '8px' }}>{current.name}</div>}
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#333', marginTop: '8px' }}>
              {isAlphabet ? getAlphabetLabel(t, current) : currentName}
            </div>
            {isAnimal && (
              <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px' }}>
                🔊 {t.tapToHearSound || 'Tap to hear the sound!'}
              </div>
            )}
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
              style={optionStyle(isCorrect, isWrong, disabled, isSelected)}
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

// ============ HARD MODE ============
// Voice says name BEFORE tap, shows emoji + name, timer, 4 text-only options (no emoji hints in buttons)
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
  const [disabled, setDisabled] = useState(true)
  const [speaking, setSpeaking] = useState(false)
  const [timer, setTimer] = useState(10)
  const [gameOver, setGameOver] = useState(false)
  const timerRef = useRef(null)
  const queue = useRef([])

  const getNext = useCallback(() => {
    if (queue.current.length === 0) queue.current = createQueue(items)
    return queue.current.pop()
  }, [items])

  const newRound = useCallback(async () => {
    const item = getNext()
    setCurrent(item)
    setOptions(getOptions(item, items, Math.min(4, items.length)))
    setFeedback(''); setSelected(null); setDisabled(true); setSpeaking(true); setTimer(10)
    // Voice says the answer BEFORE child taps — then timer starts
    await speakAnswer(t, categoryKey, item, lang)
    setSpeaking(false)
    setDisabled(false)
  }, [getNext, items, t, lang, categoryKey])

  useEffect(() => { newRound() }, [])

  // Timer only starts when not speaking (disabled=false)
  useEffect(() => {
    if (disabled || gameOver || speaking) return
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
  }, [timer, disabled, gameOver, speaking])

  const handleAnswer = (opt) => {
    if (disabled) return
    setDisabled(true); setSelected(opt.name)
    clearTimeout(timerRef.current)
    const name = getItemName(t, categoryKey, current)
    if (isAnimal) playAnimalSound(opt.name)
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
    return <ResultScreen score={score} total={maxScore} suffix={t.score || 'points'} pct={pct} t={t} onReplay={() => { setRound(1); setScore(0); setGameOver(false); queue.current = createQueue(items); newRound() }} onBack={onBack} />
  }

  const currentName = current ? getItemName(t, categoryKey, current) : ''
  const promptText = isAlphabet && current ? getAlphabetLabel(t, current) : currentName

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 12px', fontSize: '0.85rem', color: '#555' }}>
        <span>⚡ {t.roundXofY(round, ROUNDS_PER_LEVEL)}</span>
        <span style={{ color: timer <= 3 ? '#f44336' : '#666', fontWeight: '700' }}>⏱️ {timer}s</span>
        <span>⭐ {score}</span>
      </div>
      
      {speaking && <SpeakingIndicator text={t.choosePrompt ? t.choosePrompt(promptText) : `Choose ${promptText}!`} />}
      
      {/* Show emoji + name clearly */}
      <div className="display-area">
        {current && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '5rem', lineHeight: 1.2 }}>{current.emoji}</div>
            {isAlphabet && <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#FF6B6B', marginTop: '8px' }}>{current.name}</div>}
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#333', marginTop: '8px' }}>
              {isAlphabet ? getAlphabetLabel(t, current) : currentName}
            </div>
            {isAnimal && (
              <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px' }}>
                🔊 {t.tapToHearSound || 'Tap to hear the sound!'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hard: text-only options (no emoji in buttons) */}
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

// ============ SHARED COMPONENTS ============

function SpeakingIndicator({ text }) {
  return (
    <div style={{
      textAlign: 'center', padding: '10px', margin: '6px 12px',
      background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)', borderRadius: '14px',
      fontSize: '1.1rem', fontWeight: '600', color: '#1565C0',
      animation: 'pulse 1s ease-in-out infinite',
      boxShadow: '0 2px 8px rgba(21,101,192,0.15)',
    }}>
      🔊 {text}
    </div>
  )
}

function optionStyle(isCorrect, isWrong, disabled, isSelected) {
  return {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '10px 6px', minHeight: '90px', borderRadius: '16px',
    border: isCorrect ? '3px solid #28a745' : isWrong ? '3px solid #ff3333' : '3px solid #e0e0e0',
    background: isCorrect ? '#e8f5e9' : isWrong ? '#fbe9e7' : '#fff',
    cursor: disabled ? 'default' : 'pointer', transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    opacity: disabled && !isSelected ? 0.6 : 1,
  }
}

function ResultScreen({ score, total, suffix, pct, t, onReplay, onBack }) {
  const ratio = pct !== undefined ? pct : score / total
  const emoji = ratio >= 0.7 ? '🏆' : ratio >= 0.4 ? '⭐' : '💪'
  const msg = ratio >= 0.7 ? (t.amazing || 'Amazing!') : ratio >= 0.4 ? (t.keepPracticing || 'Keep practicing!') : (t.niceTry || 'Nice try!')
  return (
    <div className="result-screen">
      <div className="result-emoji">{emoji}</div>
      <div className="result-score">{score}{suffix ? ` ${suffix}` : ` / ${total}`}</div>
      <div className="result-message">{msg}</div>
      <button className="play-again-btn" onClick={onReplay}>{t.playAgain}</button>
      <br /><br />
      <button className="play-again-btn" style={{ background: '#aaa' }} onClick={onBack}>{t.home}</button>
    </div>
  )
}

// ============ MAIN COMPONENT ============
export default function ImageQuiz({ categoryKey, onBack }) {
  const { t, lang } = useLanguage()
  const category = CATEGORIES[categoryKey]
  const [diffLevel, setDiffLevel] = useState(null)

  const catTitle = t.categoryTitles?.[categoryKey] || (categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1))

  const DIFFICULTIES = [
    { key: 'easy', emoji: '🔊', desc: t.easyQuizDesc || 'Voice guides you! Hear the name, then tap it.' },
    { key: 'medium', emoji: '🧩', desc: t.mediumQuizDesc || 'More options to choose from!' },
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

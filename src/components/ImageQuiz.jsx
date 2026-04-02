import { useState, useEffect, useCallback, useRef } from 'react'
import { useLanguage } from '../LanguageContext'
import { playCorrectSound, playWrongSound, playLevelUpSound, speakPrompt, speakName } from '../sounds'
import { playAnimalSound, preloadAnimalSounds } from '../animalSounds'
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
    if (isAnimal) {
      playAnimalSound(opt.name)
      if (opt.name !== current.name) {
        setTimeout(() => playAnimalSound(current.name), 1000)
      }
    }
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
            <div style={{ fontSize: '5rem', lineHeight: 1.2, cursor: isAnimal ? 'pointer' : 'default' }} onClick={() => isAnimal && playAnimalSound(current.name)}>{current.emoji}</div>
            {isAlphabet && <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#FF6B6B', marginTop: '8px' }}>{current.name}</div>}
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#333', marginTop: '8px' }}>
              {isAlphabet ? getAlphabetLabel(t, current) : currentName}
            </div>
            {isAnimal && (
              <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px', cursor: 'pointer' }} onClick={() => playAnimalSound(current.name)}>
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

// ============ MEDIUM MODE (Speed Timer Quiz) ============
// Voice says name BEFORE tap, shows emoji + name, timer, 4 text-only options (no emoji hints in buttons)
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
    if (isAnimal) {
      playAnimalSound(opt.name)
      if (opt.name !== current.name) {
        setTimeout(() => playAnimalSound(current.name), 1000)
      }
    }
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
            <div style={{ fontSize: '5rem', lineHeight: 1.2, cursor: isAnimal ? 'pointer' : 'default' }} onClick={() => isAnimal && playAnimalSound(current.name)}>{current.emoji}</div>
            {isAlphabet && <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#FF6B6B', marginTop: '8px' }}>{current.name}</div>}
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#333', marginTop: '8px' }}>
              {isAlphabet ? getAlphabetLabel(t, current) : currentName}
            </div>
            {isAnimal && (
              <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px', cursor: 'pointer' }} onClick={() => playAnimalSound(current.name)}>
                🔊 {t.tapToHearSound || 'Tap to hear the sound!'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Medium: text-only options (no emoji in buttons) */}
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

// ============ FEED MONSTER MODE (Hard for fruits/vegetables/kitchen) ============
function FeedMonsterMode({ categoryKey, onBack, t, lang }) {
  const items = CATEGORIES[categoryKey].items
  const OPTIONS_COUNT = 5

  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [target, setTarget] = useState(null)
  const [options, setOptions] = useState([])
  const [selected, setSelected] = useState(null)
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null)
  const [monsterState, setMonsterState] = useState('idle')
  const [gameOver, setGameOver] = useState(false)
  const [animKey, setAnimKey] = useState(0)
  const queue = useRef([])

  const getNext = useCallback(() => {
    if (queue.current.length === 0) queue.current = createQueue(items)
    return queue.current.pop()
  }, [items])

  const generateRound = useCallback(() => {
    const correctItem = getNext()
    const others = items.filter(c => c.name !== correctItem.name)
    const wrongItems = shuffle(others).slice(0, Math.min(OPTIONS_COUNT - 1, others.length))
    const allOptions = shuffle([correctItem, ...wrongItems])
    setTarget(correctItem)
    setOptions(allOptions)
    setSelected(null)
    setIsCorrectAnswer(null)
    setMonsterState('idle')
    setAnimKey(k => k + 1)

    const itemName = getItemName(t, categoryKey, correctItem)
    setTimeout(() => {
      speakPrompt(itemName, lang)
    }, 400)
  }, [getNext, items, t, lang, categoryKey])

  useEffect(() => {
    if (!gameOver) generateRound()
  }, [round, gameOver, generateRound])

  const handleSelect = (item, index) => {
    if (selected !== null) return
    setSelected(index)
    const targetName = getItemName(t, categoryKey, target)

    if (item.name === target.name) {
      setIsCorrectAnswer(true)
      setMonsterState('eating')
      setScore(s => s + 1)
      playCorrectSound(targetName, lang)

      setTimeout(() => {
        if (round + 1 >= ROUNDS_PER_LEVEL) {
          setGameOver(true)
          playLevelUpSound(lang)
        } else {
          setRound(r => r + 1)
        }
      }, 1500)
    } else {
      setIsCorrectAnswer(false)
      setMonsterState('sad')
      playWrongSound(targetName, lang)

      setTimeout(() => {
        if (round + 1 >= ROUNDS_PER_LEVEL) {
          setGameOver(true)
          playLevelUpSound(lang)
        } else {
          setRound(r => r + 1)
        }
      }, 1800)
    }
  }

  const monsterEmoji = monsterState === 'eating' ? '😋' : monsterState === 'sad' ? '😢' : '👾'
  const monsterAnimation =
    monsterState === 'eating'
      ? 'monster-eat 0.5s ease 3'
      : monsterState === 'sad'
      ? 'monster-shake 0.4s ease 2'
      : 'monster-bounce 2s ease-in-out infinite'

  if (gameOver) {
    return <ResultScreen score={score} total={ROUNDS_PER_LEVEL} t={t} onReplay={() => { setRound(0); setScore(0); setGameOver(false); queue.current = createQueue(items) }} onBack={onBack} />
  }

  const targetName = target ? getItemName(t, categoryKey, target) : '...'

  return (
    <>
      <style>{feedMonsterKeyframes}</style>
      <div className="round-info">{t.roundXofY(round + 1, ROUNDS_PER_LEVEL)}</div>
      <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#4CAF50', fontWeight: '600' }}>⭐ {score}</div>

      {/* Monster Area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '12px', marginTop: '8px' }}>
        <div
          key={animKey + monsterState}
          style={{
            fontSize: '5rem',
            animation: monsterAnimation,
            transition: 'transform 0.3s',
            filter: monsterState === 'eating' ? 'drop-shadow(0 0 20px #4CAF50)' : 'none',
          }}
        >
          {monsterEmoji}
        </div>

        {/* Speech bubble */}
        <div style={{
          background: '#fff', borderRadius: '20px', padding: '10px 20px', marginTop: '8px',
          boxShadow: '0 3px 12px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '300px',
        }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
            {t.feedMe || 'Feed me the'}{' '}
            <span style={{ color: '#E91E63', fontSize: '1.3rem' }}>{targetName}</span>!
          </span>
        </div>
      </div>

      {/* Food Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${Math.min(options.length, 3)}, 1fr)`,
        gap: '10px', maxWidth: '380px', width: '100%', padding: '0 8px', margin: '0 auto',
      }}>
        {options.map((item, i) => {
          let bg = '#fff'
          let border = '3px solid #ddd'
          let itemAnim = ''

          if (selected === i) {
            if (isCorrectAnswer) {
              bg = '#C8E6C9'; border = '3px solid #4CAF50'; itemAnim = 'fm-pop 0.4s ease'
            } else {
              bg = '#FFCDD2'; border = '3px solid #F44336'; itemAnim = 'fm-shake 0.4s ease'
            }
          } else if (selected !== null && item.name === target.name) {
            bg = '#C8E6C9'; border = '3px solid #4CAF50'
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(item, i)}
              disabled={selected !== null}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                borderRadius: '20px', padding: '12px 8px', minHeight: '80px',
                background: bg, border, animation: itemAnim,
                opacity: selected !== null && selected !== i && item.name !== target.name ? 0.5 : 1,
                cursor: selected !== null ? 'default' : 'pointer',
                boxShadow: '0 3px 10px rgba(0,0,0,0.1)', transition: 'all 0.2s ease',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ fontSize: '2.5rem' }}>{item.emoji}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#555', marginTop: '4px' }}>
                {getItemName(t, categoryKey, item)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: '380px', height: '8px', background: '#ddd', borderRadius: '4px', marginTop: '16px', overflow: 'hidden', margin: '16px auto 0' }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg, #4CAF50, #8BC34A)', borderRadius: '4px', transition: 'width 0.5s ease', width: `${(round / ROUNDS_PER_LEVEL) * 100}%` }} />
      </div>
    </>
  )
}

const feedMonsterKeyframes = `
  @keyframes monster-bounce {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-12px) scale(1.05); }
  }
  @keyframes monster-eat {
    0% { transform: scale(1); }
    30% { transform: scale(1.3) rotate(-5deg); }
    60% { transform: scale(0.9) rotate(5deg); }
    100% { transform: scale(1.1); }
  }
  @keyframes monster-shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-10px); }
    40% { transform: translateX(10px); }
    60% { transform: translateX(-6px); }
    80% { transform: translateX(6px); }
  }
  @keyframes fm-pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
  @keyframes fm-shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-8px); }
    75% { transform: translateX(8px); }
  }
`

// ============ MATCH SHADOW MODE (Hard for objects/home/tools) ============
function MatchShadowMode({ categoryKey, onBack, t, lang }) {
  const items = CATEGORIES[categoryKey].items
  const ITEMS_PER_ROUND = 3

  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [roundItems, setRoundItems] = useState([])
  const [shadowOrder, setShadowOrder] = useState([])
  const [matched, setMatched] = useState([])
  const [dragging, setDragging] = useState(null)
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 })
  const [feedback, setFeedback] = useState(null)
  const [bounceBack, setBounceBack] = useState(null)
  const queue = useRef([])

  const dragRef = useRef(null)
  const shadowRefs = useRef({})
  const itemRefs = useRef({})

  const getNextBatch = useCallback(() => {
    // Get ITEMS_PER_ROUND items from the queue
    const batch = []
    for (let i = 0; i < ITEMS_PER_ROUND; i++) {
      if (queue.current.length === 0) queue.current = createQueue(items)
      batch.push(queue.current.pop())
    }
    // Deduplicate - if same item appears, swap from queue
    const seen = new Set()
    for (let i = 0; i < batch.length; i++) {
      if (seen.has(batch[i].name)) {
        // Try to find a different one
        let tries = 0
        while (seen.has(batch[i].name) && tries < items.length) {
          if (queue.current.length === 0) queue.current = createQueue(items)
          batch[i] = queue.current.pop()
          tries++
        }
      }
      seen.add(batch[i].name)
    }
    return batch
  }, [items])

  const startRound = useCallback(() => {
    const picked = getNextBatch()
    setRoundItems(picked)
    setShadowOrder(shuffle(picked))
    setMatched([])
    setDragging(null)
    setFeedback(null)
    setBounceBack(null)
    const matchText = t.matchShadows || 'Match the shadows'
    setTimeout(() => speakPrompt(matchText, lang), 300)
  }, [getNextBatch, t, lang])

  useEffect(() => {
    if (!gameOver) startRound()
  }, [round, gameOver, startRound])

  const handleDragStart = (e, item, idx) => {
    if (matched.includes(item.name)) return
    e.preventDefault()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const rect = itemRefs.current[idx]?.getBoundingClientRect()
    dragRef.current = {
      item, idx,
      offsetX: clientX - (rect ? rect.left : 0),
      offsetY: clientY - (rect ? rect.top : 0),
      startX: rect ? rect.left : clientX,
      startY: rect ? rect.top : clientY,
    }
    setDragging(idx)
    setDragPos({ x: clientX, y: clientY })
  }

  const handleDragMove = useCallback((e) => {
    if (!dragRef.current) return
    e.preventDefault()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    setDragPos({ x: clientX, y: clientY })
  }, [])

  const handleDragEnd = useCallback((e) => {
    if (!dragRef.current) return
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY
    const { item } = dragRef.current

    let foundMatch = false
    for (let si = 0; si < shadowOrder.length; si++) {
      const shadowEl = shadowRefs.current[si]
      if (!shadowEl || matched.includes(shadowOrder[si].name)) continue
      const rect = shadowEl.getBoundingClientRect()
      if (
        clientX >= rect.left - 10 && clientX <= rect.right + 10 &&
        clientY >= rect.top - 10 && clientY <= rect.bottom + 10
      ) {
        if (shadowOrder[si].name === item.name) {
          foundMatch = true
          const newMatched = [...matched, item.name]
          setMatched(newMatched)
          setFeedback({ type: 'correct', shadowIdx: si })
          const itemName = getItemName(t, categoryKey, item)
          playCorrectSound(itemName, lang)
          setScore(s => s + 1)
          setTimeout(() => setFeedback(null), 600)

          if (newMatched.length === ITEMS_PER_ROUND) {
            setTimeout(() => {
              if (round + 1 >= ROUNDS_PER_LEVEL) {
                playLevelUpSound(lang)
                setGameOver(true)
              } else {
                setRound(r => r + 1)
              }
            }, 800)
          }
        } else {
          foundMatch = true
          setFeedback({ type: 'wrong', shadowIdx: si })
          const itemName = getItemName(t, categoryKey, item)
          playWrongSound(itemName, lang)
          setBounceBack(dragRef.current.idx)
          setTimeout(() => {
            setFeedback(null)
            setBounceBack(null)
          }, 500)
        }
        break
      }
    }

    if (!foundMatch) {
      setBounceBack(dragRef.current.idx)
      setTimeout(() => setBounceBack(null), 400)
    }

    dragRef.current = null
    setDragging(null)
  }, [shadowOrder, matched, lang, round, t, categoryKey])

  useEffect(() => {
    const onMove = (e) => handleDragMove(e)
    const onEnd = (e) => handleDragEnd(e)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [handleDragMove, handleDragEnd])

  if (gameOver) {
    const maxScore = ROUNDS_PER_LEVEL * ITEMS_PER_ROUND
    const pct = score / maxScore
    return <ResultScreen score={score} total={maxScore} suffix={t.score || 'points'} pct={pct} t={t} onReplay={() => { setRound(0); setScore(0); setGameOver(false); queue.current = createQueue(items) }} onBack={onBack} />
  }

  return (
    <div style={{ touchAction: 'none', userSelect: 'none' }}>
      <div className="round-info">{t.roundXofY(round + 1, ROUNDS_PER_LEVEL)}</div>
      <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#4CAF50', fontWeight: '600' }}>⭐ {score}</div>

      {/* Title */}
      <div style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold', color: '#4a148c', margin: '8px 0' }}>
        🔦 {t.matchShadows || 'Match the Shadows!'}
      </div>

      {/* Game area */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', width: '100%', maxWidth: '400px', margin: '0 auto', padding: '0 8px' }}>
        {/* Objects - Left side */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', flex: 1 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#666' }}>{t.objects || 'Objects'}</div>
          {roundItems.map((item, idx) => {
            const isMatched = matched.includes(item.name)
            const isDragging2 = dragging === idx
            const isBouncing = bounceBack === idx
            return (
              <div
                key={item.name + '-obj-' + idx}
                ref={(el) => (itemRefs.current[idx] = el)}
                onMouseDown={(e) => handleDragStart(e, item, idx)}
                onTouchStart={(e) => handleDragStart(e, item, idx)}
                style={{
                  width: '75px', height: '75px', borderRadius: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 3px 8px rgba(0,0,0,0.15)', border: '3px solid #90caf9',
                  opacity: isMatched ? 0.3 : isDragging2 ? 0.4 : 1,
                  transform: isBouncing ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.3s ease, opacity 0.3s ease',
                  cursor: isMatched ? 'default' : 'grab',
                  background: isMatched ? '#c8e6c9' : '#fff',
                  pointerEvents: isMatched ? 'none' : 'auto',
                }}
              >
                <span style={{ fontSize: '2.5rem', userSelect: 'none' }}>{item.emoji}</span>
              </div>
            )
          })}
        </div>

        {/* Shadows - Right side */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', flex: 1 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#666' }}>{t.shadows || 'Shadows'}</div>
          {shadowOrder.map((item, si) => {
            const isMatched = matched.includes(item.name)
            const hasFeedback = feedback && feedback.shadowIdx === si
            const isCorrectFeedback = hasFeedback && feedback.type === 'correct'
            const isWrongFeedback = hasFeedback && feedback.type === 'wrong'
            return (
              <div
                key={item.name + '-shadow-' + si}
                ref={(el) => (shadowRefs.current[si] = el)}
                style={{
                  width: '80px', height: '80px', borderRadius: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '3px dashed #9e9e9e',
                  background: isCorrectFeedback ? '#a5d6a7' : isWrongFeedback ? '#ef9a9a' : isMatched ? '#c8e6c9' : '#e0e0e0',
                  boxShadow: isCorrectFeedback ? '0 0 20px #4caf50' : isWrongFeedback ? '0 0 20px #f44336' : '0 2px 6px rgba(0,0,0,0.12)',
                  transition: 'background 0.3s, box-shadow 0.3s',
                }}
              >
                {isMatched ? (
                  <span style={{ fontSize: '2.5rem', userSelect: 'none' }}>{item.emoji}</span>
                ) : (
                  <span style={{ fontSize: '2.8rem', filter: 'brightness(0)', opacity: 0.3, userSelect: 'none' }}>{item.emoji}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Dragging ghost */}
      {dragging !== null && (
        <div style={{
          position: 'fixed', left: dragPos.x - 30, top: dragPos.y - 30,
          fontSize: '3rem', pointerEvents: 'none', zIndex: 9999,
          filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.3))',
          transition: 'none', userSelect: 'none',
        }}>
          {roundItems[dragging]?.emoji}
        </div>
      )}
    </div>
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

// Determine which Hard mode to show based on category
function getHardModeType(categoryKey) {
  if (['fruits', 'vegetables', 'kitchen'].includes(categoryKey)) return 'feedMonster'
  if (['objects', 'home', 'tools'].includes(categoryKey)) return 'matchShadow'
  return 'speedTimer' // fallback for animals, alphabet, etc.
}

// ============ MAIN COMPONENT ============
export default function ImageQuiz({ categoryKey, onBack }) {
  const { t, lang } = useLanguage()
  const category = CATEGORIES[categoryKey]
  const [diffLevel, setDiffLevel] = useState(null)

  const catTitle = t.categoryTitles?.[categoryKey] || (categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1))

  const hardModeType = getHardModeType(categoryKey)
  const hardDesc = hardModeType === 'feedMonster'
    ? (t.feedMonsterDesc || 'Feed the monster the right item!')
    : hardModeType === 'matchShadow'
    ? (t.matchShadowDesc || 'Drag objects to their shadows!')
    : (t.hardQuizDesc || 'Speed challenge with timer!')

  const DIFFICULTIES = [
    { key: 'easy', emoji: '🔊', desc: t.easyQuizDesc || 'Voice guides you! Hear the name, then tap it.' },
    { key: 'medium', emoji: '⚡', desc: t.mediumQuizDesc || 'Speed challenge with timer!' },
    { key: 'hard', emoji: '🎮', desc: hardDesc },
  ]

  // Preload animal sounds when entering the animals category
  useEffect(() => {
    if (categoryKey === 'animals') preloadAnimalSounds()
  }, [categoryKey])

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

  // Render Hard mode based on category type
  const renderHardMode = () => {
    if (hardModeType === 'feedMonster') {
      return <FeedMonsterMode categoryKey={categoryKey} onBack={() => setDiffLevel(null)} t={t} lang={lang} />
    }
    if (hardModeType === 'matchShadow') {
      return <MatchShadowMode categoryKey={categoryKey} onBack={() => setDiffLevel(null)} t={t} lang={lang} />
    }
    // Fallback: speed timer (same as medium) for categories without a special game
    return <MediumMode categoryKey={categoryKey} onBack={() => setDiffLevel(null)} t={t} lang={lang} />
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
      {diffLevel === 2 && renderHardMode()}
    </div>
  )
}

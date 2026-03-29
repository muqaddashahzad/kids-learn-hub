import { useState, useEffect, useCallback, useRef } from 'react'
import { useLanguage } from '../LanguageContext'
import { playCorrectSound, playWrongSound, playLevelUpSound, playPopSound, playCountdownBeep, speakPrompt, speakName } from '../sounds'

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

const COLOR_TEXT = { Yellow: '#222222', White: '#222222' }
const ROUNDS_PER_LEVEL = 10

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

function createColorQueue() { return shuffle([...COLORS]) }

// ============ EASY MODE: Voice says "Choose [color]" BEFORE child taps ============
function EasyMode({ onBack, t, lang }) {
  const [round, setRound] = useState(1)
  const [score, setScore] = useState(0)
  const [currentColor, setCurrentColor] = useState(null)
  const [options, setOptions] = useState([])
  const [feedback, setFeedback] = useState('')
  const [selected, setSelected] = useState(null)
  const [disabled, setDisabled] = useState(true) // start disabled until voice finishes
  const [gameOver, setGameOver] = useState(false)
  const [speaking, setSpeaking] = useState(false) // shows "listening" indicator
  const colorQueue = useRef([])

  const getNextColor = useCallback(() => {
    if (colorQueue.current.length === 0) colorQueue.current = createColorQueue()
    return colorQueue.current.pop()
  }, [])

  const newRound = useCallback(async () => {
    const color = getNextColor()
    setCurrentColor(color)
    setOptions(getOptions(color, COLORS, 2))
    setFeedback(''); setSelected(null); setDisabled(true); setSpeaking(true)
    // Voice says "Choose [color name]" BEFORE enabling buttons
    await speakPrompt(t.colors[color.name], lang)
    setSpeaking(false)
    setDisabled(false)
  }, [getNextColor, t, lang])

  useEffect(() => { newRound() }, []) // only run once on mount

  const handleAnswer = (opt) => {
    if (disabled) return
    setDisabled(true); setSelected(opt.name)
    const isCorrect = opt.name === currentColor.name
    if (isCorrect) {
      setScore(s => s + 1); setFeedback(t.correct)
      playCorrectSound(t.colors[currentColor.name], lang)
    } else {
      setFeedback(t.tryAgain(t.colors[currentColor.name]))
      playWrongSound(t.colors[currentColor.name], lang)
    }
    setTimeout(() => {
      if (round >= ROUNDS_PER_LEVEL) {
        setGameOver(true)
        playLevelUpSound(lang)
      } else { setRound(r => r + 1); newRound() }
    }, 1500)
  }

  if (gameOver) {
    const finalScore = score
    const emoji = finalScore >= 8 ? '🏆' : finalScore >= 5 ? '⭐' : '💪'
    const msg = finalScore >= 8 ? (t.colorExpert || 'Color expert!') :
                finalScore >= 5 ? (t.keepPracticing || 'Keep practicing!') :
                (t.niceTry || 'Nice try!')
    return (
      <div className="result-screen">
        <div className="result-emoji">{emoji}</div>
        <div className="result-score">{finalScore} / {ROUNDS_PER_LEVEL}</div>
        <div className="result-message">{msg}</div>
        <button className="play-again-btn" onClick={() => {
          setRound(1); setScore(0); setGameOver(false)
          colorQueue.current = createColorQueue()
          newRound()
        }}>{t.playAgain}</button>
        <br /><br />
        <button className="play-again-btn" style={{ background: '#aaa' }} onClick={onBack}>{t.home}</button>
      </div>
    )
  }

  return (
    <>
      <div className="round-info">{t.roundXofY(round, ROUNDS_PER_LEVEL)}</div>
      <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#4CAF50', fontWeight: '600' }}>⭐ {score}</div>
      
      {/* Voice prompt indicator */}
      {speaking && (
        <div style={{
          textAlign: 'center', padding: '8px', margin: '4px 12px',
          background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)', borderRadius: '12px',
          fontSize: '1.1rem', fontWeight: '600', color: '#1565C0',
          animation: 'pulse 1s ease-in-out infinite',
        }}>
          🔊 {t.choosePrompt ? t.choosePrompt(t.colors[currentColor?.name]) : `Choose ${t.colors[currentColor?.name]}!`}
        </div>
      )}
      
      <div className="display-area">
        {currentColor && (
          <div className="color-circle" style={{
            backgroundColor: currentColor.hex,
            border: currentColor.name === 'White' ? '3px solid #ddd' : 'none'
          }} />
        )}
      </div>
      <div className="options-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {options.map(opt => {
          const isSelected = selected === opt.name
          const isCorrect = isSelected && opt.name === currentColor.name
          const isWrong = isSelected && opt.name !== currentColor.name
          return (
            <button key={opt.name}
              className={`color-option-btn ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
              style={{
                backgroundColor: opt.hex, color: COLOR_TEXT[opt.name] || '#FFFFFF',
                border: opt.name === 'White' ? '3px solid #ccc' : isCorrect ? '3px solid #28a745' : isWrong ? '3px solid #ff3333' : '3px solid transparent',
                minHeight: '70px', borderRadius: '16px', fontSize: '1.3rem', fontWeight: '700',
                cursor: disabled ? 'default' : 'pointer', transition: 'all 0.2s',
                opacity: disabled && !isSelected ? 0.6 : 1,
                textShadow: (COLOR_TEXT[opt.name] || '#FFFFFF') === '#FFFFFF' ? '1px 1px 2px rgba(0,0,0,0.3)' : 'none',
              }}
              onClick={() => handleAnswer(opt)}
            >{t.colors[opt.name]}</button>
          )
        })}
      </div>
      {feedback && <div className="feedback">{feedback}</div>}
    </>
  )
}

// ============ MEDIUM MODE: Balloon Pop ============
const BALLOON_COLORS = COLORS.filter(c => c.name !== 'White' && c.name !== 'Black')

let balloonId = 0

function Balloon({ color, size }) {
  return (
    <svg viewBox="0 0 80 120" width={size} height={size * 1.5} style={{ filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.25))' }}>
      <ellipse cx="40" cy="42" rx="35" ry="40" fill={color} />
      <ellipse cx="40" cy="42" rx="35" ry="40" fill="rgba(255,255,255,0.12)" />
      <ellipse cx="30" cy="26" rx="9" ry="13" fill="rgba(255,255,255,0.35)" />
      <polygon points="36,80 40,88 44,80" fill={color} />
      <path d="M40,88 Q38,98 42,108 Q40,113 38,120" stroke="#999" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

function MediumMode({ onBack, t, lang }) {
  const [phase, setPhase] = useState('intro')
  const [target, setTarget] = useState(null)
  const [balloons, setBalloons] = useState([])
  const [score, setScore] = useState(0)
  const [wrongTaps, setWrongTaps] = useState(0)
  const [timeLeft, setTimeLeft] = useState(20)
  const [countdown, setCountdown] = useState(3)
  const balloonsRef = useRef([])
  const frameRef = useRef(null)
  const spawnRef = useRef(null)
  const timerRef = useRef(null)
  const areaRef = useRef(null)

  const pickTarget = useCallback(() => {
    return BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)]
  }, [])

  const spawnBalloon = useCallback(() => {
    const areaWidth = areaRef.current ? areaRef.current.offsetWidth : 300
    const x = 10 + Math.random() * (areaWidth - 100)
    let item = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)]
    // 50% chance to be the target color - more targets = more fun for kids
    if (Math.random() < 0.5 && target) item = target
    balloonId++
    return {
      id: balloonId, item, color: item.hex, x, y: -120,
      // Bigger balloons (65-85px) for easier tapping
      size: 65 + Math.random() * 20,
      // Slower speed so kids can track and tap
      speed: 1.2 * (0.8 + Math.random() * 0.3),
      popped: false, wrong: false, wobble: Math.random() * 360,
    }
  }, [target])

  const startGame = useCallback(() => {
    const t2 = pickTarget()
    setTarget(t2)
    setScore(0); setWrongTaps(0); setTimeLeft(25)
    balloonsRef.current = []; setBalloons([])
    setCountdown(3); setPhase('countdown')
    try {
      const utterance = new SpeechSynthesisUtterance(
        lang === 'ur' ? `تمام ${t.colors[t2.name]} غبارے پھوڑیں!` :
        lang === 'hi' ? `सभी ${t.colors[t2.name]} गुब्बारे फोड़ो!` :
        `Pop all ${t.colors[t2.name]} balloons!`
      )
      utterance.lang = lang === 'ur' ? 'ur-PK' : lang === 'hi' ? 'hi-IN' : 'en-US'
      utterance.rate = 0.9; utterance.pitch = 1.15
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    } catch(e) {}
  }, [pickTarget, lang, t])

  useEffect(() => { startGame() }, [])

  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown <= 0) { setPhase('playing'); return }
    playCountdownBeep(countdown === 1)
    const tm = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(tm)
  }, [phase, countdown])

  useEffect(() => {
    if (phase !== 'playing') return
    if (timeLeft <= 0) { setPhase('done'); playLevelUpSound(lang); return }
    timerRef.current = setTimeout(() => setTimeLeft(tl => tl - 1), 1000)
    return () => clearTimeout(timerRef.current)
  }, [phase, timeLeft, lang])

  useEffect(() => {
    if (phase !== 'playing') return
    // Spawn more frequently so there's always something to pop
    spawnRef.current = setInterval(() => { balloonsRef.current.push(spawnBalloon()) }, 800)
    return () => clearInterval(spawnRef.current)
  }, [phase, spawnBalloon])

  const animate = useCallback(() => {
    balloonsRef.current = balloonsRef.current
      .map(b => ({ ...b, y: b.popped ? b.y : b.y + b.speed, wobble: b.wobble + 0.5 }))
      .filter(b => {
        if (b.y > window.innerHeight && !b.popped) return false
        if (b.popped && b.popTime && Date.now() - b.popTime > 400) return false
        return true
      })
    setBalloons([...balloonsRef.current])
    frameRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [phase, animate])

  useEffect(() => () => {
    cancelAnimationFrame(frameRef.current)
    clearInterval(spawnRef.current)
    clearTimeout(timerRef.current)
  }, [])

  const handleTap = (b) => {
    if (b.popped) return
    const isTarget = b.item.name === target?.name
    balloonsRef.current = balloonsRef.current.map(bl =>
      bl.id === b.id ? { ...bl, popped: true, wrong: !isTarget, popTime: Date.now() } : bl
    )
    setBalloons([...balloonsRef.current])
    if (isTarget) { setScore(s => s + 1); playPopSound() }
    else { setWrongTaps(w => w + 1); playWrongSound(t.colors[target.name], lang) }
  }

  const targetName = target ? t.colors[target.name] : ''

  if (phase === 'countdown') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ fontSize: '1.2rem', color: '#555', marginBottom: '12px' }}>{t.popTarget || 'Pop all:'}</div>
        <div style={{
          fontSize: '2rem', fontWeight: '700', marginBottom: '20px', padding: '12px 24px',
          borderRadius: '16px', background: target ? target.hex : '#ccc',
          color: (target?.name === 'Yellow') ? '#222' : '#fff',
        }}>{targetName}</div>
        <div style={{ fontSize: '5rem', fontWeight: '700', color: countdown > 0 ? '#f44336' : '#4CAF50' }}>
          {countdown > 0 ? countdown : (t.go || 'GO!')}
        </div>
      </div>
    )
  }

  if (phase === 'done') {
    const emoji = score >= 8 ? '🏆' : score >= 5 ? '⭐' : '💪'
    return (
      <div className="result-screen">
        <div className="result-emoji">{emoji} 🎈</div>
        <div className="result-score" style={{ fontSize: '2.5rem' }}>{score}</div>
        <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '8px' }}>
          {targetName} {t.balloonsPopped || 'balloons popped!'}
        </div>
        {wrongTaps > 0 && (
          <div style={{ fontSize: '0.85rem', color: '#e74c3c', marginBottom: '8px' }}>
            ❌ {wrongTaps} {t.wrongPops || 'wrong taps'}
          </div>
        )}
        <button className="play-again-btn" onClick={startGame}>{t.playAgain}</button>
        <br /><br />
        <button className="play-again-btn" style={{ background: '#aaa' }} onClick={onBack}>{t.home}</button>
      </div>
    )
  }

  return (
    <div style={{ overflow: 'hidden', position: 'relative', touchAction: 'none' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 12px', background: 'rgba(255,255,255,0.9)', borderRadius: '0 0 16px 16px',
        position: 'relative', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.85rem', color: '#555' }}>{t.popTarget || 'Pop:'}</span>
          <span style={{
            display: 'inline-block', width: '24px', height: '24px', borderRadius: '50%',
            background: target?.hex, border: '2px solid #ddd',
          }} />
          <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{targetName}</span>
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: timeLeft <= 5 ? '#f44336' : '#333' }}>
          ⏱️ {timeLeft}s
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#4CAF50' }}>⭐ {score}</div>
      </div>
      <div ref={areaRef} style={{ position: 'relative', width: '100%', height: 'calc(100vh - 140px)', overflow: 'hidden' }}>
        {balloons.map(b => (
          <div key={b.id}
            onPointerDown={(e) => { e.preventDefault(); handleTap(b) }}
            style={{
              position: 'absolute',
              // Gentle wobble (reduced from 8 to 3 so kids don't miss)
              left: b.x + Math.sin(b.wobble * 0.04) * 3,
              top: b.y,
              // Extra 20px padding around balloon for easier tapping
              padding: '20px',
              margin: '-20px',
              cursor: 'pointer',
              transition: b.popped ? 'transform 0.3s, opacity 0.3s' : 'none',
              transform: b.popped ? 'scale(1.5)' : 'scale(1)',
              opacity: b.popped ? 0 : 1,
              zIndex: 5, userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
          }}>
            {b.popped && !b.wrong && <div style={{ position: 'absolute', top: '0px', left: '50%', transform: 'translateX(-50%)', fontSize: '1.8rem', zIndex: 20 }}>✅</div>}
            {b.popped && b.wrong && <div style={{ position: 'absolute', top: '0px', left: '50%', transform: 'translateX(-50%)', fontSize: '1.8rem', zIndex: 20 }}>❌</div>}
            <Balloon color={b.color} size={b.size} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ HARD MODE: Color Memory Match ============
function HardMode({ onBack, t, lang }) {
  const [phase, setPhase] = useState('playing')
  const [cards, setCards] = useState([])
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [moves, setMoves] = useState(0)
  const [timer, setTimer] = useState(0)
  const timerRef = useRef(null)
  // Use ref to track flipped cards to avoid React state batching issues
  const flippedRef = useRef([])
  const lockRef = useRef(false)

  const initGame = useCallback(() => {
    const picked = shuffle([...COLORS]).slice(0, 6)
    const pairs = [...picked, ...picked].map((c, i) => ({ ...c, uid: i }))
    setCards(shuffle(pairs))
    setFlipped([]); setMatched([]); setMoves(0); setTimer(0)
    flippedRef.current = []
    lockRef.current = false; setPhase('playing')
  }, [])

  useEffect(() => { initGame() }, [initGame])

  // Timer
  useEffect(() => {
    if (phase !== 'playing' || matched.length === cards.length) return
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [phase, matched.length, cards.length])

  const handleFlip = (index) => {
    // Block if locked (checking a pair) or already flipped/matched
    if (lockRef.current) return
    if (flippedRef.current.includes(index)) return
    if (matched.includes(index)) return

    // Add to flipped using ref (avoids stale state)
    flippedRef.current = [...flippedRef.current, index]
    setFlipped([...flippedRef.current])

    if (flippedRef.current.length === 2) {
      // Two cards flipped - lock immediately
      lockRef.current = true
      setMoves(m => m + 1)
      const [a, b] = flippedRef.current

      if (cards[a].name === cards[b].name) {
        // Match found!
        playCorrectSound(t.colors[cards[a].name], lang)
        setTimeout(() => {
          const newMatched = [...matched, a, b]
          setMatched(newMatched)
          flippedRef.current = []
          setFlipped([])
          lockRef.current = false
          // Check win - all 12 cards matched
          if (newMatched.length === cards.length) {
            setPhase('done')
            clearInterval(timerRef.current)
            playLevelUpSound(lang)
          }
        }, 600)
      } else {
        // No match - show briefly then flip back
        playWrongSound(t.colors[cards[a].name], lang)
        setTimeout(() => {
          flippedRef.current = []
          setFlipped([])
          lockRef.current = false
        }, 900)
      }
    }
  }

  if (phase === 'done' || (matched.length === cards.length && cards.length > 0)) {
    const emoji = moves <= 10 ? '🏆' : moves <= 15 ? '⭐' : '💪'
    const stars = moves <= 10 ? 3 : moves <= 15 ? 2 : 1
    return (
      <div className="result-screen">
        <div className="result-emoji">{emoji}</div>
        <div style={{ fontSize: '2rem', fontWeight: '700', color: '#333' }}>
          {'⭐'.repeat(stars)}
        </div>
        <div style={{ fontSize: '0.95rem', color: '#666', margin: '8px 0' }}>
          {t.memoryMoves ? t.memoryMoves(moves) : `${moves} moves`} • {timer}s
        </div>
        <div className="result-message">
          {stars === 3 ? (t.memoryPerfect || 'Perfect memory!') :
           stars === 2 ? (t.memoryGreat || 'Great job!') :
           (t.memoryGood || 'Good try!')}
        </div>
        <button className="play-again-btn" onClick={initGame}>{t.playAgain}</button>
        <br /><br />
        <button className="play-again-btn" style={{ background: '#aaa' }} onClick={onBack}>{t.home}</button>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 12px', fontSize: '0.9rem', color: '#555' }}>
        <span>🧠 {t.memoryMatch || 'Memory Match'}</span>
        <span>🔄 {moves}</span>
        <span>⏱️ {timer}s</span>
      </div>
      {/* How to play hint */}
      {moves === 0 && (
        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#888', padding: '4px', background: '#f5f5f5', borderRadius: '8px', margin: '4px 12px' }}>
          💡 {t.memoryHint || 'Tap 2 cards to flip them. Find all matching color pairs!'}
        </div>
      )}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px',
        padding: '8px', maxWidth: '360px', margin: '0 auto',
      }}>
        {cards.map((card, i) => {
          const isFlipped = flipped.includes(i) || matched.includes(i)
          const isMatched = matched.includes(i)
          return (
            <div key={i} onClick={() => handleFlip(i)} style={{
              aspectRatio: '1', borderRadius: '14px', cursor: 'pointer',
              background: isFlipped ? card.hex : 'linear-gradient(135deg, #667eea, #764ba2)',
              border: isMatched ? '3px solid #4CAF50' : isFlipped ? '3px solid #fff' : '3px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s',
              boxShadow: isMatched ? '0 0 15px rgba(76,175,80,0.4)' : '0 3px 10px rgba(0,0,0,0.15)',
              position: 'relative', overflow: 'hidden',
              opacity: isMatched ? 0.7 : 1,
            }}>
              {isFlipped ? (
                <span style={{
                  fontSize: '0.75rem', fontWeight: '700',
                  color: COLOR_TEXT[card.name] || '#fff',
                  textShadow: (COLOR_TEXT[card.name] || '#fff') === '#fff' ? '1px 1px 2px rgba(0,0,0,0.4)' : 'none',
                  textAlign: 'center', padding: '4px',
                }}>{t.colors[card.name]}</span>
              ) : (
                <span style={{ fontSize: '1.5rem' }}>❓</span>
              )}
              {isMatched && <div style={{
                position: 'absolute', top: '4px', right: '4px', fontSize: '0.8rem'
              }}>✅</div>}
            </div>
          )
        })}
      </div>
    </>
  )
}

// ============ MAIN COMPONENT ============
export default function LearnColors({ onBack }) {
  const { t, lang } = useLanguage()
  const [diffLevel, setDiffLevel] = useState(null)

  const DIFFICULTIES = [
    { key: 'easy', label: '🟢', emoji: '🔊', desc: t.easyColorDesc || 'Voice guides you! Hear the color, then tap it.' },
    { key: 'medium', label: '🟡', emoji: '🎈', desc: t.popColorsDesc || 'Pop the right color balloons!' },
    { key: 'hard', label: '🔴', emoji: '🧠', desc: t.memoryMatchDesc || 'Find matching color pairs!' },
  ]

  // Difficulty selection screen
  if (diffLevel === null) {
    return (
      <div className="game-screen">
        <div className="game-header">
          <button className="back-btn" onClick={onBack}>←</button>
          <span className="game-title">🎨 {t.learnColors}</span>
          <span></span>
        </div>
        <div style={{ textAlign: 'center', padding: '16px 12px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🎨</div>
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
                <div>{d.label} {t[d.key]}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: '400', opacity: 0.9, marginTop: '2px' }}>{d.desc}</div>
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
        <span className="game-title">🎨 {t.learnColors} - {DIFFICULTIES[diffLevel].label} {t[DIFFICULTIES[diffLevel].key]}</span>
        <span></span>
      </div>

      {diffLevel === 0 && <EasyMode onBack={() => setDiffLevel(null)} t={t} lang={lang} />}
      {diffLevel === 1 && <MediumMode onBack={() => setDiffLevel(null)} t={t} lang={lang} />}
      {diffLevel === 2 && <HardMode onBack={() => setDiffLevel(null)} t={t} lang={lang} />}
    </div>
  )
}

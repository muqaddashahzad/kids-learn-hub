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
    if (isTarget) { setScore(s => s + 1); playPopSound(); speakName(t.colors[target.name], lang) }
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


// ============ COLOR SPLASH MODE ============
const SPLASH_COLORS = [
  { name: 'red', hex: '#FF4444' },
  { name: 'blue', hex: '#4488FF' },
  { name: 'green', hex: '#44CC44' },
  { name: 'yellow', hex: '#FFD700' },
  { name: 'purple', hex: '#9944CC' },
  { name: 'orange', hex: '#FF8800' },
  { name: 'pink', hex: '#FF69B4' },
]

const SPLASH_SHAPES = [
  { type: 'circle', label: 'Circle' },
  { type: 'square', label: 'Square' },
  { type: 'star', label: 'Star' },
  { type: 'diamond', label: 'Diamond' },
  { type: 'heart', label: 'Heart' },
  { type: 'triangle', label: 'Triangle' },
]

const SPLASH_TOTAL_ROUNDS = 10

function generateSplashRound() {
  const target = SPLASH_COLORS[Math.floor(Math.random() * SPLASH_COLORS.length)]
  const shape = SPLASH_SHAPES[Math.floor(Math.random() * SPLASH_SHAPES.length)]
  const others = SPLASH_COLORS.filter(c => c.name !== target.name)
  const shuffledOthers = shuffle(others).slice(0, 3)
  const options = shuffle([target, ...shuffledOthers])
  return { target, shape, options }
}

function SplashShapeRenderer({ type, size, color, style: extraStyle }) {
  const base = {
    width: size, height: size,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.4s ease, border-color 0.4s ease',
    ...extraStyle,
  }
  if (type === 'circle') return <div style={{ ...base, borderRadius: '50%', background: color || '#E0E0E0', border: color ? 'none' : '4px dashed #BDBDBD' }} />
  if (type === 'square') return <div style={{ ...base, borderRadius: 16, background: color || '#E0E0E0', border: color ? 'none' : '4px dashed #BDBDBD' }} />
  if (type === 'diamond') return <div style={{ ...base, background: color || '#E0E0E0', border: color ? 'none' : '4px dashed #BDBDBD', borderRadius: 12, transform: 'rotate(45deg)' }} />
  if (type === 'star') return <div style={{ ...base, fontSize: size * 0.85, lineHeight: 1, background: 'transparent', border: 'none', filter: color ? 'none' : 'grayscale(1) brightness(1.5)', color: color || '#BDBDBD' }}>★</div>
  if (type === 'heart') return <div style={{ ...base, fontSize: size * 0.75, lineHeight: 1, background: 'transparent', border: 'none', filter: color ? 'none' : 'grayscale(1) brightness(1.5)', color: color || '#BDBDBD' }}>♥</div>
  if (type === 'triangle') {
    if (color) return <div style={{ ...base, width: 0, height: 0, background: 'transparent', borderLeft: `${size/2}px solid transparent`, borderRight: `${size/2}px solid transparent`, borderBottom: `${size}px solid ${color}` }} />
    return <div style={{ ...base, fontSize: size * 0.85, lineHeight: 1, background: 'transparent', border: 'none', color: '#BDBDBD' }}>△</div>
  }
  return <div style={{ ...base, background: color || '#E0E0E0', borderRadius: '50%' }} />
}

function SplashPaintBucket({ color, onClick, shaking }) {
  return (
    <button onClick={onClick} style={{
      width: 72, height: 88, border: 'none', background: 'transparent', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 0,
      animation: shaking ? 'csSplashShake 0.5s ease' : 'none',
      WebkitTapHighlightColor: 'transparent',
    }} aria-label={`${color.name} paint bucket`}>
      <div style={{ width: 50, height: 12, borderRadius: '0 0 12px 12px', background: color.hex, marginBottom: -2, position: 'relative', zIndex: 1 }}>
        <div style={{ position: 'absolute', bottom: -6, left: 8, width: 8, height: 8, borderRadius: '50%', background: color.hex }} />
      </div>
      <div style={{
        width: 56, height: 52, borderRadius: '6px 6px 14px 14px', background: color.hex,
        border: '3px solid rgba(0,0,0,0.15)', position: 'relative',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2), inset 0 -8px 12px rgba(0,0,0,0.15)',
      }}>
        <div style={{ position: 'absolute', top: 6, left: 6, width: 10, height: 20, borderRadius: 6, background: 'rgba(255,255,255,0.35)' }} />
        <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', width: 36, height: 18, borderRadius: '18px 18px 0 0', border: '3px solid rgba(0,0,0,0.25)', borderBottom: 'none', background: 'transparent' }} />
      </div>
      <div style={{ marginTop: 4, fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'capitalize' }}>{color.name}</div>
    </button>
  )
}

function SplashDroplets({ color, active }) {
  if (!active) return null
  const droplets = []
  for (let i = 0; i < 8; i++) {
    const angle = (360 / 8) * i
    const dist = 60 + Math.random() * 40
    const size = 12 + Math.random() * 16
    droplets.push(
      <div key={i} style={{
        position: 'absolute', width: size, height: size, borderRadius: '50%', background: color,
        top: '50%', left: '50%', marginTop: -size/2, marginLeft: -size/2,
        animation: `csSplashDrop 0.7s ${i * 0.04}s ease-out forwards`, opacity: 0,
        '--splash-x': `${Math.cos((angle * Math.PI) / 180) * dist}px`,
        '--splash-y': `${Math.sin((angle * Math.PI) / 180) * dist}px`,
      }} />
    )
  }
  return <>{droplets}</>
}

const splashStyleTag = `
@keyframes csSplashDrop {
  0% { transform: translate(0,0) scale(0); opacity: 1; }
  60% { opacity: 1; }
  100% { transform: translate(var(--splash-x), var(--splash-y)) scale(1.3); opacity: 0; }
}
@keyframes csSplashShake {
  0%,100% { transform: translateX(0); }
  15% { transform: translateX(-8px); }
  30% { transform: translateX(8px); }
  45% { transform: translateX(-6px); }
  60% { transform: translateX(6px); }
  75% { transform: translateX(-3px); }
  90% { transform: translateX(3px); }
}
@keyframes csSplashBounce {
  0% { transform: scale(1); }
  30% { transform: scale(1.25); }
  50% { transform: scale(0.9); }
  70% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
@keyframes csSplashFadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
`

function ColorSplashMode({ onBack, t, lang }) {
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [roundData, setRoundData] = useState(null)
  const [splashedColor, setSplashedColor] = useState(null)
  const [splashActive, setSplashActive] = useState(false)
  const [shakingBucket, setShakingBucket] = useState(null)
  const [bouncing, setBouncing] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [canTap, setCanTap] = useState(true)
  const timeoutRef = useRef(null)
  const hasSpoken = useRef(false)

  const startRound = useCallback(() => {
    const data = generateSplashRound()
    setRoundData(data)
    setSplashedColor(null); setSplashActive(false)
    setShakingBucket(null); setBouncing(false)
    setFeedback(null); setCanTap(true)
    hasSpoken.current = false
  }, [])

  useEffect(() => {
    startRound()
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [round, startRound])

  useEffect(() => {
    if (roundData && !hasSpoken.current && !gameOver) {
      hasSpoken.current = true
      const timer = setTimeout(() => { speakPrompt(roundData.target.name, lang) }, 400)
      return () => clearTimeout(timer)
    }
  }, [roundData, lang, gameOver])

  const handleBucketTap = (color) => {
    if (!canTap || !roundData) return
    if (color.name === roundData.target.name) {
      setCanTap(false); setSplashedColor(color.hex); setSplashActive(true)
      setBouncing(true); setFeedback('correct')
      setScore(s => s + 1); playCorrectSound(color.name, lang)
      timeoutRef.current = setTimeout(() => {
        if (round + 1 >= SPLASH_TOTAL_ROUNDS) { playLevelUpSound(lang); setGameOver(true) }
        else setRound(r => r + 1)
      }, 1500)
    } else {
      setShakingBucket(color.name); setFeedback('wrong')
      playWrongSound(roundData.target.name, lang)
      timeoutRef.current = setTimeout(() => { setShakingBucket(null); setFeedback(null) }, 700)
    }
  }

  const handlePlayAgain = () => { setRound(0); setScore(0); setGameOver(false); setRoundData(null) }

  if (gameOver) {
    const stars = score >= 9 ? '🌟🌟🌟' : score >= 7 ? '🌟🌟' : score >= 5 ? '🌟' : '💪'
    const msg = score >= 9 ? (t?.amazing || 'Amazing!') : score >= 7 ? (t?.great || 'Great job!') : score >= 5 ? (t?.good || 'Good work!') : (t?.keepTrying || 'Keep trying!')
    return (
      <div className="result-screen">
        <style>{splashStyleTag}</style>
        <div className="result-emoji" style={{ fontSize: '56px' }}>{stars}</div>
        <div className="result-score" style={{ fontSize: '2rem' }}>{score} / {SPLASH_TOTAL_ROUNDS}</div>
        <div className="result-message">{msg}</div>
        <button className="play-again-btn" onClick={handlePlayAgain}>{t.playAgain}</button>
        <br /><br />
        <button className="play-again-btn" style={{ background: '#aaa' }} onClick={onBack}>{t.home}</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '60vh', position: 'relative', overflow: 'hidden' }}>
      <style>{splashStyleTag}</style>
      <div style={{ textAlign: 'center', padding: '4px 0', fontSize: 14, fontWeight: 600, color: '#999' }}>
        {t.roundXofY ? t.roundXofY(round + 1, SPLASH_TOTAL_ROUNDS) : `Round ${round + 1} / ${SPLASH_TOTAL_ROUNDS}`}
      </div>
      <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#4CAF50', fontWeight: '600' }}>⭐ {score}</div>

      {roundData && (
        <div style={{ textAlign: 'center', padding: '12px 20px', animation: 'csSplashFadeIn 0.4s ease' }}>
          <div style={{
            display: 'inline-block', background: 'rgba(255,255,255,0.9)', borderRadius: 20,
            padding: '10px 28px', fontSize: 20, fontWeight: 800, color: '#333',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          }}>
            🎨 {t?.splashIt || 'Splash it'}{' '}
            <span style={{ color: roundData.target.hex, textTransform: 'uppercase' }}>{roundData.target.name}</span>!
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: '200px' }}>
        {roundData && (
          <div style={{ position: 'relative', animation: bouncing ? 'csSplashBounce 0.6s ease' : 'none' }}>
            <SplashDroplets color={splashedColor} active={splashActive} />
            <SplashShapeRenderer type={roundData.shape.type} size={140} color={splashedColor} style={{}} />
            {feedback === 'correct' && <div style={{ position: 'absolute', top: -30, right: -20, fontSize: 36, animation: 'csSplashBounce 0.5s ease' }}>✅</div>}
            {feedback === 'wrong' && <div style={{ position: 'absolute', top: -30, right: -20, fontSize: 36, animation: 'csSplashShake 0.5s ease' }}>❌</div>}
          </div>
        )}
      </div>

      {roundData && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, padding: '20px 16px 36px', flexWrap: 'wrap' }}>
          {roundData.options.map((color) => (
            <SplashPaintBucket key={color.name} color={color} shaking={shakingBucket === color.name} onClick={() => handleBucketTap(color)} />
          ))}
        </div>
      )}
    </div>
  )
}

// ============ COLOR MIXING MODE ============
const MIX_COLOR_MAP = {
  red: '#f44336', blue: '#2196F3', yellow: '#FFEB3B', white: '#f5f5f5',
  black: '#333333', purple: '#9C27B0', orange: '#FF9800', green: '#4CAF50',
  pink: '#E91E63', gray: '#9E9E9E',
}

const MIXES = [
  { c1: 'red', c2: 'blue', result: 'purple', distractors: ['orange', 'green', 'pink'] },
  { c1: 'red', c2: 'yellow', result: 'orange', distractors: ['purple', 'green', 'pink'] },
  { c1: 'blue', c2: 'yellow', result: 'green', distractors: ['purple', 'orange', 'pink'] },
  { c1: 'red', c2: 'white', result: 'pink', distractors: ['purple', 'orange', 'gray'] },
  { c1: 'black', c2: 'white', result: 'gray', distractors: ['purple', 'pink', 'green'] },
]

const REVERSE_MIXES = {
  purple: ['red', 'blue'],
  orange: ['red', 'yellow'],
  green: ['blue', 'yellow'],
  pink: ['red', 'white'],
  gray: ['black', 'white'],
}

const cmSplitStyles = `
@keyframes cmSplit {
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--split-x), -20px) scale(0.7); opacity: 0.8; }
}
@keyframes cmShake {
  0%,100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-6px); }
  80% { transform: translateX(6px); }
}
@keyframes cmFadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`

const MIX_TOTAL_ROUNDS = 8

function ColorMixingMode({ onBack, t, lang }) {
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [mix, setMix] = useState(null)
  const [options, setOptions] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [selected, setSelected] = useState(null)
  const [mixing, setMixing] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [splitAnim, setSplitAnim] = useState(null) // { color, parts: [c1, c2] }
  const [bonusColors, setBonusColors] = useState([])
  const mounted = useRef(true)

  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])

  const generateMixRound = useCallback((bonus) => {
    const m = MIXES[Math.floor(Math.random() * MIXES.length)]
    const pool = [...m.distractors, ...(bonus || [])]
    const uniquePool = [...new Set(pool)].filter(c => c !== m.result)
    const opts = shuffle([m.result, ...shuffle(uniquePool).slice(0, 2)])
    setMix(m); setOptions(opts); setFeedback(null); setSelected(null); setSplitAnim(null); setMixing(true)
    setTimeout(() => { if (mounted.current) setMixing(false) }, 1500)
    speakPrompt(`${m.c1} plus ${m.c2} makes what color?`, lang).catch(() => {})
  }, [lang])

  useEffect(() => { if (!gameOver) generateMixRound(bonusColors) }, [round, gameOver]) // eslint-disable-line

  const handlePick = useCallback((color) => {
    if (feedback !== null || mixing) return
    setSelected(color)
    if (color === mix.result) {
      setFeedback('correct'); setScore(s => s + 1); playCorrectSound(color, lang)
      setTimeout(() => {
        if (!mounted.current) return
        if (round + 1 >= MIX_TOTAL_ROUNDS) { playLevelUpSound(lang); setGameOver(true) }
        else setRound(r => r + 1)
      }, 1800)
    } else {
      setFeedback('wrong'); playWrongSound(color, lang)
      // Check if the wrong color can split
      const parts = REVERSE_MIXES[color]
      if (parts) {
        setSplitAnim({ color, parts })
        // Add ingredient colors to bonus pool for future rounds
        setBonusColors(prev => {
          const next = [...prev]
          parts.forEach(p => { if (!next.includes(p)) next.push(p) })
          return next
        })
        setTimeout(() => {
          if (!mounted.current) return
          if (round + 1 >= MIX_TOTAL_ROUNDS) setGameOver(true)
          else setRound(r => r + 1)
        }, 2500)
      } else {
        // Base color - just shake
        setTimeout(() => {
          if (!mounted.current) return
          if (round + 1 >= MIX_TOTAL_ROUNDS) setGameOver(true)
          else setRound(r => r + 1)
        }, 1500)
      }
    }
  }, [feedback, mixing, mix, lang, round])

  const restart = () => { setRound(0); setScore(0); setGameOver(false); setBonusColors([]) }

  if (gameOver) {
    const emoji = score >= 7 ? '🎨' : score >= 4 ? '🌈' : '💪'
    const msg = score >= 7 ? 'Color master!' : score >= 4 ? 'Great mixing!' : 'Keep exploring colors!'
    return (
      <div className="result-screen">
        <div className="result-emoji" style={{ fontSize: '80px' }}>{emoji}</div>
        <div className="result-score" style={{ fontSize: '2rem' }}>{score} / {MIX_TOTAL_ROUNDS}</div>
        <div className="result-message">{msg}</div>
        <button className="play-again-btn" onClick={restart}>{t.playAgain}</button>
        <br /><br />
        <button className="play-again-btn" style={{ background: '#aaa' }} onClick={onBack}>{t.home}</button>
      </div>
    )
  }

  if (!mix) return null

  return (
    <>
      <style>{cmSplitStyles}</style>
      <div style={{ textAlign: 'center', fontSize: '18px', color: '#777', margin: '8px 0' }}>
        {t.roundXofY ? t.roundXofY(round + 1, MIX_TOTAL_ROUNDS) : `Round ${round + 1} of ${MIX_TOTAL_ROUNDS}`}
      </div>
      <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#4CAF50', fontWeight: '600' }}>⭐ {score}</div>

      <div style={{ textAlign: 'center', padding: '20px', position: 'relative' }}>
        <div style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px', color: '#333' }}>
          Mix the colors! 🎨
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: mixing ? '0px' : '20px', transition: 'gap 1s ease-in-out', margin: '20px 0' }}>
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%', background: MIX_COLOR_MAP[mix.c1],
            border: mix.c1 === 'white' ? '2px solid #ccc' : 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'transform 1s ease-in-out', transform: mixing ? 'translateX(30px) scale(0.9)' : 'translateX(0) scale(1)', zIndex: 1,
          }} />
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#555', opacity: mixing ? 0 : 1, transition: 'opacity 0.5s', width: mixing ? '0' : 'auto' }}>+</div>
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%', background: MIX_COLOR_MAP[mix.c2],
            border: mix.c2 === 'white' ? '2px solid #ccc' : 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'transform 1s ease-in-out', transform: mixing ? 'translateX(-30px) scale(0.9)' : 'translateX(0) scale(1)', zIndex: 1,
          }} />
        </div>

        {!mixing && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '16px 0' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: feedback === 'correct' ? MIX_COLOR_MAP[mix.result] : 'linear-gradient(135deg, #ddd, #bbb)',
              boxShadow: feedback === 'correct' ? `0 0 30px ${MIX_COLOR_MAP[mix.result]}` : '0 4px 10px rgba(0,0,0,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', color: '#fff',
            }}>
              {feedback === 'correct' ? '✨' : '❓'}
            </div>
          </div>
        )}

        <div style={{ fontSize: '20px', color: '#555', margin: '8px 0' }}>
          <span style={{ fontWeight: 'bold', color: MIX_COLOR_MAP[mix.c1], textShadow: mix.c1 === 'yellow' ? '0 0 2px #999' : 'none' }}>{mix.c1}</span>
          {' + '}
          <span style={{ fontWeight: 'bold', color: MIX_COLOR_MAP[mix.c2], textShadow: mix.c2 === 'white' ? '0 0 2px #999' : 'none' }}>{mix.c2}</span>
          {' = ?'}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', padding: '0 20px' }}>
        {options.map((color, idx) => {
          let border = '3px solid #ddd'
          let transform = 'scale(1)'
          let anim = 'none'
          if (selected === color && feedback === 'correct') { border = '4px solid #4CAF50'; transform = 'scale(1.1)' }
          if (selected === color && feedback === 'wrong') {
            border = '4px solid #f44336'
            if (!REVERSE_MIXES[color]) anim = 'cmShake 0.5s ease'
          }
          if (feedback === 'wrong' && color === mix.result) { border = '4px solid #4CAF50' }
          return (
            <button key={idx} onClick={() => handlePick(color)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
              padding: '14px 20px', borderRadius: '20px', background: '#fff',
              border, cursor: 'pointer', transition: 'transform 0.2s', transform, minWidth: '90px',
              animation: anim,
            }}>
              <div style={{
                width: '50px', height: '50px', borderRadius: '50%', background: MIX_COLOR_MAP[color],
                border: color === 'white' ? '2px solid #ccc' : 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }} />
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#555', textTransform: 'capitalize' }}>{color}</span>
            </button>
          )
        })}
      </div>

      {/* Split animation for wrong answers on compound colors */}
      {splitAnim && (
        <div style={{ textAlign: 'center', margin: '16px', animation: 'cmFadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '8px', position: 'relative', height: '70px' }}>
            {/* Original wrong color circle (fades out) */}
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%', background: MIX_COLOR_MAP[splitAnim.color],
              position: 'absolute', left: '50%', top: '50%', marginLeft: '-30px', marginTop: '-30px',
              opacity: 0, transition: 'opacity 0.5s',
            }} />
            {/* Left split piece */}
            <div style={{
              width: '45px', height: '45px', borderRadius: '50%', background: MIX_COLOR_MAP[splitAnim.parts[0]],
              boxShadow: '0 3px 10px rgba(0,0,0,0.2)', border: splitAnim.parts[0] === 'white' ? '2px solid #ccc' : 'none',
              '--split-x': '-30px',
              animation: 'cmSplit 0.8s ease-out forwards reverse',
            }} />
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#999' }}>+</div>
            {/* Right split piece */}
            <div style={{
              width: '45px', height: '45px', borderRadius: '50%', background: MIX_COLOR_MAP[splitAnim.parts[1]],
              boxShadow: '0 3px 10px rgba(0,0,0,0.2)', border: splitAnim.parts[1] === 'white' ? '2px solid #ccc' : 'none',
              '--split-x': '30px',
              animation: 'cmSplit 0.8s ease-out forwards reverse',
            }} />
          </div>
          <div style={{
            fontSize: '16px', fontWeight: '700', color: '#c62828', padding: '8px 16px',
            background: '#fce4ec', borderRadius: '12px', display: 'inline-block',
          }}>
            💡 <span style={{ textTransform: 'capitalize' }}>{splitAnim.color}</span> splits into{' '}
            <span style={{ color: MIX_COLOR_MAP[splitAnim.parts[0]], textTransform: 'capitalize' }}>{splitAnim.parts[0]}</span>
            {' + '}
            <span style={{ color: MIX_COLOR_MAP[splitAnim.parts[1]], textTransform: 'capitalize' }}>{splitAnim.parts[1]}</span>!
          </div>
          <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>
            The answer was <span style={{ fontWeight: '700', textTransform: 'capitalize', color: MIX_COLOR_MAP[mix.result] }}>{mix.result}</span>
          </div>
        </div>
      )}

      {/* Feedback for correct or wrong without split */}
      {feedback && !splitAnim && (
        <div style={{
          textAlign: 'center', fontSize: '22px', margin: '16px', padding: '12px',
          borderRadius: '16px', fontWeight: 'bold',
          background: feedback === 'correct' ? '#e8f5e9' : '#fce4ec',
          color: feedback === 'correct' ? '#2e7d32' : '#c62828',
        }}>
          {feedback === 'correct' ? `✅ ${mix.c1} + ${mix.c2} = ${mix.result}!` :
           `❌ Try again! It makes ${mix.result}!`}
        </div>
      )}
    </>
  )
}

// ============ MAIN COMPONENT ============
export default function LearnColors({ onBack }) {
  const { t, lang } = useLanguage()
  const [diffLevel, setDiffLevel] = useState(null)

  const DIFFICULTIES = [
    { key: 'easy', label: '🔊 Learn Colors', emoji: '🔊', desc: t.easyColorDesc || 'Voice guides you! Hear the color, then tap it.' },
    { key: 'medium', label: '🎈 Balloon Pop', emoji: '🎈', desc: t.popColorsDesc || 'Pop the right color balloons!' },
    { key: 'splash', label: '🎨 Color Splash', emoji: '🎨', desc: t.colorSplashDesc || 'Splash shapes with the right color!' },
    { key: 'mixing', label: '🌈 Color Mixing', emoji: '🌈', desc: t.colorMixingDesc || 'Mix two colors to make a new one!' },
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
          {DIFFICULTIES.map((d, i) => {
            const bgs = [
              'linear-gradient(135deg, #4CAF50, #66BB6A)',
              'linear-gradient(135deg, #FF9800, #FFB74D)',
              'linear-gradient(135deg, #E91E63, #F06292)',
              'linear-gradient(135deg, #9C27B0, #BA68C8)',
            ]
            return (
              <button key={d.key} onClick={() => setDiffLevel(i)} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                width: '90%', margin: '10px auto', padding: '14px',
                borderRadius: '16px', border: 'none',
                background: bgs[i] || bgs[0],
                color: '#fff', fontSize: '1rem', fontWeight: '700',
                cursor: 'pointer', boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
                textAlign: 'left',
              }}>
                <span style={{ fontSize: '2rem' }}>{d.emoji}</span>
                <div>
                  <div>{d.label}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '400', opacity: 0.9, marginTop: '2px' }}>{d.desc}</div>
                </div>
              </button>
            )
          })}
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
      {diffLevel === 2 && <ColorSplashMode onBack={() => setDiffLevel(null)} t={t} lang={lang} />}
      {diffLevel === 3 && <ColorMixingMode onBack={() => setDiffLevel(null)} t={t} lang={lang} />}
    </div>
  )
}

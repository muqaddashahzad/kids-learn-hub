import { useState, useEffect, useRef, useCallback } from 'react'
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
]

const SHAPE_TYPES = [
  { name: 'Circle' },
  { name: 'Square' },
  { name: 'Triangle' },
  { name: 'Star' },
  { name: 'Heart' },
  { name: 'Diamond' },
]

const SHAPE_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFD700', '#FF8C00', '#9944CC', '#FF69B4', '#44BB44']

function renderShape(shapeName, color, size) {
  switch(shapeName) {
    case 'Circle': return <svg viewBox="0 0 100 100" width={size} height={size}><circle cx="50" cy="50" r="45" fill={color}/></svg>
    case 'Square': return <svg viewBox="0 0 100 100" width={size} height={size}><rect x="10" y="10" width="80" height="80" rx="5" fill={color}/></svg>
    case 'Triangle': return <svg viewBox="0 0 100 100" width={size} height={size}><polygon points="50,5 95,95 5,95" fill={color}/></svg>
    case 'Star': return <svg viewBox="0 0 100 100" width={size} height={size}><polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill={color}/></svg>
    case 'Heart': return <svg viewBox="0 0 100 100" width={size} height={size}><path d="M50,88 C25,65 5,50 5,30 C5,15 15,5 30,5 C40,5 48,12 50,18 C52,12 60,5 70,5 C85,5 95,15 95,30 C95,50 75,65 50,88Z" fill={color}/></svg>
    case 'Diamond': return <svg viewBox="0 0 100 100" width={size} height={size}><polygon points="50,5 95,50 50,95 5,50" fill={color}/></svg>
    default: return <svg viewBox="0 0 100 100" width={size} height={size}><circle cx="50" cy="50" r="45" fill={color}/></svg>
  }
}

// Balloon SVG component at top level

const GAME_DURATIONS = [25, 25, 30] // seconds per difficulty - more time for kids
const SPAWN_INTERVALS = [900, 800, 600] // ms between spawns - more objects to pop
const FALL_SPEEDS = [1.2, 1.8, 2.5] // pixels per frame - much slower for kids

let balloonId = 0

export default function BalloonPop({ mode, onBack }) {
  // mode: 'colors' or 'shapes'
  const { t, lang } = useLanguage()
  const [phase, setPhase] = useState('menu') // menu, countdown, playing, result
  const [diffLevel, setDiffLevel] = useState(0)
  const [target, setTarget] = useState(null)
  const [balloons, setBalloons] = useState([])
  const [score, setScore] = useState(0)
  const [misses, setMisses] = useState(0)
  const [wrongTaps, setWrongTaps] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [countdown, setCountdown] = useState(3)
  const [totalPopped, setTotalPopped] = useState(0)
  const gameRef = useRef(null)
  const frameRef = useRef(null)
  const spawnRef = useRef(null)
  const timerRef = useRef(null)
  const balloonsRef = useRef([])
  const scoreRef = useRef(0)
  const areaRef = useRef(null)

  const isColors = mode === 'colors'
  const gameDuration = GAME_DURATIONS[diffLevel]
  const spawnInterval = SPAWN_INTERVALS[diffLevel]
  const fallSpeed = FALL_SPEEDS[diffLevel]

  const pickTarget = useCallback(() => {
    if (isColors) {
      return COLORS[Math.floor(Math.random() * COLORS.length)]
    } else {
      return SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)]
    }
  }, [isColors])

  const spawnBalloon = useCallback(() => {
    const areaWidth = areaRef.current ? areaRef.current.offsetWidth : 300
    const x = 10 + Math.random() * (areaWidth - 100)
    
    let item
    if (isColors) {
      item = COLORS[Math.floor(Math.random() * COLORS.length)]
    } else {
      item = SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)]
    }
    
    // 50% are target items - more targets = more fun for kids
    if (Math.random() < 0.5 && target) {
      item = target
    }

    const color = isColors ? item.hex : SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)]
    
    balloonId++
    return {
      id: balloonId,
      item,
      color,
      x,
      y: -120,
      // Bigger (65-85px) for easier tapping
      size: 65 + Math.random() * 20,
      speed: fallSpeed * (0.8 + Math.random() * 0.3),
      popped: false,
      wrong: false,
    }
  }, [isColors, target, fallSpeed])

  // Animation loop
  const animate = useCallback(() => {
    balloonsRef.current = balloonsRef.current
      .map(b => ({ ...b, y: b.popped ? b.y : b.y + b.speed }))
      .filter(b => {
        if (b.y > window.innerHeight && !b.popped) {
          // Missed a target balloon
          if (b.item.name === (target?.name)) {
            setMisses(m => m + 1)
          }
          return false
        }
        if (b.popped && b.popTime && Date.now() - b.popTime > 400) return false
        return true
      })
    
    setBalloons([...balloonsRef.current])
    frameRef.current = requestAnimationFrame(animate)
  }, [target])

  const startGame = (diff) => {
    setDiffLevel(diff)
    const newTarget = pickTarget()
    setTarget(newTarget)
    setScore(0)
    setMisses(0)
    setWrongTaps(0)
    setTotalPopped(0)
    scoreRef.current = 0
    balloonsRef.current = []
    setBalloons([])
    setCountdown(3)
    setPhase('countdown')

    // Announce the target
    const targetName = isColors ? (t.colors?.[newTarget.name] || newTarget.name) : (t.shapes?.[newTarget.name] || newTarget.name)
    const phrases = {
      en: isColors ? `Pop all ${targetName} balloons!` : `Pop all ${targetName} shapes!`,
      ur: isColors ? `تمام ${targetName} غبارے پھوڑیں!` : `تمام ${targetName} شکلیں پھوڑیں!`,
      hi: isColors ? `सभी ${targetName} गुब्बारे फोड़ो!` : `सभी ${targetName} आकार फोड़ो!`,
    }
    try {
      const utterance = new SpeechSynthesisUtterance(phrases[lang] || phrases.en)
      utterance.lang = lang === 'ur' ? 'ur-PK' : lang === 'hi' ? 'hi-IN' : 'en-US'
      utterance.rate = 0.9
      utterance.pitch = 1.2
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    } catch(e) {}
  }

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown <= 0) {
      setPhase('playing')
      setTimeLeft(GAME_DURATIONS[diffLevel])
      return
    }
    const tm = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(tm)
  }, [phase, countdown, diffLevel])

  // Game timer
  useEffect(() => {
    if (phase !== 'playing') return
    if (timeLeft <= 0) {
      setPhase('result')
      playLevelUpSound(lang)
      return
    }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timerRef.current)
  }, [phase, timeLeft, lang])

  // Spawn balloons
  useEffect(() => {
    if (phase !== 'playing') return
    spawnRef.current = setInterval(() => {
      const newB = spawnBalloon()
      balloonsRef.current.push(newB)
    }, SPAWN_INTERVALS[diffLevel])
    return () => clearInterval(spawnRef.current)
  }, [phase, spawnBalloon, diffLevel])

  // Animation
  useEffect(() => {
    if (phase !== 'playing') return
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [phase, animate])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(frameRef.current)
      clearInterval(spawnRef.current)
      clearTimeout(timerRef.current)
    }
  }, [])

  const handleTap = (balloon) => {
    if (balloon.popped) return
    
    const isTarget = balloon.item.name === target?.name
    
    // Mark as popped
    balloonsRef.current = balloonsRef.current.map(b => 
      b.id === balloon.id ? { ...b, popped: true, wrong: !isTarget, popTime: Date.now() } : b
    )
    setBalloons([...balloonsRef.current])
    
    if (isTarget) {
      setScore(s => s + 1)
      setTotalPopped(tp => tp + 1)
      scoreRef.current++
      const targetName = isColors ? (t.colors?.[target.name] || target.name) : (t.shapes?.[target.name] || target.name)
      playCorrectSound(targetName, lang)
    } else {
      setWrongTaps(w => w + 1)
      const targetName = isColors ? (t.colors?.[target.name] || target.name) : (t.shapes?.[target.name] || target.name)
      playWrongSound(targetName, lang)
    }
  }

  const targetName = target ? (isColors ? (t.colors?.[target.name] || target.name) : (t.shapes?.[target.name] || target.name)) : ''
  const gameTitle = isColors ? (t.popColors || 'Balloon Pop!') : (t.popShapes || 'Shape Pop!')

  // MENU
  if (phase === 'menu') {
    return (
      <div className="game-screen">
        <div className="game-header">
          <button className="back-btn" onClick={onBack}>←</button>
          <span className="game-title">🎈 {gameTitle}</span>
          <span></span>
        </div>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '10px' }}>🎈</div>
          <div style={{ fontSize: '1.1rem', color: '#555', marginBottom: '20px' }}>
            {isColors 
              ? (t.popColorsDesc || 'Pop only the balloons of the target color!')
              : (t.popShapesDesc || 'Pop only the falling target shapes!')}
          </div>
          <div style={{ fontSize: '0.95rem', color: '#888', marginBottom: '24px' }}>
            {t.chooseDifficulty || 'Choose difficulty:'}
          </div>
          {[0, 1, 2].map(d => (
            <button
              key={d}
              onClick={() => startGame(d)}
              style={{
                display: 'block',
                width: '80%',
                margin: '10px auto',
                padding: '14px',
                borderRadius: '16px',
                border: 'none',
                background: d === 0 ? '#4CAF50' : d === 1 ? '#FFC107' : '#f44336',
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
              }}
            >
              {d === 0 ? '🟢' : d === 1 ? '🟡' : '🔴'} {t[['easy','medium','hard'][d]]} — {GAME_DURATIONS[d]}s
            </button>
          ))}
        </div>
      </div>
    )
  }

  // COUNTDOWN
  if (phase === 'countdown') {
    return (
      <div className="game-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ fontSize: '1.2rem', color: '#555', marginBottom: '12px' }}>
          {isColors ? (t.popTarget || 'Pop all:') : (t.popTarget || 'Pop all:')}
        </div>
        <div style={{ 
          fontSize: '2rem', fontWeight: '700', marginBottom: '20px',
          padding: '12px 24px', borderRadius: '16px',
          background: isColors && target ? target.hex : '#f0f0f0',
          color: (target?.name === 'Yellow' || target?.name === 'White') ? '#222' : '#fff',
          textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          {!isColors && target && renderShape(target.name, '#fff', 40)}
          {targetName}
        </div>
        <div style={{ fontSize: '5rem', fontWeight: '700', color: countdown > 0 ? '#f44336' : '#4CAF50' }}>
          {countdown > 0 ? countdown : (t.go || 'GO!')}
        </div>
      </div>
    )
  }

  // RESULT
  if (phase === 'result') {
    const emoji = score >= 8 ? '🏆' : score >= 5 ? '⭐' : '💪'
    return (
      <div className="game-screen">
        <div className="result-screen">
          <div className="result-emoji">{emoji} 🎈</div>
          <div className="result-score" style={{ fontSize: '2.5rem' }}>{score}</div>
          <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '8px' }}>
            {isColors ? targetName : ''} {isColors ? (t.balloonsPopped || 'balloons popped!') : (t.shapesPopped || 'shapes popped!')}
          </div>
          {wrongTaps > 0 && (
            <div style={{ fontSize: '0.85rem', color: '#e74c3c', marginBottom: '8px' }}>
              ❌ {wrongTaps} {t.wrongPops || 'wrong taps'}
            </div>
          )}
          <button className="play-again-btn" onClick={() => startGame(diffLevel)}>
            {t.playAgain}
          </button>
          <br /><br />
          <button className="play-again-btn" style={{ background: '#aaa' }} onClick={() => setPhase('menu')}>
            {t.chooseDifficulty || 'Choose Difficulty'}
          </button>
          <br /><br />
          <button className="play-again-btn" style={{ background: '#999', fontSize: '0.9rem' }} onClick={onBack}>
            {t.home}
          </button>
        </div>
      </div>
    )
  }

  // PLAYING
  return (
    <div className="game-screen" style={{ overflow: 'hidden', position: 'relative', touchAction: 'none' }}>
      {/* HUD */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 12px', background: 'rgba(255,255,255,0.9)', borderRadius: '0 0 16px 16px',
        position: 'relative', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.85rem', color: '#555' }}>{t.popTarget || 'Pop:'}</span>
          {isColors ? (
            <span style={{
              display: 'inline-block', width: '24px', height: '24px', borderRadius: '50%',
              background: target?.hex, border: '2px solid #ddd',
            }} />
          ) : (
            <span>{target && renderShape(target.name, '#FF6B6B', 24)}</span>
          )}
          <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{targetName}</span>
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: timeLeft <= 5 ? '#f44336' : '#333' }}>
          ⏱️ {timeLeft}s
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#4CAF50' }}>
          ⭐ {score}
        </div>
      </div>

      {/* Game area */}
      <div
        ref={areaRef}
        style={{
          position: 'relative',
          width: '100%',
          height: 'calc(100vh - 60px)',
          overflow: 'hidden',
        }}
      >
        {balloons.map(b => (
          <div
            key={b.id}
            onPointerDown={(e) => { e.preventDefault(); handleTap(b) }}
            style={{
              position: 'absolute',
              left: b.x,
              top: b.y,
              // Extra 20px padding for easier tapping by kids
              padding: '10px',
              margin: '-10px',
              cursor: 'pointer',
              transition: b.popped ? 'transform 0.3s, opacity 0.3s' : 'none',
              transform: b.popped ? 'scale(1.5)' : 'scale(1)',
              opacity: b.popped ? 0 : 1,
              zIndex: 5,
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
          >
            {b.popped && !b.wrong && (
              <div style={{
                position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)',
                fontSize: '1.8rem', zIndex: 20,
              }}>✅</div>
            )}
            {b.popped && b.wrong && (
              <div style={{
                position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)',
                fontSize: '1.8rem', zIndex: 20,
              }}>❌</div>
            )}
            {isColors ? (
              <Balloon color={b.color} size={b.size} />
            ) : (
              <div style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.25))' }}>
                {renderShape(b.item.name, b.color, b.size)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Balloon SVG
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

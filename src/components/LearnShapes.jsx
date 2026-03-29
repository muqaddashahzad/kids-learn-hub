import { useState, useEffect, useCallback, useRef } from 'react'
import { useLanguage } from '../LanguageContext'
import { playCorrectSound, playWrongSound, playLevelUpSound, playPopSound, playCountdownBeep, speakPrompt, speakName } from '../sounds'

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

function renderShape(shapeName, color, size) {
  const s = SHAPES.find(sh => sh.name === shapeName)
  return s ? s.render(color, size) : null
}

const SHAPE_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFD700', '#DDA0DD', '#FF8C00', '#87CEEB', '#FF4444', '#9944CC', '#FF69B4', '#44BB44']
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
  const others = all.filter(s => s.name !== correct.name)
  const picks = shuffle(others).slice(0, count - 1)
  return shuffle([correct, ...picks])
}

function createShapeQueue() { return shuffle([...SHAPES]) }

// ============ EASY MODE: Classic shape quiz with color hint ============
// ============ EASY MODE: Voice says "Choose [shape]" BEFORE child taps ============
function EasyMode({ onBack, onComplete, t, lang }) {
  const [round, setRound] = useState(1)
  const [score, setScore] = useState(0)
  const [currentShape, setCurrentShape] = useState(null)
  const [shapeColor, setShapeColor] = useState(SHAPE_COLORS[0])
  const [optionColors, setOptionColors] = useState({})
  const [options, setOptions] = useState([])
  const [feedback, setFeedback] = useState('')
  const [selected, setSelected] = useState(null)
  const [disabled, setDisabled] = useState(true)
  const [speaking, setSpeaking] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const shapeQueue = useRef([])

  const getNextShape = useCallback(() => {
    if (shapeQueue.current.length === 0) shapeQueue.current = createShapeQueue()
    return shapeQueue.current.pop()
  }, [])

  const newRound = useCallback(async () => {
    const shape = getNextShape()
    const mainColor = SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)]
    const opts = getOptions(shape, SHAPES, 2)
    setCurrentShape(shape); setShapeColor(mainColor)
    const colors = {}
    opts.forEach(opt => {
      if (opt.name === shape.name) {
        colors[opt.name] = mainColor
      } else {
        const available = SHAPE_COLORS.filter(c => c !== mainColor)
        colors[opt.name] = available[Math.floor(Math.random() * available.length)]
      }
    })
    setOptionColors(colors); setOptions(opts)
    setFeedback(''); setSelected(null); setDisabled(true); setSpeaking(true)
    // Voice says "Choose [shape name]" BEFORE enabling buttons
    await speakPrompt(t.shapes[shape.name], lang)
    setSpeaking(false)
    setDisabled(false)
  }, [getNextShape, t, lang])

  useEffect(() => { newRound() }, [])

  const handleAnswer = (opt) => {
    if (disabled) return
    setDisabled(true); setSelected(opt.name)
    if (opt.name === currentShape.name) {
      setScore(s => s + 1); setFeedback(t.shapesCorrect)
      playCorrectSound(t.shapes[currentShape.name], lang)
    } else {
      setFeedback(t.shapesTryAgain(t.shapes[currentShape.name]))
      playWrongSound(t.shapes[currentShape.name], lang)
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
    const msg = finalScore >= 8 ? (t.shapeMaster || 'Shape master!') :
                finalScore >= 5 ? (t.greatEffort || 'Great effort!') :
                (t.goodTry || 'Good try!')
    return (
      <div className="result-screen">
        <div className="result-emoji">{emoji}</div>
        <div className="result-score">{finalScore} / {ROUNDS_PER_LEVEL}</div>
        <div className="result-message">{msg}</div>
        <button className="play-again-btn" onClick={() => {
          setRound(1); setScore(0); setGameOver(false)
          shapeQueue.current = createShapeQueue()
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
          🔊 {t.choosePrompt ? t.choosePrompt(t.shapes[currentShape?.name]) : `Choose ${t.shapes[currentShape?.name]}!`}
        </div>
      )}

      <div className="display-area">
        {currentShape && <div className="shape-display">{currentShape.render(shapeColor, 120)}</div>}
      </div>
      <div className="options-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {options.map(opt => {
          const isSelected = selected === opt.name
          const isCorrect = isSelected && opt.name === currentShape.name
          const isWrong = isSelected && opt.name !== currentShape.name
          return (
            <button key={opt.name}
              className={`option-btn ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '8px', minHeight: '90px', borderRadius: '16px',
                border: isCorrect ? '3px solid #28a745' : isWrong ? '3px solid #ff3333' : '3px solid #e0e0e0',
                background: '#fff', cursor: disabled ? 'default' : 'pointer', transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                opacity: disabled && !isSelected ? 0.6 : 1,
              }}
              onClick={() => handleAnswer(opt)}
            >
              <div style={{ marginBottom: '4px' }}>{opt.render(optionColors[opt.name] || '#999', 50)}</div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#555' }}>{t.shapes[opt.name]}</span>
            </button>
          )
        })}
      </div>
      <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>
        💡 {t.colorHint || 'Hint: matching color = correct shape!'}
      </div>
      {feedback && <div className="feedback">{feedback}</div>}
    </>
  )
}

// ============ MEDIUM MODE: Falling Shape Pop ============
let shapeId = 0

function MediumMode({ onBack, onComplete, t, lang }) {
  const [phase, setPhase] = useState('intro')
  const [target, setTarget] = useState(null)
  const [shapes, setShapes] = useState([])
  const [score, setScore] = useState(0)
  const [wrongTaps, setWrongTaps] = useState(0)
  const [timeLeft, setTimeLeft] = useState(20)
  const [countdown, setCountdown] = useState(3)
  const shapesRef = useRef([])
  const frameRef = useRef(null)
  const spawnRef = useRef(null)
  const timerRef = useRef(null)
  const areaRef = useRef(null)

  const spawnShape = useCallback(() => {
    const areaWidth = areaRef.current ? areaRef.current.offsetWidth : 300
    const x = 10 + Math.random() * (areaWidth - 100)
    let item = SHAPES[Math.floor(Math.random() * SHAPES.length)]
    // 50% chance to be the target - more targets = more fun
    if (Math.random() < 0.5 && target) item = target
    const color = SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)]
    shapeId++
    return {
      id: shapeId, item, color, x, y: -120,
      // Bigger shapes (60-80px) for easier tapping
      size: 60 + Math.random() * 20,
      // Slower speed for kids
      speed: 1.2 * (0.8 + Math.random() * 0.3),
      popped: false, wrong: false, rotation: Math.random() * 360,
    }
  }, [target])

  const startGame = useCallback(() => {
    const t2 = SHAPES[Math.floor(Math.random() * SHAPES.length)]
    setTarget(t2)
    setScore(0); setWrongTaps(0); setTimeLeft(25)
    shapesRef.current = []; setShapes([])
    setCountdown(3); setPhase('countdown')
    try {
      const name = t.shapes[t2.name] || t2.name
      const utterance = new SpeechSynthesisUtterance(
        lang === 'ur' ? `تمام ${name} شکلیں پھوڑیں!` :
        lang === 'hi' ? `सभी ${name} आकार फोड़ो!` :
        `Pop all ${name} shapes!`
      )
      utterance.lang = lang === 'ur' ? 'ur-PK' : lang === 'hi' ? 'hi-IN' : 'en-US'
      utterance.rate = 0.9; utterance.pitch = 1.15
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    } catch(e) {}
  }, [lang, t])

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
    spawnRef.current = setInterval(() => { shapesRef.current.push(spawnShape()) }, 800)
    return () => clearInterval(spawnRef.current)
  }, [phase, spawnShape])

  const animate = useCallback(() => {
    shapesRef.current = shapesRef.current
      .map(s => ({ ...s, y: s.popped ? s.y : s.y + s.speed, rotation: s.rotation + 0.5 }))
      .filter(s => {
        if (s.y > window.innerHeight && !s.popped) return false
        if (s.popped && s.popTime && Date.now() - s.popTime > 400) return false
        return true
      })
    setShapes([...shapesRef.current])
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

  const handleTap = (s) => {
    if (s.popped) return
    const isTarget = s.item.name === target?.name
    shapesRef.current = shapesRef.current.map(sh =>
      sh.id === s.id ? { ...sh, popped: true, wrong: !isTarget, popTime: Date.now() } : sh
    )
    setShapes([...shapesRef.current])
    if (isTarget) { setScore(sc => sc + 1); playPopSound(); speakName(t.shapes[target.name], lang) }
    else { setWrongTaps(w => w + 1); playWrongSound(t.shapes[target.name], lang) }
  }

  const targetName = target ? (t.shapes[target.name] || target.name) : ''

  if (phase === 'countdown') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ fontSize: '1.2rem', color: '#555', marginBottom: '12px' }}>{t.popTarget || 'Pop all:'}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem', fontWeight: '700', marginBottom: '20px' }}>
          {target && renderShape(target.name, '#FF6B6B', 50)}
          <span>{targetName}</span>
        </div>
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
        <div className="result-emoji">{emoji}</div>
        <div className="result-score" style={{ fontSize: '2.5rem' }}>{score}</div>
        <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '8px' }}>
          {targetName} {t.shapesPopped || 'shapes popped!'}
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
          {target && renderShape(target.name, '#FF6B6B', 24)}
          <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{targetName}</span>
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: timeLeft <= 5 ? '#f44336' : '#333' }}>
          ⏱️ {timeLeft}s
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#4CAF50' }}>⭐ {score}</div>
      </div>
      <div ref={areaRef} style={{ position: 'relative', width: '100%', height: 'calc(100vh - 140px)', overflow: 'hidden' }}>
        {shapes.map(s => (
          <div key={s.id}
            onPointerDown={(e) => { e.preventDefault(); handleTap(s) }}
            style={{
              position: 'absolute', left: s.x, top: s.y,
              // Extra 20px padding for easier tapping by kids
              padding: '20px', margin: '-20px',
              cursor: 'pointer',
              transition: s.popped ? 'transform 0.3s, opacity 0.3s' : 'none',
              // Reduced rotation wobble (from 15deg to 5deg) so shapes are easier to tap
              transform: s.popped ? 'scale(1.5)' : `rotate(${Math.sin(s.rotation * 0.03) * 5}deg)`,
              opacity: s.popped ? 0 : 1, zIndex: 5, userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.25))',
          }}>
            {s.popped && !s.wrong && <div style={{ position: 'absolute', top: '0px', left: '50%', transform: 'translateX(-50%)', fontSize: '1.8rem', zIndex: 20 }}>✅</div>}
            {s.popped && s.wrong && <div style={{ position: 'absolute', top: '0px', left: '50%', transform: 'translateX(-50%)', fontSize: '1.8rem', zIndex: 20 }}>❌</div>}
            {renderShape(s.item.name, s.color, s.size)}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ HARD MODE: Shape Builder Challenge ============
// Kids see a target shape made of dots/outline and must trace/tap the correct pieces
function HardMode({ onBack, onComplete, t, lang }) {
  const [round, setRound] = useState(1)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState('playing') // playing, done
  const [targetShape, setTargetShape] = useState(null)
  const [silhouettes, setSilhouettes] = useState([])
  const [selected, setSelected] = useState(null)
  const [disabled, setDisabled] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [timer, setTimer] = useState(8)
  const [streak, setStreak] = useState(0)
  const timerRef = useRef(null)
  const totalRounds = 12

  const initRound = useCallback(() => {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)]
    setTargetShape(shape)
    // Create 4 silhouette options with random rotations and colors
    const opts = getOptions(shape, SHAPES, 4)
    const silColors = shuffle([...SHAPE_COLORS])
    setSilhouettes(opts.map((s, i) => ({
      ...s, color: silColors[i],
      rotation: Math.floor(Math.random() * 4) * 90,
      scale: 0.85 + Math.random() * 0.3,
    })))
    setSelected(null); setDisabled(false); setFeedback(''); setTimer(8)
  }, [])

  useEffect(() => { initRound() }, [initRound])

  // Timer
  useEffect(() => {
    if (phase !== 'playing' || disabled) return
    if (timer <= 0) {
      setDisabled(true); setStreak(0)
      setFeedback(t.shapesTryAgain(t.shapes[targetShape.name]))
      playWrongSound(t.shapes[targetShape.name], lang)
      setTimeout(() => {
        if (round >= totalRounds) { setPhase('done'); playLevelUpSound(lang) }
        else { setRound(r => r + 1); initRound() }
      }, 1200)
      return
    }
    timerRef.current = setTimeout(() => setTimer(tl => tl - 1), 1000)
    return () => clearTimeout(timerRef.current)
  }, [phase, timer, disabled])

  const handleAnswer = (s) => {
    if (disabled) return
    setDisabled(true); setSelected(s.name)
    clearTimeout(timerRef.current)
    if (s.name === targetShape.name) {
      const bonus = timer >= 6 ? 3 : timer >= 3 ? 2 : 1 // speed bonus
      setScore(sc => sc + bonus); setStreak(st => st + 1)
      setFeedback(`${t.correct} +${bonus}`)
      playCorrectSound(t.shapes[targetShape.name], lang)
    } else {
      setStreak(0)
      setFeedback(t.shapesTryAgain(t.shapes[targetShape.name]))
      playWrongSound(t.shapes[targetShape.name], lang)
    }
    setTimeout(() => {
      if (round >= totalRounds) { setPhase('done'); playLevelUpSound(lang) }
      else { setRound(r => r + 1); initRound() }
    }, 1200)
  }

  if (phase === 'done') {
    const maxScore = totalRounds * 3
    const pct = score / maxScore
    const emoji = pct >= 0.7 ? '🏆' : pct >= 0.4 ? '⭐' : '💪'
    const stars = pct >= 0.7 ? 3 : pct >= 0.4 ? 2 : 1
    return (
      <div className="result-screen">
        <div className="result-emoji">{emoji}</div>
        <div className="result-score" style={{ fontSize: '2rem' }}>{'⭐'.repeat(stars)}</div>
        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#333', marginBottom: '4px' }}>
          {score} {t.score || 'points'}
        </div>
        <div className="result-message">
          {stars === 3 ? (t.shapeMaster || 'Shape master!') :
           stars === 2 ? (t.greatEffort || 'Great effort!') :
           (t.goodTry || 'Good try!')}
        </div>
        <button className="play-again-btn" onClick={() => { setRound(1); setScore(0); setPhase('playing'); initRound() }}>
          {t.playAgain}
        </button>
        <br /><br />
        <button className="play-again-btn" style={{ background: '#aaa' }} onClick={onBack}>{t.home}</button>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 12px', fontSize: '0.85rem', color: '#555' }}>
        <span>⚡ {t.roundXofY(round, totalRounds)}</span>
        <span style={{ color: timer <= 3 ? '#f44336' : '#666', fontWeight: '700' }}>⏱️ {timer}s</span>
        <span>⭐ {score}</span>
      </div>
      {streak >= 3 && (
        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#FF8C00', fontWeight: '700' }}>
          🔥 {streak} {t.streakLabel || 'streak!'}
        </div>
      )}
      {/* Target shape - shown as dotted outline */}
      <div style={{ textAlign: 'center', margin: '12px 0' }}>
        <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '8px' }}>
          {t.findShape || 'Find this shape:'}
        </div>
        <div style={{
          display: 'inline-block', padding: '16px', borderRadius: '20px',
          background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)', border: '3px dashed #adb5bd',
        }}>
          {targetShape && (
            <div style={{ opacity: 0.6, filter: 'grayscale(100%)' }}>
              {targetShape.render('#555', 90)}
            </div>
          )}
        </div>
        {targetShape && (
          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#333', marginTop: '8px' }}>
            {t.shapes[targetShape.name]}
          </div>
        )}
      </div>
      {/* Options - colorful, some rotated to make it harder */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px',
        padding: '0 16px', maxWidth: '360px', margin: '0 auto',
      }}>
        {silhouettes.map((s, i) => {
          const isSelected = selected === s.name
          const isCorrect = isSelected && s.name === targetShape.name
          const isWrong = isSelected && s.name !== targetShape.name
          return (
            <button key={i} onClick={() => handleAnswer(s)} style={{
              padding: '12px', borderRadius: '16px', border: 'none',
              background: isCorrect ? '#e8f5e9' : isWrong ? '#fbe9e7' : '#fff',
              boxShadow: isCorrect ? '0 0 15px rgba(76,175,80,0.4)' : isWrong ? '0 0 15px rgba(244,67,54,0.3)' : '0 3px 10px rgba(0,0,0,0.1)',
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              outline: isCorrect ? '3px solid #4CAF50' : isWrong ? '3px solid #f44336' : 'none',
            }}>
              <div style={{ transform: `rotate(${s.rotation}deg) scale(${s.scale})`, transition: 'transform 0.3s' }}>
                {s.render(s.color, 55)}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#555', marginTop: '4px' }}>
                {t.shapes[s.name]}
              </span>
            </button>
          )
        })}
      </div>
      {feedback && <div className="feedback">{feedback}</div>}
    </>
  )
}

// ============ MAIN COMPONENT ============
export default function LearnShapes({ onBack }) {
  const { t, lang } = useLanguage()
  const [diffLevel, setDiffLevel] = useState(null)

  const DIFFICULTIES = [
    { key: 'easy', label: '🟢', emoji: '🔊', desc: t.easyShapeDesc || 'Voice guides you! Hear the shape, then tap it.' },
    { key: 'medium', label: '🟡', emoji: '🎈', desc: t.popShapesDesc || 'Pop the right falling shapes!' },
    { key: 'hard', label: '🔴', emoji: '⚡', desc: t.shapeChallengeDesc || 'Speed shape challenge with timer!' },
  ]

  if (diffLevel === null) {
    return (
      <div className="game-screen">
        <div className="game-header">
          <button className="back-btn" onClick={onBack}>←</button>
          <span className="game-title">⭐ {t.learnShapes}</span>
          <span></span>
        </div>
        <div style={{ textAlign: 'center', padding: '16px 12px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>⭐</div>
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
        <span className="game-title">⭐ {t.learnShapes} - {DIFFICULTIES[diffLevel].label} {t[DIFFICULTIES[diffLevel].key]}</span>
        <span></span>
      </div>

      {diffLevel === 0 && <EasyMode onBack={() => setDiffLevel(null)} onComplete={() => {}} t={t} lang={lang} />}
      {diffLevel === 1 && <MediumMode onBack={() => setDiffLevel(null)} onComplete={() => {}} t={t} lang={lang} />}
      {diffLevel === 2 && <HardMode onBack={() => setDiffLevel(null)} onComplete={() => {}} t={t} lang={lang} />}
    </div>
  )
}

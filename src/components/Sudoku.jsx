import { useState, useEffect, useRef, useCallback } from 'react'
import { useLanguage } from '../LanguageContext'

// Sudoku generator
function generateSolved(size) {
  const grid = Array.from({ length: size }, () => Array(size).fill(0))
  const boxH = size === 4 ? 2 : size === 6 ? 2 : 3
  const boxW = size === 4 ? 2 : size === 6 ? 3 : 3

  function isValid(grid, row, col, num) {
    for (let i = 0; i < size; i++) {
      if (grid[row][i] === num || grid[i][col] === num) return false
    }
    const br = Math.floor(row / boxH) * boxH
    const bc = Math.floor(col / boxW) * boxW
    for (let r = br; r < br + boxH; r++) {
      for (let c = bc; c < bc + boxW; c++) {
        if (grid[r][c] === num) return false
      }
    }
    return true
  }

  function solve(grid) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 0) {
          const nums = shuffle([...Array(size)].map((_, i) => i + 1))
          for (const n of nums) {
            if (isValid(grid, r, c, n)) {
              grid[r][c] = n
              if (solve(grid)) return true
              grid[r][c] = 0
            }
          }
          return false
        }
      }
    }
    return true
  }

  solve(grid)
  return grid
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function createPuzzle(size, difficulty) {
  const solved = generateSolved(size)
  const puzzle = solved.map(r => [...r])

  const total = size * size
  let remove
  if (size === 4) remove = difficulty === 'easy' ? 6 : 8
  else if (size === 6) remove = difficulty === 'medium' ? 16 : 20
  else remove = difficulty === 'hard' ? 45 : 40

  const positions = shuffle([...Array(total)].map((_, i) => i))
  for (let i = 0; i < remove && i < positions.length; i++) {
    const r = Math.floor(positions[i] / size)
    const c = positions[i] % size
    puzzle[r][c] = 0
  }

  return { puzzle, solved }
}

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function Sudoku({ onBack }) {
  const { t } = useLanguage()
  const [difficulty, setDifficulty] = useState(null)
  const [size, setSize] = useState(4)
  const [puzzle, setPuzzle] = useState(null)
  const [solved, setSolved] = useState(null)
  const [board, setBoard] = useState(null)
  const [given, setGiven] = useState(null)
  const [selected, setSelected] = useState(null)
  const [timer, setTimer] = useState(0)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [running])

  const startGame = (diff, sz) => {
    setDifficulty(diff)
    setSize(sz)
    const { puzzle: p, solved: s } = createPuzzle(sz, diff)
    setPuzzle(p)
    setSolved(s)
    setBoard(p.map(r => [...r]))
    setGiven(p.map(r => r.map(c => c !== 0)))
    setSelected(null)
    setTimer(0)
    setRunning(true)
    setMessage(null)
  }

  const handleCellClick = (r, c) => {
    if (given && given[r][c]) return
    setSelected({ r, c })
  }

  const handleNumber = (num) => {
    if (!selected || !board) return
    const { r, c } = selected
    if (given[r][c]) return
    const newBoard = board.map(row => [...row])
    newBoard[r][c] = num
    setBoard(newBoard)
    setMessage(null)
  }

  const handleClear = () => {
    if (!selected || !board) return
    const { r, c } = selected
    if (given[r][c]) return
    const newBoard = board.map(row => [...row])
    newBoard[r][c] = 0
    setBoard(newBoard)
  }

  const checkSolution = () => {
    if (!board || !solved) return
    let correct = true
    let incomplete = false
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c] === 0) { incomplete = true; correct = false }
        else if (board[r][c] !== solved[r][c]) correct = false
      }
    }
    if (correct) {
      setRunning(false)
      setMessage({ type: 'success', text: `🎉 You solved it in ${formatTime(timer)}!` })
      const key = `sudoku-${difficulty}`
      const saved = JSON.parse(localStorage.getItem('kidslearn-sudoku') || '{}')
      if (!saved[key] || timer < saved[key]) {
        saved[key] = timer
        localStorage.setItem('kidslearn-sudoku', JSON.stringify(saved))
      }
    } else if (incomplete) {
      setMessage({ type: 'error', text: '🤔 Not complete yet! Fill all cells.' })
    } else {
      setMessage({ type: 'error', text: '😊 Some numbers are wrong. Keep trying!' })
    }
  }

  const newGame = () => {
    setRunning(false)
    clearInterval(timerRef.current)
    setDifficulty(null)
    setMessage(null)
  }

  const boxH = size === 4 ? 2 : size === 6 ? 2 : 3
  const boxW = size === 4 ? 2 : size === 6 ? 3 : 3

  const isHighlighted = (r, c) => {
    if (!selected) return false
    if (r === selected.r || c === selected.c) return true
    const br1 = Math.floor(r / boxH) * boxH
    const bc1 = Math.floor(c / boxW) * boxW
    const br2 = Math.floor(selected.r / boxH) * boxH
    const bc2 = Math.floor(selected.c / boxW) * boxW
    return br1 === br2 && bc1 === bc2
  }

  const hasError = (r, c) => {
    if (!board || board[r][c] === 0) return false
    return board[r][c] !== solved[r][c]
  }

  // Difficulty selection
  if (!difficulty) {
    return (
      <div className="sudoku-screen">
        <div className="game-header">
          <button className="back-btn" onClick={onBack}>←</button>
          <span className="game-title">🧩 {t.sudoku}</span>
          <span></span>
        </div>
        <div style={{ marginTop: '20px', fontSize: '1.1rem', color: '#666' }}>{t.chooseDifficulty}</div>
        <div className="difficulty-select">
          <button className="diff-btn easy" onClick={() => startGame('easy', 4)}>
            🟢 {t.easy} (4×4)<br /><small style={{ color: '#888' }}>{t.ages612}</small>
          </button>
          <button className="diff-btn medium" onClick={() => startGame('medium', 6)}>
            🟡 {t.medium} (6×6)<br /><small style={{ color: '#888' }}>{t.ages612}</small>
          </button>
          <button className="diff-btn hard" onClick={() => startGame('hard', 9)}>
            🔴 {t.hard} (9×9)<br /><small style={{ color: '#888' }}>{t.ages612}</small>
          </button>
        </div>
      </div>
    )
  }

  const cellSize = size === 9 ? 36 : size === 6 ? 44 : 56

  return (
    <div className="sudoku-screen">
      <div className="game-header">
        <button className="back-btn" onClick={newGame}>←</button>
        <span className="game-title">🧩 {size}×{size}</span>
        <span className="timer">⏱ {formatTime(timer)}</span>
      </div>

      <div
        className="sudoku-board"
        style={{ gridTemplateColumns: `repeat(${size}, ${cellSize}px)` }}
      >
        {board && board.map((row, r) =>
          row.map((val, c) => {
            const isSelected = selected && selected.r === r && selected.c === c
            const classes = [
              'sudoku-cell',
              given[r][c] ? 'given' : 'user-input',
              isSelected ? 'selected' : '',
              !isSelected && isHighlighted(r, c) ? 'highlighted' : '',
              hasError(r, c) ? 'error' : '',
              (c + 1) % boxW === 0 && c < size - 1 ? 'box-border-right' : '',
              (r + 1) % boxH === 0 && r < size - 1 ? 'box-border-bottom' : '',
            ].filter(Boolean).join(' ')

            return (
              <button
                key={`${r}-${c}`}
                className={classes}
                style={{ width: cellSize, height: cellSize, fontSize: cellSize > 40 ? '1.2rem' : '1rem' }}
                onClick={() => handleCellClick(r, c)}
              >
                {val || ''}
              </button>
            )
          })
        )}
      </div>

      <div className="number-pad">
        {[...Array(size)].map((_, i) => (
          <button key={i + 1} className="num-btn" onClick={() => handleNumber(i + 1)}>
            {i + 1}
          </button>
        ))}
        <button className="num-btn clear" onClick={handleClear}>✕</button>
      </div>

      <div className="sudoku-controls">
        <button onClick={checkSolution}>✅ Check</button>
        <button onClick={() => startGame(difficulty, size)}>🔄 New</button>
        <button onClick={newGame}>📋 Level</button>
      </div>

      {message && (
        <div className={`sudoku-message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  )
}

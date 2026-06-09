import React, { useState, useEffect, useCallback } from 'react'
import './Sudoku.css'

interface SudokuProps {
  onBack: () => void
}

type SudokuGrid = (number | null)[][]
type Difficulty = 'easy' | 'medium' | 'hard'

const difficultySettings = {
  easy: 40,    // 40 clues (easier)
  medium: 30,  // 30 clues 
  hard: 20     // 20 clues (harder)
}

const Sudoku: React.FC<SudokuProps> = ({ onBack }) => {
  const [grid, setGrid] = useState<SudokuGrid>(Array(9).fill(null).map(() => Array(9).fill(null)))
  const [initialGrid, setInitialGrid] = useState<SudokuGrid>(Array(9).fill(null).map(() => Array(9).fill(null)))
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [gameWon, setGameWon] = useState(false)
  const [errors, setErrors] = useState<Set<string>>(new Set())
  const [hints, setHints] = useState(3)
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  // Generate a valid complete Sudoku grid
  const generateCompleteGrid = (): SudokuGrid => {
    const grid: SudokuGrid = Array(9).fill(null).map(() => Array(9).fill(null))
    
    const isValidMove = (grid: SudokuGrid, row: number, col: number, num: number): boolean => {
      // Check row
      for (let x = 0; x < 9; x++) {
        if (grid[row][x] === num) return false
      }
      
      // Check column
      for (let x = 0; x < 9; x++) {
        if (grid[x][col] === num) return false
      }
      
      // Check 3x3 box
      const startRow = row - (row % 3)
      const startCol = col - (col % 3)
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (grid[i + startRow][j + startCol] === num) return false
        }
      }
      
      return true
    }
    
    const fisherYatesShuffle = (array: number[]) => {
      const shuffled = [...array]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled
    }

    const fillGrid = (grid: SudokuGrid): boolean => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === null) {
            const numbers = fisherYatesShuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
            for (const num of numbers) {
              if (isValidMove(grid, row, col, num)) {
                grid[row][col] = num
                if (fillGrid(grid)) return true
                grid[row][col] = null
              }
            }
            return false
          }
        }
      }
      return true
    }
    
    fillGrid(grid)
    return grid
  }

  // Remove numbers from complete grid to create puzzle
  const createPuzzle = (completeGrid: SudokuGrid, clues: number): SudokuGrid => {
    const puzzle = completeGrid.map(row => [...row])
    const totalCells = 81
    const cellsToRemove = totalCells - clues
    
    let removed = 0
    while (removed < cellsToRemove) {
      const row = Math.floor(Math.random() * 9)
      const col = Math.floor(Math.random() * 9)
      
      if (puzzle[row][col] !== null) {
        puzzle[row][col] = null
        removed++
      }
    }
    
    return puzzle
  }

  const generateNewPuzzle = useCallback(() => {
    const completeGrid = generateCompleteGrid()
    const clues = difficultySettings[difficulty]
    const puzzle = createPuzzle(completeGrid, clues)
    
    setGrid(puzzle.map(row => [...row]))
    setInitialGrid(puzzle.map(row => [...row]))
    setGameWon(false)
    setErrors(new Set())
    setHints(3)
    setTimer(0)
    setIsTimerRunning(true)
  }, [difficulty])

  const isValidNumber = (grid: SudokuGrid, row: number, col: number, num: number): boolean => {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (x !== col && grid[row][x] === num) return false
    }
    
    // Check column
    for (let x = 0; x < 9; x++) {
      if (x !== row && grid[x][col] === num) return false
    }
    
    // Check 3x3 box
    const startRow = Math.floor(row / 3) * 3
    const startCol = Math.floor(col / 3) * 3
    for (let i = startRow; i < startRow + 3; i++) {
      for (let j = startCol; j < startCol + 3; j++) {
        if ((i !== row || j !== col) && grid[i][j] === num) return false
      }
    }
    
    return true
  }

  const handleCellClick = (row: number, col: number) => {
    if (initialGrid[row][col] !== null || gameWon) return
    setSelectedCell({ row, col })
  }

  const handleNumberInput = (num: number) => {
    if (!selectedCell || gameWon) return
    
    const { row, col } = selectedCell
    if (initialGrid[row][col] !== null) return
    
    const newGrid = grid.map(r => [...r])
    const errorKey = `${row}-${col}`
    const newErrors = new Set(errors)
    
    if (num === 0) {
      newGrid[row][col] = null
      newErrors.delete(errorKey)
    } else {
      newGrid[row][col] = num
      
      if (!isValidNumber(newGrid, row, col, num)) {
        newErrors.add(errorKey)
      } else {
        newErrors.delete(errorKey)
      }
    }
    
    setGrid(newGrid)
    setErrors(newErrors)
    
    // Check if puzzle is complete
    if (newErrors.size === 0 && newGrid.every(row => row.every(cell => cell !== null))) {
      setGameWon(true)
      setIsTimerRunning(false)
    }
  }

  const getHint = () => {
    if (hints <= 0 || gameWon) return
    
    const emptyCells: { row: number; col: number }[] = []
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === null) {
          emptyCells.push({ row, col })
        }
      }
    }
    
    if (emptyCells.length === 0) return
    
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)]
    const { row, col } = randomCell
    
    // Find the correct number for this cell
    for (let num = 1; num <= 9; num++) {
      const testGrid = grid.map(r => [...r])
      testGrid[row][col] = num
      if (isValidNumber(testGrid, row, col, num)) {
        const newGrid = grid.map(r => [...r])
        newGrid[row][col] = num
        setGrid(newGrid)
        setHints(prev => prev - 1)
        break
      }
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    generateNewPuzzle()
  }, [generateNewPuzzle])

  useEffect(() => {
    let interval: number
    if (isTimerRunning && !gameWon) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, gameWon])

  return (
    <div className="sudoku-game">
      <div className="game-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Hub
        </button>
        <h1>Sudoku</h1>
        <div className="game-controls">
          <select 
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="difficulty-select"
          >
            <option value="easy">🟢 Easy</option>
            <option value="medium">🟡 Medium</option>
            <option value="hard">🔴 Hard</option>
          </select>
        </div>
      </div>

      <div className="game-info">
        <div className="info-item">
          <span className="info-label">Time</span>
          <span className="info-value">{formatTime(timer)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Hints</span>
          <span className="info-value">{hints}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Difficulty</span>
          <span className="info-value">{difficulty}</span>
        </div>
      </div>

      <div className="game-container">
        <div className="sudoku-grid">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="sudoku-row">
              {row.map((cell, colIndex) => {
                const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                const isInitial = initialGrid[rowIndex][colIndex] !== null
                const hasError = errors.has(`${rowIndex}-${colIndex}`)
                const isHighlighted = selectedCell && (
                  selectedCell.row === rowIndex || 
                  selectedCell.col === colIndex ||
                  (Math.floor(selectedCell.row / 3) === Math.floor(rowIndex / 3) && 
                   Math.floor(selectedCell.col / 3) === Math.floor(colIndex / 3))
                )
                
                return (
                  <div
                    key={colIndex}
                    className={`
                      sudoku-cell 
                      ${isSelected ? 'selected' : ''}
                      ${isInitial ? 'initial' : 'user-input'}
                      ${hasError ? 'error' : ''}
                      ${isHighlighted ? 'highlighted' : ''}
                    `}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {cell || ''}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div className="number-pad">
          <div className="number-buttons">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                className="number-btn"
                onClick={() => handleNumberInput(num)}
                disabled={!selectedCell || initialGrid[selectedCell.row][selectedCell.col] !== null}
              >
                {num}
              </button>
            ))}
          </div>
          <div className="action-buttons">
            <button
              className="clear-btn"
              onClick={() => handleNumberInput(0)}
              disabled={!selectedCell}
            >
              Clear
            </button>
            <button
              className="hint-btn"
              onClick={getHint}
              disabled={hints <= 0 || gameWon}
            >
              💡 Hint ({hints})
            </button>
          </div>
        </div>
      </div>

      {gameWon && (
        <div className="win-overlay">
          <div className="win-content">
            <h2>🎉 Congratulations!</h2>
            <p>You solved the Sudoku puzzle!</p>
            <p>Time: {formatTime(timer)}</p>
            <p>Difficulty: {difficulty}</p>
            <button className="btn btn-primary" onClick={generateNewPuzzle}>
              New Puzzle
            </button>
          </div>
        </div>
      )}

      <div className="game-actions">
        <button className="btn btn-secondary" onClick={generateNewPuzzle}>
          🔄 New Puzzle
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={() => setIsTimerRunning(!isTimerRunning)}
        >
          {isTimerRunning ? '⏸️ Pause' : '▶️ Resume'}
        </button>
      </div>
    </div>
  )
}

export default Sudoku
import React, { useState, useEffect, useCallback, useRef } from 'react'
import './Snake.css'

interface SnakeProps {
  onBack: () => void
}

interface Position {
  x: number
  y: number
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type GameState = 'playing' | 'paused' | 'gameOver' | 'starting'

const speedSettings = {
  easy: 200,
  medium: 150,
  hard: 100
}

const Snake: React.FC<SnakeProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>('starting')
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }])
  const [food, setFood] = useState<Position>({ x: 15, y: 15 })
  const [direction, setDirection] = useState<Direction>('RIGHT')
  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snakeHighScore')
    const parsed = saved ? parseInt(saved, 10) : 0
    return isNaN(parsed) ? 0 : parsed
  })
  const highScoreRef = useRef(highScore)
  highScoreRef.current = highScore
  const [speed, setSpeed] = useState(150)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')

  const GRID_SIZE = 20
  const CANVAS_SIZE = 400

  const generateFood = useCallback((snakeBody: Position[]): Position => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
        y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE))
      }
    } while (snakeBody.some(segment => segment.x === newFood.x && segment.y === newFood.y))
    return newFood
  }, [])

  const resetGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }]
    setSnake(initialSnake)
    setFood(generateFood(initialSnake))
    setDirection('RIGHT')
    setNextDirection('RIGHT')
    setScore(0)
    setSpeed(speedSettings[difficulty])
    setGameState('starting')
  }, [difficulty, generateFood])

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    const isGameKey = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(event.code)
    if (!isGameKey) return
    event.preventDefault()
    
    if (gameState === 'starting') {
      if (event.code === 'Space') {
        setGameState('playing')
      }
      return
    }

    if (gameState === 'gameOver') {
      if (event.code === 'Space') {
        resetGame()
        setGameState('playing')
      }
      return
    }

    if (gameState === 'playing') {
      if (event.code === 'Space') {
        setGameState('paused')
        return
      }
    }

    if (gameState === 'paused') {
      if (event.code === 'Space') {
        setGameState('playing')
        return
      }
    }

    const keyToDirection: { [key: string]: Direction } = {
      'ArrowUp': 'UP',
      'ArrowDown': 'DOWN',
      'ArrowLeft': 'LEFT',
      'ArrowRight': 'RIGHT',
      'KeyW': 'UP',
      'KeyS': 'DOWN',
      'KeyA': 'LEFT',
      'KeyD': 'RIGHT'
    }

    const newDirection = keyToDirection[event.code]
    if (newDirection) {
      // Prevent reverse direction
      const opposites: { [key in Direction]: Direction } = {
        'UP': 'DOWN',
        'DOWN': 'UP',
        'LEFT': 'RIGHT',
        'RIGHT': 'LEFT'
      }
      
      if (opposites[direction] !== newDirection) {
        setNextDirection(newDirection)
      }
    }
  }, [direction, gameState, resetGame])

  const moveSnake = useCallback(() => {
    if (gameState !== 'playing') return

    setDirection(nextDirection)

    setSnake(currentSnake => {
      const newSnake = [...currentSnake]
      const head = { ...newSnake[0] }

      // Move head based on direction
      switch (nextDirection) {
        case 'UP':
          head.y -= 1
          break
        case 'DOWN':
          head.y += 1
          break
        case 'LEFT':
          head.x -= 1
          break
        case 'RIGHT':
          head.x += 1
          break
      }

      // Check wall collision
      if (head.x < 0 || head.x >= CANVAS_SIZE / GRID_SIZE || 
          head.y < 0 || head.y >= CANVAS_SIZE / GRID_SIZE) {
        setGameState('gameOver')
        return currentSnake
      }

      newSnake.unshift(head)

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => {
          const newScore = prev + 10
          if (newScore > highScoreRef.current) {
            setHighScore(newScore)
            localStorage.setItem('snakeHighScore', newScore.toString())
          }
          return newScore
        })
        
        setFood(generateFood(newSnake))
        
        // Increase speed slightly
        setSpeed(prev => Math.max(prev - 2, 80))
      } else {
        newSnake.pop()
      }

      // Check self collision (after pop to avoid false positive with tail)
      if (newSnake.some((segment, i) => i > 0 && segment.x === head.x && segment.y === head.y)) {
        setGameState('gameOver')
        return currentSnake
      }

      return newSnake
    })
  }, [gameState, nextDirection, food, generateFood])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    gradient.addColorStop(0, '#f0f9ff')
    gradient.addColorStop(1, '#e0f2fe')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Draw grid
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.1)'
    ctx.lineWidth = 1
    for (let i = 0; i <= CANVAS_SIZE; i += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, CANVAS_SIZE)
      ctx.stroke()
      
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(CANVAS_SIZE, i)
      ctx.stroke()
    }

    // Draw snake
    snake.forEach((segment, index) => {
      const x = segment.x * GRID_SIZE
      const y = segment.y * GRID_SIZE

      if (index === 0) {
        // Snake head
        const headGradient = ctx.createRadialGradient(x + GRID_SIZE/2, y + GRID_SIZE/2, 0, x + GRID_SIZE/2, y + GRID_SIZE/2, GRID_SIZE/2)
        headGradient.addColorStop(0, '#3b82f6')
        headGradient.addColorStop(1, '#1e40af')
        ctx.fillStyle = headGradient
        ctx.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2)
        
        // Eyes
        ctx.fillStyle = 'white'
        ctx.fillRect(x + 4, y + 4, 3, 3)
        ctx.fillRect(x + GRID_SIZE - 7, y + 4, 3, 3)
        ctx.fillStyle = 'black'
        ctx.fillRect(x + 5, y + 5, 1, 1)
        ctx.fillRect(x + GRID_SIZE - 6, y + 5, 1, 1)
      } else {
        // Snake body
        const bodyGradient = ctx.createLinearGradient(x, y, x + GRID_SIZE, y + GRID_SIZE)
        bodyGradient.addColorStop(0, '#0ea5e9')
        bodyGradient.addColorStop(1, '#0284c7')
        ctx.fillStyle = bodyGradient
        ctx.fillRect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4)
      }
    })

    // Draw food with glow effect
    const foodX = food.x * GRID_SIZE
    const foodY = food.y * GRID_SIZE
    
    // Glow effect
    ctx.shadowColor = '#ef4444'
    ctx.shadowBlur = 10
    
    const foodGradient = ctx.createRadialGradient(foodX + GRID_SIZE/2, foodY + GRID_SIZE/2, 0, foodX + GRID_SIZE/2, foodY + GRID_SIZE/2, GRID_SIZE/2)
    foodGradient.addColorStop(0, '#fecaca')
    foodGradient.addColorStop(0.7, '#ef4444')
    foodGradient.addColorStop(1, '#dc2626')
    
    ctx.fillStyle = foodGradient
    ctx.fillRect(foodX + 1, foodY + 1, GRID_SIZE - 2, GRID_SIZE - 2)
    
    // Reset shadow
    ctx.shadowBlur = 0
  }, [snake, food])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  useEffect(() => {
    if (gameState === 'playing') {
      const gameLoop = setInterval(moveSnake, speed)
      return () => clearInterval(gameLoop)
    }
  }, [gameState, moveSnake, speed])

  useEffect(() => {
    draw()
  }, [draw])

  useEffect(() => {
    resetGame()
  }, [difficulty, resetGame])

  return (
    <div className="snake-game">
      <div className="game-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Hub
        </button>
        <h1>Snake Game</h1>
        <div className="difficulty-selector">
          <select 
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
            disabled={gameState === 'playing'}
          >
            <option value="easy">🐌 Easy</option>
            <option value="medium">🐍 Medium</option>
            <option value="hard">⚡ Hard</option>
          </select>
        </div>
      </div>

      <div className="game-info">
        <div className="score-display">
          <div className="score-item">
            <span className="score-label">Score</span>
            <span className="score-value">{score}</span>
          </div>
          <div className="score-item">
            <span className="score-label">High Score</span>
            <span className="score-value high-score">{highScore}</span>
          </div>
          <div className="score-item">
            <span className="score-label">Length</span>
            <span className="score-value">{snake.length}</span>
          </div>
        </div>
      </div>

      <div className="game-container">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="game-canvas"
        />
        
        {gameState !== 'playing' && (
          <div className="game-overlay">
            <div className="overlay-content">
              {gameState === 'starting' && (
                <>
                  <h2>🐍 Snake Game</h2>
                  <p>Use arrow keys or WASD to move</p>
                  <p>Press SPACE to start</p>
                </>
              )}
              
              {gameState === 'paused' && (
                <>
                  <h2>⏸️ Paused</h2>
                  <p>Press SPACE to continue</p>
                </>
              )}
              
              {gameState === 'gameOver' && (
                <>
                  <h2>💀 Game Over!</h2>
                  <p>Score: {score}</p>
                  {score === highScore && score > 0 && (
                    <p className="new-record">🎉 New High Score!</p>
                  )}
                  <p>Press SPACE to play again</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="game-controls">
        <div className="control-instructions">
          <h3>Controls</h3>
          <div className="controls-grid">
            <div className="control-item">
              <span className="control-key">↑ ↓ ← →</span>
              <span>Arrow Keys</span>
            </div>
            <div className="control-item">
              <span className="control-key">WASD</span>
              <span>Alternative</span>
            </div>
            <div className="control-item">
              <span className="control-key">SPACE</span>
              <span>Pause/Resume</span>
            </div>
          </div>
        </div>
        
        <div className="game-actions">
          <button 
            className="btn btn-primary" 
            onClick={() => {
              if (gameState === 'playing') {
                setGameState('paused')
              } else if (gameState === 'paused') {
                setGameState('playing')
              } else if (gameState === 'gameOver') {
                resetGame()
                setGameState('playing')
              } else {
                setGameState('playing')
              }
            }}
          >
            {gameState === 'playing' ? '⏸️ Pause' : '▶️ Play'}
          </button>
          
          <button className="btn btn-secondary" onClick={resetGame}>
            🔄 New Game
          </button>
        </div>
      </div>
    </div>
  )
}

export default Snake
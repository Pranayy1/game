import React, { useState, useEffect, useCallback, useRef } from 'react'
import './GameContainer.css'
import './Pong.css'

interface PongProps {
  onBack: () => void
}

interface Paddle {
  x: number
  y: number
  width: number
  height: number
}

interface Ball {
  x: number
  y: number
  dx: number
  dy: number
  radius: number
}

type GameState = 'starting' | 'playing' | 'paused' | 'gameOver'
type Difficulty = 'easy' | 'medium' | 'hard'

const Pong: React.FC<PongProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const keysRef = useRef<Set<string>>(new Set())
  
  const [gameState, setGameState] = useState<GameState>('starting')
  const [score, setScore] = useState({ player: 0, ai: 0 })
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  
  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 400
  const PADDLE_WIDTH = 15
  const PADDLE_HEIGHT = 80
  const BALL_RADIUS = 8
  const WINNING_SCORE = 5

  const [playerPaddle, setPlayerPaddle] = useState<Paddle>({
    x: 30,
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT
  })

  const [aiPaddle, setAiPaddle] = useState<Paddle>({
    x: CANVAS_WIDTH - 30 - PADDLE_WIDTH,
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT
  })

  const [ball, setBall] = useState<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    dx: 5,
    dy: 3,
    radius: BALL_RADIUS
  })

  const difficultySettings = {
    easy: { aiSpeed: 3, ballSpeedMultiplier: 0.8 },
    medium: { aiSpeed: 4, ballSpeedMultiplier: 1 },
    hard: { aiSpeed: 5.5, ballSpeedMultiplier: 1.2 }
  }

  const resetBall = useCallback(() => {
    const settings = difficultySettings[difficulty]
    setBall({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      dx: (Math.random() > 0.5 ? 5 : -5) * settings.ballSpeedMultiplier,
      dy: (Math.random() - 0.5) * 6 * settings.ballSpeedMultiplier,
      radius: BALL_RADIUS
    })
  }, [difficulty])

  const resetGame = useCallback(() => {
    setScore({ player: 0, ai: 0 })
    setPlayerPaddle(prev => ({ ...prev, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2 }))
    setAiPaddle(prev => ({ ...prev, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2 }))
    resetBall()
    setGameState('starting')
  }, [resetBall])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    keysRef.current.add(event.code)
    
    if (event.code === 'Space') {
      event.preventDefault()
      if (gameState === 'starting' || gameState === 'gameOver') {
        setGameState('playing')
      } else if (gameState === 'playing') {
        setGameState('paused')
      } else if (gameState === 'paused') {
        setGameState('playing')
      }
    }
  }, [gameState])

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    keysRef.current.delete(event.code)
  }, [])

  const updatePaddles = useCallback((currentBall: Ball) => {
    const PADDLE_SPEED = 6

    // Update player paddle
    setPlayerPaddle(prev => {
      let newY = prev.y
      
      if (keysRef.current.has('ArrowUp') || keysRef.current.has('KeyW')) {
        newY = Math.max(0, prev.y - PADDLE_SPEED)
      }
      if (keysRef.current.has('ArrowDown') || keysRef.current.has('KeyS')) {
        newY = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, prev.y + PADDLE_SPEED)
      }
      
      return { ...prev, y: newY }
    })

    // Update AI paddle with improved logic
    const settings = difficultySettings[difficulty]
    setAiPaddle(prev => {
      const paddleCenter = prev.y + PADDLE_HEIGHT / 2
      const ballCenter = currentBall.y
      const diff = ballCenter - paddleCenter
      
      let newY = prev.y
      
      // Only move AI paddle if ball is moving towards it or is close
      if (currentBall.dx > 0 || currentBall.x > CANVAS_WIDTH / 2) {
        if (Math.abs(diff) > 5) {
          if (diff > 0) {
            newY = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, prev.y + settings.aiSpeed)
          } else {
            newY = Math.max(0, prev.y - settings.aiSpeed)
          }
        }
      }
      
      return { ...prev, y: newY }
    })
  }, [difficulty])

  const updateBall = useCallback(() => {
    setBall(prev => {
      let newBall = { ...prev }
      newBall.x += newBall.dx
      newBall.y += newBall.dy

      // Ball collision with top and bottom walls
      if (newBall.y <= newBall.radius || newBall.y >= CANVAS_HEIGHT - newBall.radius) {
        newBall.dy = -newBall.dy
      }

      // Ball collision with player paddle
      if (
        newBall.x - newBall.radius <= playerPaddle.x + playerPaddle.width &&
        newBall.x + newBall.radius >= playerPaddle.x &&
        newBall.y >= playerPaddle.y &&
        newBall.y <= playerPaddle.y + playerPaddle.height &&
        newBall.dx < 0
      ) {
        newBall.dx = -newBall.dx
        const hitPos = (newBall.y - (playerPaddle.y + playerPaddle.height / 2)) / (playerPaddle.height / 2)
        newBall.dy = hitPos * 5
      }

      // Ball collision with AI paddle
      if (
        newBall.x + newBall.radius >= aiPaddle.x &&
        newBall.x - newBall.radius <= aiPaddle.x + aiPaddle.width &&
        newBall.y >= aiPaddle.y &&
        newBall.y <= aiPaddle.y + aiPaddle.height &&
        newBall.dx > 0
      ) {
        newBall.dx = -newBall.dx
        const hitPos = (newBall.y - (aiPaddle.y + aiPaddle.height / 2)) / (aiPaddle.height / 2)
        newBall.dy = hitPos * 5
      }

      // Ball goes off screen - scoring
      if (newBall.x < 0) {
        setScore(prev => {
          const newScore = { ...prev, ai: prev.ai + 1 }
          if (newScore.ai >= WINNING_SCORE) {
            setGameState('gameOver')
          } else {
            setTimeout(resetBall, 1000)
          }
          return newScore
        })
        return { ...newBall, x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, dx: 0, dy: 0 }
      }

      if (newBall.x > CANVAS_WIDTH) {
        setScore(prev => {
          const newScore = { ...prev, player: prev.player + 1 }
          if (newScore.player >= WINNING_SCORE) {
            setGameState('gameOver')
          } else {
            setTimeout(resetBall, 1000)
          }
          return newScore
        })
        return { ...newBall, x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, dx: 0, dy: 0 }
      }

      return newBall
    })
  }, [playerPaddle, aiPaddle, resetBall])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    gradient.addColorStop(0, '#0f172a')
    gradient.addColorStop(1, '#1e293b')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 3
    ctx.setLineDash([10, 10])
    ctx.beginPath()
    ctx.moveTo(CANVAS_WIDTH / 2, 0)
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw paddles with glow effect
    ctx.shadowBlur = 10
    ctx.shadowColor = '#0ea5e9'
    
    // Player paddle (left)
    ctx.fillStyle = '#0ea5e9'
    ctx.fillRect(playerPaddle.x, playerPaddle.y, playerPaddle.width, playerPaddle.height)
    
    // AI paddle (right)
    ctx.fillStyle = '#ef4444'
    ctx.shadowColor = '#ef4444'
    ctx.fillRect(aiPaddle.x, aiPaddle.y, aiPaddle.width, aiPaddle.height)

    // Draw ball with glow
    ctx.shadowColor = '#ffffff'
    ctx.shadowBlur = 15
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
    ctx.fill()

    // Reset shadow
    ctx.shadowBlur = 0

    // Draw scores
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(score.player.toString(), CANVAS_WIDTH / 4, 60)
    ctx.fillText(score.ai.toString(), (3 * CANVAS_WIDTH) / 4, 60)
  }, [playerPaddle, aiPaddle, ball, score])

  const gameLoop = useCallback(() => {
    if (gameState === 'playing') {
      // Update ball first, then update paddles with current ball position
      setBall(currentBall => {
        const newBall = {
          x: currentBall.x + currentBall.dx,
          y: currentBall.y + currentBall.dy,
          dx: currentBall.dx,
          dy: currentBall.dy,
          radius: currentBall.radius
        }
        
        // Update AI paddle with new ball position
        updatePaddles(newBall)
        
        return newBall
      })
      updateBall()
    }
    draw()
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [gameState, updatePaddles, updateBall, draw])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameLoop])

  useEffect(() => {
    resetGame()
  }, [difficulty])

  return (
    <div className="pong-game">
      <div className="game-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Hub
        </button>
        <h1>Pong</h1>
        <div className="difficulty-selector">
          <select 
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            disabled={gameState === 'playing'}
          >
            <option value="easy">😊 Easy</option>
            <option value="medium">😐 Medium</option>
            <option value="hard">😈 Hard</option>
          </select>
        </div>
      </div>

      <div className="game-info">
        <div className="score-display">
          <div className="score-section">
            <span className="player-label">Player</span>
            <span className="score-value player-score">{score.player}</span>
          </div>
          <div className="vs-section">
            <span className="vs-text">VS</span>
            <span className="first-to">First to {WINNING_SCORE}</span>
          </div>
          <div className="score-section">
            <span className="player-label">AI</span>
            <span className="score-value ai-score">{score.ai}</span>
          </div>
        </div>
      </div>

      <div className="game-container">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="pong-canvas"
        />
        
        {gameState !== 'playing' && (
          <div className="game-overlay">
            <div className="overlay-content">
              {gameState === 'starting' && (
                <>
                  <h2>🏏 Ready to Play?</h2>
                  <p>Use ↑↓ arrows or W/S keys to move</p>
                  <p>Press SPACE to start</p>
                </>
              )}
              
              {gameState === 'paused' && (
                <>
                  <h2>⏸️ Game Paused</h2>
                  <p>Press SPACE to continue</p>
                </>
              )}
              
              {gameState === 'gameOver' && (
                <>
                  <h2>{score.player >= WINNING_SCORE ? '🎉 You Win!' : '💀 AI Wins!'}</h2>
                  <p>Final Score: {score.player} - {score.ai}</p>
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
              <span className="control-key">↑ ↓</span>
              <span>Arrow Keys</span>
            </div>
            <div className="control-item">
              <span className="control-key">W S</span>
              <span>Alternative</span>
            </div>
            <div className="control-item">
              <span className="control-key">SPACE</span>
              <span>Pause/Start</span>
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

export default Pong
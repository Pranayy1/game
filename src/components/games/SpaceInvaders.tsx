import React, { useState, useEffect, useCallback, useRef } from 'react'
import './GameContainer.css'
import './SpaceInvaders.css'

interface SpaceInvadersProps {
  onBack: () => void
}

interface Player {
  x: number
  y: number
  width: number
  height: number
}

interface Bullet {
  id: number
  x: number
  y: number
  dy: number
  width: number
  height: number
  isPlayerBullet: boolean
}

interface Invader {
  id: number
  x: number
  y: number
  width: number
  height: number
  type: 'basic' | 'fast' | 'strong' | 'boss'
  health: number
  maxHealth: number
  points: number
}

interface PowerUp {
  id: number
  x: number
  y: number
  type: 'rapidFire' | 'shield' | 'multiShot' | 'health'
  dy: number
}

interface Particle {
  id: number
  x: number
  y: number
  dx: number
  dy: number
  life: number
  maxLife: number
  color: string
}

type GameState = 'starting' | 'playing' | 'paused' | 'gameOver' | 'won'

const SpaceInvaders: React.FC<SpaceInvadersProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const keysRef = useRef<Set<string>>(new Set())
  const lastShotRef = useRef<number>(0)
  
  const [gameState, setGameState] = useState<GameState>('starting')
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lives, setLives] = useState(3)
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('space-invaders-highscore')
    return saved ? parseInt(saved) : 0
  })
  
  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 600
  const PLAYER_SPEED = 5
  const BULLET_SPEED = 8
  const INVADER_SPEED = 1
  
  const [player, setPlayer] = useState<Player>({
    x: CANVAS_WIDTH / 2 - 25,
    y: CANVAS_HEIGHT - 60,
    width: 50,
    height: 30
  })
  
  const [bullets, setBullets] = useState<Bullet[]>([])
  const [invaders, setInvaders] = useState<Invader[]>([])
  const [powerUps, setPowerUps] = useState<PowerUp[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [playerShield, setPlayerShield] = useState(0)
  const [rapidFire, setRapidFire] = useState(0)
  const [multiShot, setMultiShot] = useState(0)
  
  const invaderTypes = {
    basic: { health: 1, points: 10, color: '#22c55e' },
    fast: { health: 1, points: 20, color: '#eab308' },
    strong: { health: 2, points: 30, color: '#f97316' },
    boss: { health: 5, points: 100, color: '#dc2626' }
  }

  const createInvaders = useCallback((currentLevel: number) => {
    const newInvaders: Invader[] = []
    const rows = Math.min(4 + Math.floor(currentLevel / 3), 6)
    const cols = 8
    const invaderWidth = 40
    const invaderHeight = 30
    const spacing = 20
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let type: Invader['type'] = 'basic'
        
        if (currentLevel > 2 && row === 0) type = 'fast'
        if (currentLevel > 4 && row === 1) type = 'strong'
        if (currentLevel > 6 && col === cols - 1 && row === 0) type = 'boss'
        
        const invaderTemplate = invaderTypes[type]
        const health = invaderTemplate.health + Math.floor(currentLevel / 5)
        
        newInvaders.push({
          id: row * cols + col,
          x: col * (invaderWidth + spacing) + 100,
          y: row * (invaderHeight + spacing) + 80,
          width: type === 'boss' ? invaderWidth * 1.5 : invaderWidth,
          height: type === 'boss' ? invaderHeight * 1.5 : invaderHeight,
          type,
          health,
          maxHealth: health,
          points: invaderTemplate.points * currentLevel
        })
      }
    }
    
    setInvaders(newInvaders)
  }, [])

  const spawnPowerUp = useCallback((x: number, y: number) => {
    if (Math.random() < 0.1) { // 10% chance
      const types: PowerUp['type'][] = ['rapidFire', 'shield', 'multiShot', 'health']
      const type = types[Math.floor(Math.random() * types.length)]
      
      setPowerUps(prev => [...prev, {
        id: Date.now() + Math.random(),
        x: x + 20,
        y: y + 15,
        type,
        dy: 2
      }])
    }
  }, [])

  const createParticles = useCallback((x: number, y: number, color: string, count: number = 8) => {
    const newParticles: Particle[] = []
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Date.now() + Math.random() + i,
        x,
        y,
        dx: (Math.random() - 0.5) * 8,
        dy: (Math.random() - 0.5) * 8,
        life: 0,
        maxLife: 30 + Math.random() * 20,
        color
      })
    }
    setParticles(prev => [...prev, ...newParticles])
  }, [])

  const activatePowerUp = useCallback((type: PowerUp['type']) => {
    switch (type) {
      case 'rapidFire':
        setRapidFire(300) // 5 seconds at 60fps
        break
      case 'shield':
        setPlayerShield(180) // 3 seconds
        break
      case 'multiShot':
        setMultiShot(240) // 4 seconds
        break
      case 'health':
        setLives(prev => prev + 1)
        break
    }
  }, [])

  const shootBullet = useCallback(() => {
    const currentTime = Date.now()
    const fireRate = rapidFire > 0 ? 100 : 250
    
    if (currentTime - lastShotRef.current < fireRate) return
    
    const newBullets: Bullet[] = []
    
    if (multiShot > 0) {
      // Triple shot
      for (let i = -1; i <= 1; i++) {
        newBullets.push({
          id: Date.now() + Math.random() + i,
          x: player.x + player.width / 2 + i * 15,
          y: player.y,
          dy: -BULLET_SPEED,
          width: 4,
          height: 10,
          isPlayerBullet: true
        })
      }
    } else {
      // Single shot
      newBullets.push({
        id: Date.now(),
        x: player.x + player.width / 2,
        y: player.y,
        dy: -BULLET_SPEED,
        width: 4,
        height: 10,
        isPlayerBullet: true
      })
    }
    
    setBullets(prev => [...prev, ...newBullets])
    lastShotRef.current = currentTime
  }, [player, rapidFire, multiShot])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    keysRef.current.add(event.code)
    
    if (event.code === 'Space') {
      event.preventDefault()
      if (gameState === 'starting' || gameState === 'gameOver' || gameState === 'won') {
        resetGame()
      } else if (gameState === 'playing') {
        setGameState('paused')
      } else if (gameState === 'paused') {
        setGameState('playing')
      }
    }
    
    if (gameState === 'playing' && event.code === 'KeyF') {
      shootBullet()
    }
  }, [gameState, shootBullet])

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    keysRef.current.delete(event.code)
  }, [])

  const updatePlayer = useCallback(() => {
    setPlayer(prev => {
      let newX = prev.x
      let newY = prev.y
      
      if (keysRef.current.has('KeyA')) {
        newX = Math.max(0, prev.x - PLAYER_SPEED)
      }
      if (keysRef.current.has('KeyD')) {
        newX = Math.min(CANVAS_WIDTH - prev.width, prev.x + PLAYER_SPEED)
      }
      if (keysRef.current.has('KeyW')) {
        newY = Math.max(0, prev.y - PLAYER_SPEED)
      }
      if (keysRef.current.has('KeyS')) {
        newY = Math.min(CANVAS_HEIGHT - prev.height, prev.y + PLAYER_SPEED)
      }
      
      return { ...prev, x: newX, y: newY }
    })
  }, [])

  const updateBullets = useCallback(() => {
    setBullets(prev => {
      const updated = prev.map(bullet => ({
        ...bullet,
        y: bullet.y + bullet.dy
      })).filter(bullet => bullet.y > -bullet.height && bullet.y < CANVAS_HEIGHT + bullet.height)
      
      // Enemy shooting
      if (Math.random() < 0.002 * level) {
        const shootingInvader = invaders[Math.floor(Math.random() * invaders.length)]
        if (shootingInvader) {
          updated.push({
            id: Date.now() + Math.random(),
            x: shootingInvader.x + shootingInvader.width / 2,
            y: shootingInvader.y + shootingInvader.height,
            dy: 3,
            width: 3,
            height: 8,
            isPlayerBullet: false
          })
        }
      }
      
      return updated
    })
  }, [invaders, level])

  const updateInvaders = useCallback(() => {
    setInvaders(prev => {
      const speed = INVADER_SPEED + (level - 1) * 0.2
      let moveDown = false
      
      // Check if any invader hits the edge
      const shouldMoveDown = prev.some(invader => 
        invader.x <= 0 || invader.x >= CANVAS_WIDTH - invader.width
      )
      
      if (shouldMoveDown) {
        moveDown = true
      }
      
      return prev.map(invader => {
        if (moveDown) {
          return { ...invader, y: invader.y + 20 }
        } else {
          return { ...invader, x: invader.x + (invader.x < CANVAS_WIDTH / 2 ? speed : -speed) }
        }
      })
    })
  }, [level])

  const updatePowerUps = useCallback(() => {
    setPowerUps(prev => {
      return prev.filter(powerUp => {
        powerUp.y += powerUp.dy
        
        // Check collision with player
        if (
          powerUp.x < player.x + player.width &&
          powerUp.x + 30 > player.x &&
          powerUp.y < player.y + player.height &&
          powerUp.y + 30 > player.y
        ) {
          activatePowerUp(powerUp.type)
          createParticles(powerUp.x + 15, powerUp.y + 15, '#22c55e', 12)
          return false // Remove power-up
        }
        
        return powerUp.y < CANVAS_HEIGHT
      })
    })
  }, [player, activatePowerUp, createParticles])

  const updateParticles = useCallback(() => {
    setParticles(prev => {
      return prev.map(particle => ({
        ...particle,
        x: particle.x + particle.dx,
        y: particle.y + particle.dy,
        dx: particle.dx * 0.98,
        dy: particle.dy * 0.98,
        life: particle.life + 1
      })).filter(particle => particle.life < particle.maxLife)
    })
  }, [])

  const checkCollisions = useCallback(() => {
    // Bullet vs Invader collisions
    setBullets(prevBullets => {
      const remainingBullets = [...prevBullets]
      
      prevBullets.forEach((bullet, bulletIndex) => {
        if (!bullet.isPlayerBullet) return
        
        setInvaders(prevInvaders => {
          const updatedInvaders = prevInvaders.map(invader => {
            if (
              bullet.x < invader.x + invader.width &&
              bullet.x + bullet.width > invader.x &&
              bullet.y < invader.y + invader.height &&
              bullet.y + bullet.height > invader.y
            ) {
              remainingBullets.splice(bulletIndex, 1)
              createParticles(invader.x + invader.width / 2, invader.y + invader.height / 2, invaderTypes[invader.type].color)
              
              const newHealth = invader.health - 1
              if (newHealth <= 0) {
                setScore(prev => prev + invader.points)
                spawnPowerUp(invader.x, invader.y)
                return null // Mark for removal
              }
              
              return { ...invader, health: newHealth }
            }
            return invader
          }).filter(invader => invader !== null) as Invader[]
          
          // Check for level completion
          if (updatedInvaders.length === 0) {
            setLevel(prev => prev + 1)
            createInvaders(level + 1)
          }
          
          return updatedInvaders
        })
      })
      
      // Bullet vs Player collisions
      remainingBullets.forEach((bullet, bulletIndex) => {
        if (bullet.isPlayerBullet) return
        
        if (
          bullet.x < player.x + player.width &&
          bullet.x + bullet.width > player.x &&
          bullet.y < player.y + player.height &&
          bullet.y + bullet.height > player.y
        ) {
          remainingBullets.splice(bulletIndex, 1)
          
          if (playerShield === 0) {
            setLives(prev => {
              const newLives = prev - 1
              if (newLives <= 0) {
                if (score > highScore) {
                  setHighScore(score)
                  localStorage.setItem('space-invaders-highscore', score.toString())
                }
                setGameState('gameOver')
              }
              return newLives
            })
            createParticles(player.x + player.width / 2, player.y + player.height / 2, '#ef4444', 15)
          } else {
            createParticles(bullet.x, bullet.y, '#06b6d4', 8)
          }
        }
      })
      
      return remainingBullets
    })

    // Invader reaching bottom
    if (invaders.some(invader => invader.y + invader.height >= player.y)) {
      setGameState('gameOver')
    }
  }, [invaders, player, score, highScore, playerShield, createParticles, spawnPowerUp, level, createInvaders])

  const updatePowerUpTimers = useCallback(() => {
    setRapidFire(prev => Math.max(0, prev - 1))
    setMultiShot(prev => Math.max(0, prev - 1))
    setPlayerShield(prev => Math.max(0, prev - 1))
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas with space background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
    gradient.addColorStop(0, '#0f172a')
    gradient.addColorStop(1, '#1e1b4b')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw stars
    for (let i = 0; i < 100; i++) {
      const x = (i * 37) % CANVAS_WIDTH
      const y = (i * 41) % CANVAS_HEIGHT
      const size = Math.random() * 2
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.8 + 0.2})`
      ctx.fillRect(x, y, size, size)
    }

    // Draw player
    ctx.fillStyle = playerShield > 0 ? '#06b6d4' : '#0ea5e9'
    if (playerShield > 0) {
      ctx.shadowBlur = 20
      ctx.shadowColor = '#06b6d4'
    }
    ctx.fillRect(player.x, player.y, player.width, player.height)
    ctx.shadowBlur = 0

    // Draw invaders
    invaders.forEach(invader => {
      const type = invaderTypes[invader.type]
      const healthPercent = invader.health / invader.maxHealth
      
      ctx.fillStyle = type.color
      ctx.shadowBlur = 8
      ctx.shadowColor = type.color
      ctx.fillRect(invader.x, invader.y, invader.width, invader.height)
      ctx.shadowBlur = 0
      
      // Health bar for damaged invaders
      if (invader.health < invader.maxHealth) {
        ctx.fillStyle = '#ef4444'
        ctx.fillRect(invader.x, invader.y - 8, invader.width, 4)
        ctx.fillStyle = '#22c55e'
        ctx.fillRect(invader.x, invader.y - 8, invader.width * healthPercent, 4)
      }
    })

    // Draw bullets
    bullets.forEach(bullet => {
      ctx.fillStyle = bullet.isPlayerBullet ? '#22c55e' : '#ef4444'
      ctx.shadowBlur = bullet.isPlayerBullet ? 8 : 6
      ctx.shadowColor = ctx.fillStyle
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
    })
    ctx.shadowBlur = 0

    // Draw power-ups
    powerUps.forEach(powerUp => {
      const colors = {
        rapidFire: '#f59e0b',
        shield: '#06b6d4',
        multiShot: '#8b5cf6',
        health: '#ec4899'
      }
      
      ctx.fillStyle = colors[powerUp.type]
      ctx.shadowBlur = 10
      ctx.shadowColor = ctx.fillStyle
      ctx.fillRect(powerUp.x, powerUp.y, 30, 30)
      
      // Draw icon
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      const icons = { rapidFire: '⚡', shield: '🛡️', multiShot: '↗', health: '♥' }
      ctx.fillText(icons[powerUp.type], powerUp.x + 15, powerUp.y + 20)
    })
    ctx.shadowBlur = 0

    // Draw particles
    particles.forEach(particle => {
      const alpha = 1 - (particle.life / particle.maxLife)
      ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0')
      ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2)
    })

    // Draw UI
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(`Score: ${score}`, 20, 40)
    ctx.fillText(`Level: ${level}`, 20, 70)
    ctx.fillText(`Lives: ${lives}`, 200, 40)
    ctx.fillText(`High Score: ${highScore}`, 200, 70)

    // Draw active power-ups
    let powerUpY = 100
    if (rapidFire > 0) {
      ctx.fillStyle = '#f59e0b'
      ctx.font = 'bold 16px Arial'
      ctx.fillText(`Rapid Fire: ${Math.ceil(rapidFire / 60)}s`, 20, powerUpY)
      powerUpY += 25
    }
    if (multiShot > 0) {
      ctx.fillStyle = '#8b5cf6'
      ctx.font = 'bold 16px Arial'
      ctx.fillText(`Multi Shot: ${Math.ceil(multiShot / 60)}s`, 20, powerUpY)
      powerUpY += 25
    }
    if (playerShield > 0) {
      ctx.fillStyle = '#06b6d4'
      ctx.font = 'bold 16px Arial'
      ctx.fillText(`Shield: ${Math.ceil(playerShield / 60)}s`, 20, powerUpY)
    }
  }, [player, invaders, bullets, powerUps, particles, score, level, lives, highScore, rapidFire, multiShot, playerShield])

  const gameLoop = useCallback(() => {
    if (gameState === 'playing') {
      updatePlayer()
      updateBullets()
      updateInvaders()
      updatePowerUps()
      updateParticles()
      updatePowerUpTimers()
      checkCollisions()
    }
    draw()
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [gameState, updatePlayer, updateBullets, updateInvaders, updatePowerUps, updateParticles, updatePowerUpTimers, checkCollisions, draw])

  const resetGame = useCallback(() => {
    setScore(0)
    setLevel(1)
    setLives(3)
    setBullets([])
    setPowerUps([])
    setParticles([])
    setRapidFire(0)
    setMultiShot(0)
    setPlayerShield(0)
    setPlayer({
      x: CANVAS_WIDTH / 2 - 25,
      y: CANVAS_HEIGHT - 60,
      width: 50,
      height: 30
    })
    createInvaders(1)
    setGameState('playing')
  }, [createInvaders])

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
    createInvaders(1)
  }, [createInvaders])

  const getGameMessage = () => {
    switch (gameState) {
      case 'starting':
        return {
          title: 'Space Invaders',
          message: 'Defend Earth from the alien invasion!',
          instruction: 'Use W/A/S/D keys to move, F to shoot. Press SPACE to start!'
        }
      case 'paused':
        return {
          title: 'Game Paused',
          message: 'Take cover, soldier!',
          instruction: 'Press SPACE to continue the battle'
        }
      case 'gameOver':
        return {
          title: 'Game Over',
          message: `Earth has fallen! Final Score: ${score}${score === highScore ? ' - New High Score!' : ''}`,
          instruction: 'Press SPACE to try again'
        }
      case 'won':
        return {
          title: 'Victory!',
          message: 'You saved Earth from the invasion!',
          instruction: 'Press SPACE to continue defending'
        }
      default:
        return null
    }
  }

  const message = getGameMessage()

  return (
    <div className="space-invaders">
      <div className="game-header">
        <button onClick={onBack} className="back-btn">
          ← Back
        </button>
        <h1>Space Invaders</h1>
        <div className="score-display">
          <span>Score: {score}</span>
          <span>Level: {level}</span>
          <span>Lives: {lives}</span>
        </div>
      </div>

      <div className="game-container">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="space-canvas"
        />
        
        {message && (
          <div className="game-overlay">
            <div className="overlay-content">
              <h2>{message.title}</h2>
              <p>{message.message}</p>
              <p className="instruction">{message.instruction}</p>
              {score === highScore && score > 0 && (
                <p className="new-record">🎉 New High Score! 🎉</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="game-instructions">
        <h3>How to Play:</h3>
        <ul>
          <li>🚀 Move with W/A/S/D keys (W=Up, A=Left, S=Down, D=Right)</li>
          <li>💥 Hold F to shoot continuously</li>
          <li>⚡ Collect power-ups: Rapid Fire, Shield, Multi Shot, Health</li>
          <li>🎯 Destroy all invaders to advance to the next level</li>
          <li>❤️ Don't let invaders reach the bottom or hit you!</li>
        </ul>
      </div>
    </div>
  )
}

export default SpaceInvaders
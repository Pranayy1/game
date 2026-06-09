import React, { useState, useEffect, useCallback, useRef } from 'react'
import './GameContainer.css'
import './TowerDefense.css'

interface TowerDefenseProps {
  onBack: () => void
}

interface Position {
  x: number
  y: number
}

interface Enemy {
  id: number
  x: number
  y: number
  health: number
  maxHealth: number
  speed: number
  pathIndex: number
  reward: number
  type: 'normal' | 'fast' | 'strong' | 'boss'
}

interface Tower {
  id: number
  x: number
  y: number
  type: 'basic' | 'rapid' | 'heavy' | 'freeze'
  damage: number
  range: number
  fireRate: number
  lastFire: number
  cost: number
  level: number
}

interface Projectile {
  id: number
  x: number
  y: number
  targetX: number
  targetY: number
  damage: number
  speed: number
  type: string
}

type GameState = 'starting' | 'playing' | 'paused' | 'gameOver' | 'building' | 'won'
type Difficulty = 'easy' | 'medium' | 'hard' | 'nightmare'

const path: Position[] = [
  { x: 0, y: 240 }, { x: 120, y: 240 }, { x: 120, y: 80 }, { x: 280, y: 80 },
  { x: 280, y: 200 }, { x: 440, y: 200 }, { x: 440, y: 120 }, { x: 600, y: 120 },
  { x: 600, y: 280 }, { x: 720, y: 280 }, { x: 720, y: 360 }, { x: 800, y: 360 }
]

const towerTypes = {
  basic: { damage: 20, range: 80, fireRate: 1000, cost: 50, color: '#3b82f6' },
  rapid: { damage: 10, range: 60, fireRate: 300, cost: 75, color: '#22c55e' },
  heavy: { damage: 50, range: 100, fireRate: 2000, cost: 100, color: '#ef4444' },
  freeze: { damage: 5, range: 70, fireRate: 800, cost: 80, color: '#06b6d4' }
}

const difficultySettings = {
  easy: { 
    healthMultiplier: 0.7, 
    speedMultiplier: 0.8, 
    enemyCount: 0.8, 
    rewardMultiplier: 1.2, 
    startingMoney: 150, 
    startingHealth: 30 
  },
  medium: { 
    healthMultiplier: 1, 
    speedMultiplier: 1, 
    enemyCount: 1, 
    rewardMultiplier: 1, 
    startingMoney: 100, 
    startingHealth: 20 
  },
  hard: { 
    healthMultiplier: 1.5, 
    speedMultiplier: 1.3, 
    enemyCount: 1.3, 
    rewardMultiplier: 0.8, 
    startingMoney: 75, 
    startingHealth: 15 
  },
  nightmare: { 
    healthMultiplier: 2.5, 
    speedMultiplier: 1.8, 
    enemyCount: 1.8, 
    rewardMultiplier: 0.6, 
    startingMoney: 50, 
    startingHealth: 10 
  }
}

const enemyTypes = {
  normal: { health: 50, speed: 1, reward: 10, color: '#fbbf24' },
  fast: { health: 30, speed: 2, reward: 15, color: '#10b981' },
  strong: { health: 100, speed: 0.7, reward: 25, color: '#f59e0b' },
  boss: { health: 200, speed: 0.5, reward: 50, color: '#dc2626' }
}

const TowerDefense: React.FC<TowerDefenseProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const spawnTimeoutsRef = useRef<number[]>([])
  const nextIdRef = useRef(1)
  
  const [gameState, setGameState] = useState<GameState>('starting')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [wave, setWave] = useState(1)
  const waveRef = useRef(1)
  waveRef.current = wave
  const [health, setHealth] = useState(20)
  const [money, setMoney] = useState(100)
  const [score, setScore] = useState(0)
  const [selectedTowerType, setSelectedTowerType] = useState<Tower['type'] | null>(null)
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [towers, setTowers] = useState<Tower[]>([])
  const [projectiles, setProjectiles] = useState<Projectile[]>([])
  const [waveInProgress, setWaveInProgress] = useState(false)
  
  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 600
  const GRID_SIZE = 40

  const spawnWave = useCallback(() => {
    if (waveInProgress) return
    
    setWaveInProgress(true)
    const settings = difficultySettings[difficulty]
    const baseEnemyCount = Math.min(5 + wave * 2, 25)
    const enemyCount = Math.floor(baseEnemyCount * settings.enemyCount)
    
    for (let i = 0; i < enemyCount; i++) {
      let type: Enemy['type'] = 'normal'
      
      const fastChance = difficulty === 'easy' ? 0.15 : difficulty === 'medium' ? 0.2 : difficulty === 'hard' ? 0.3 : 0.4
      const strongChance = difficulty === 'easy' ? 0.1 : difficulty === 'medium' ? 0.15 : difficulty === 'hard' ? 0.25 : 0.35
      const bossChance = difficulty === 'easy' ? 0.2 : difficulty === 'medium' ? 0.3 : difficulty === 'hard' ? 0.4 : 0.5
      
      if (wave > 2 && Math.random() < fastChance) type = 'fast'
      if (wave > 4 && Math.random() < strongChance) type = 'strong'
      if (wave > 6 && i === enemyCount - 1 && Math.random() < bossChance) type = 'boss'
      
      const enemyTemplate = enemyTypes[type]
      const waveHealthMultiplier = 1 + (wave - 1) * 0.2
      const finalHealth = enemyTemplate.health * waveHealthMultiplier * settings.healthMultiplier
      const finalSpeed = enemyTemplate.speed * settings.speedMultiplier
      const finalReward = Math.floor(enemyTemplate.reward * settings.rewardMultiplier)
      
      const timeoutId = window.setTimeout(() => {
        const enemyId = nextIdRef.current++
        setEnemies(prev => [...prev, {
          id: enemyId,
          x: path[0].x,
          y: path[0].y,
          health: finalHealth,
          maxHealth: finalHealth,
          speed: finalSpeed,
          pathIndex: 0,
          reward: finalReward,
          type
        }])
      }, i * (difficulty === 'nightmare' ? 300 : 500))
      spawnTimeoutsRef.current.push(timeoutId)
    }
  }, [wave, waveInProgress, difficulty])

  const canPlaceTower = useCallback((x: number, y: number) => {
    const gridX = Math.floor(x / GRID_SIZE) * GRID_SIZE
    const gridY = Math.floor(y / GRID_SIZE) * GRID_SIZE
    
    // Check if position is on path
    for (let i = 0; i < path.length - 1; i++) {
      const current = path[i]
      const next = path[i + 1]
      
      if (current.x === next.x) { // Vertical path
        const minY = Math.min(current.y, next.y)
        const maxY = Math.max(current.y, next.y)
        if (Math.abs(gridX - current.x) < GRID_SIZE && gridY >= minY - GRID_SIZE && gridY <= maxY + GRID_SIZE) {
          return false
        }
      } else { // Horizontal path
        const minX = Math.min(current.x, next.x)
        const maxX = Math.max(current.x, next.x)
        if (Math.abs(gridY - current.y) < GRID_SIZE && gridX >= minX - GRID_SIZE && gridX <= maxX + GRID_SIZE) {
          return false
        }
      }
    }
    
    // Check if tower already exists at position
    return !towers.some(tower => 
      Math.abs(tower.x - (gridX + GRID_SIZE / 2)) < GRID_SIZE / 2 && 
      Math.abs(tower.y - (gridY + GRID_SIZE / 2)) < GRID_SIZE / 2
    )
  }, [towers])

  const placeTower = useCallback((x: number, y: number) => {
    if (!selectedTowerType || !canPlaceTower(x, y)) return false
    
    const towerTemplate = towerTypes[selectedTowerType]
    if (money < towerTemplate.cost) return false
    
    const gridX = Math.floor(x / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2
    const gridY = Math.floor(y / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2
    
    const newTower: Tower = {
      id: nextIdRef.current++,
      x: gridX,
      y: gridY,
      type: selectedTowerType,
      damage: towerTemplate.damage,
      range: towerTemplate.range,
      fireRate: towerTemplate.fireRate,
      lastFire: 0,
      cost: towerTemplate.cost,
      level: 1
    }
    
    setTowers(prev => [...prev, newTower])
    setMoney(prev => prev - towerTemplate.cost)
    setSelectedTowerType(null)
    return true
  }, [selectedTowerType, money, canPlaceTower])

  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    if (gameState !== 'playing' && gameState !== 'building') return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    if (selectedTowerType) {
      placeTower(x, y)
    }
  }, [gameState, selectedTowerType, placeTower])

  const updateEnemies = useCallback(() => {
    setEnemies(prev => {
      const updated = prev.map(enemy => {
        if (enemy.pathIndex >= path.length - 1) {
          setHealth(h => h - 1)
          return null // Mark for removal
        }
        
        const target = path[enemy.pathIndex + 1]
        if (!target) return enemy
        
        const dx = target.x - enemy.x
        const dy = target.y - enemy.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 5) {
          return { ...enemy, pathIndex: enemy.pathIndex + 1, x: target.x, y: target.y }
        }
        
        const moveX = (dx / distance) * enemy.speed
        const moveY = (dy / distance) * enemy.speed
        
        return { ...enemy, x: enemy.x + moveX, y: enemy.y + moveY }
      }).filter(enemy => enemy !== null) as Enemy[]
      
      if (updated.length === 0 && waveInProgress) {
        setWaveInProgress(false)
        setWave(w => w + 1)
        setMoney(m => m + 50 + waveRef.current * 10) // Wave completion bonus
      }
      
      return updated
    })
  }, [waveInProgress])

  const updateTowers = useCallback(() => {
    const currentTime = Date.now()
    const newProjectiles: Projectile[] = []
    const currentEnemies = enemies

    setTowers(prevTowers => {
      const updatedTowers = prevTowers.map(tower => {
        if (currentTime - tower.lastFire < tower.fireRate) return tower

        let nearestEnemy: Enemy | undefined = undefined
        let nearestDistance = Infinity

        for (const enemy of currentEnemies) {
          const distance = Math.sqrt((enemy.x - tower.x) ** 2 + (enemy.y - tower.y) ** 2)
          if (distance <= tower.range && distance < nearestDistance) {
            nearestEnemy = enemy
            nearestDistance = distance
          }
        }

        if (nearestEnemy) {
          newProjectiles.push({
            id: nextIdRef.current++,
            x: tower.x,
            y: tower.y,
            targetX: nearestEnemy.x,
            targetY: nearestEnemy.y,
            damage: tower.damage,
            speed: 300,
            type: tower.type
          })

          return { ...tower, lastFire: currentTime }
        }

        return tower
      })

      return updatedTowers
    })

    if (newProjectiles.length > 0) {
      setProjectiles(prev => [...prev, ...newProjectiles])
    }
  }, [enemies])

  const updateProjectiles = useCallback(() => {
    setProjectiles(prev => {
      return prev.filter(projectile => {
        const dx = projectile.targetX - projectile.x
        const dy = projectile.targetY - projectile.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 10) {
          // Hit target - damage enemies in area
          setEnemies(enemyPrev => enemyPrev.map(enemy => {
            const enemyDistance = Math.sqrt(
              (enemy.x - projectile.targetX) ** 2 + (enemy.y - projectile.targetY) ** 2
            )
            
            if (enemyDistance < 30) {
              const newHealth = enemy.health - projectile.damage
              if (newHealth <= 0) {
                setMoney(m => m + enemy.reward)
                setScore(s => s + enemy.reward * 10)
                return null // Mark for removal
              }
              return { ...enemy, health: newHealth }
            }
            return enemy
          }).filter(enemy => enemy !== null) as Enemy[])
          
          return false // Remove projectile
        }
        
        const moveX = (dx / distance) * projectile.speed / 60
        const moveY = (dy / distance) * projectile.speed / 60
        
        projectile.x += moveX
        projectile.y += moveY
        
        return true
      })
    })
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    gradient.addColorStop(0, '#064e3b')
    gradient.addColorStop(1, '#065f46')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, CANVAS_HEIGHT)
      ctx.stroke()
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(CANVAS_WIDTH, y)
      ctx.stroke()
    }

    // Draw path
    ctx.strokeStyle = '#8b5a2b'
    ctx.lineWidth = 30
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(path[0].x, path[0].y)
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y)
    }
    ctx.stroke()

    // Draw towers
    towers.forEach(tower => {
      const towerTemplate = towerTypes[tower.type]
      
      // Draw range circle when building
      if (selectedTowerType) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2)
        ctx.stroke()
      }
      
      // Draw tower
      ctx.fillStyle = towerTemplate.color
      ctx.shadowBlur = 10
      ctx.shadowColor = towerTemplate.color
      ctx.beginPath()
      ctx.arc(tower.x, tower.y, 15, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      
      // Draw level indicator
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(tower.level.toString(), tower.x, tower.y + 4)
    })

    // Draw enemies
    enemies.forEach(enemy => {
      const enemyTemplate = enemyTypes[enemy.type]
      
      // Draw enemy
      ctx.fillStyle = enemyTemplate.color
      ctx.shadowBlur = 8
      ctx.shadowColor = enemyTemplate.color
      ctx.beginPath()
      ctx.arc(enemy.x, enemy.y, enemy.type === 'boss' ? 20 : 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      
      // Draw health bar
      const barWidth = 24
      const barHeight = 4
      const healthPercent = enemy.health / enemy.maxHealth
      
      ctx.fillStyle = '#ef4444'
      ctx.fillRect(enemy.x - barWidth / 2, enemy.y - 18, barWidth, barHeight)
      ctx.fillStyle = '#22c55e'
      ctx.fillRect(enemy.x - barWidth / 2, enemy.y - 18, barWidth * healthPercent, barHeight)
    })

    // Draw projectiles
    projectiles.forEach(projectile => {
      const colors = {
        basic: '#3b82f6',
        rapid: '#22c55e',
        heavy: '#ef4444',
        freeze: '#06b6d4'
      }
      
      ctx.fillStyle = colors[projectile.type as keyof typeof colors] || '#ffffff'
      ctx.shadowBlur = 6
      ctx.shadowColor = ctx.fillStyle
      ctx.beginPath()
      ctx.arc(projectile.x, projectile.y, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    })

    // Draw UI overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, CANVAS_WIDTH, 60)
    
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(`Wave: ${wave}`, 10, 25)
    ctx.fillText(`Health: ${health}`, 10, 45)
    ctx.fillText(`Money: $${money}`, 120, 25)
    ctx.fillText(`Score: ${score}`, 120, 45)
    
    if (waveInProgress) {
      ctx.fillText(`Enemies: ${enemies.length}`, 250, 25)
    } else {
      ctx.fillStyle = '#22c55e'
      ctx.fillText('Wave Ready!', 250, 25)
    }
  }, [towers, enemies, projectiles, wave, health, money, score, waveInProgress, selectedTowerType])

  const gameLoop = useCallback(() => {
    if (gameState === 'playing') {
      updateEnemies()
      updateTowers()
      updateProjectiles()
    }
    draw()
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [gameState, updateEnemies, updateTowers, updateProjectiles, draw])

  const changeDifficulty = useCallback((newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty)
    const settings = difficultySettings[newDifficulty]
    setHealth(settings.startingHealth)
    setMoney(settings.startingMoney)
    setWave(1)
    setScore(0)
    setTowers([])
    setEnemies([])
    setProjectiles([])
    setWaveInProgress(false)
    setGameState('starting')
  }, [])

  const resetGame = useCallback(() => {
    const settings = difficultySettings[difficulty]
    setHealth(settings.startingHealth)
    setMoney(settings.startingMoney)
    setWave(1)
    setScore(0)
    setTowers([])
    setEnemies([])
    setProjectiles([])
    setWaveInProgress(false)
    setGameState('playing')
  }, [difficulty])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space') {
      event.preventDefault()
      if (gameState === 'starting') {
        setGameState('playing')
      } else if (gameState === 'gameOver') {
        resetGame()
      } else if (gameState === 'playing') {
        setGameState('paused')
      } else if (gameState === 'paused') {
        setGameState('playing')
      }
    }
    
    if (gameState === 'playing' && event.code === 'KeyW' && !waveInProgress) {
      spawnWave()
    }
    
    // Tower selection hotkeys
    if (gameState === 'playing') {
      switch (event.code) {
        case 'Digit1': setSelectedTowerType('basic'); break
        case 'Digit2': setSelectedTowerType('rapid'); break
        case 'Digit3': setSelectedTowerType('heavy'); break
        case 'Digit4': setSelectedTowerType('freeze'); break
        case 'Escape': setSelectedTowerType(null); break
      }
    }
  }, [gameState, spawnWave, waveInProgress, resetGame])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameLoop])

  useEffect(() => {
    if (health <= 0) {
      setGameState('gameOver')
    }
  }, [health])

  useEffect(() => {
    if (gameState === 'playing' && !waveInProgress) {
      const timeout = setTimeout(() => {
        spawnWave()
      }, 3000)
      return () => clearTimeout(timeout)
    }
  }, [gameState, waveInProgress, spawnWave])

  useEffect(() => {
    return () => {
      spawnTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId))
      spawnTimeoutsRef.current = []
    }
  }, [])

  const getGameMessage = () => {
    switch (gameState) {
      case 'starting':
        return {
          title: 'Tower Defense',
          message: 'Defend your base from waves of enemies!',
          instruction: 'Press SPACE to start, W to spawn waves, 1-4 to select towers'
        }
      case 'paused':
        return {
          title: 'Game Paused',
          message: 'Strategy time!',
          instruction: 'Press SPACE to continue'
        }
      case 'gameOver':
        return {
          title: 'Game Over',
          message: `You survived ${wave - 1} waves! Final Score: ${score}`,
          instruction: 'Press SPACE to play again'
        }
      default:
        return null
    }
  }

  const message = getGameMessage()

  return (
    <div className="tower-defense">
      <div className="game-header">
        <button onClick={onBack} className="back-btn">
          ← Back
        </button>
        <h1>Tower Defense</h1>
        <div className="score-display">
          <span>Wave: {wave}</span>
          <span>Health: {health}</span>
          <span>Money: ${money}</span>
        </div>
      </div>

      <div className="difficulty-selector">
        <h3>Difficulty:</h3>
        <div className="difficulty-buttons">
          {(['easy', 'medium', 'hard', 'nightmare'] as Difficulty[]).map(diff => (
            <button
              key={diff}
              className={`difficulty-btn ${difficulty === diff ? 'active' : ''}`}
              onClick={() => changeDifficulty(diff)}
            >
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
              {diff === 'easy' && ' 🟢'}
              {diff === 'medium' && ' 🟡'}
              {diff === 'hard' && ' 🔴'}
              {diff === 'nightmare' && ' 💀'}
            </button>
          ))}
        </div>
        <p className="difficulty-info">
          {difficulty === 'easy' && 'More money, more health, weaker enemies'}
          {difficulty === 'medium' && 'Balanced gameplay for steady progression'}
          {difficulty === 'hard' && 'Stronger enemies, less resources'}
          {difficulty === 'nightmare' && 'Ultimate challenge - survive if you can!'}
        </p>
      </div>

      <div className="game-container">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="tower-canvas"
          onClick={handleCanvasClick}
        />
        
        {message && (
          <div className="game-overlay">
            <div className="overlay-content">
              <h2>{message.title}</h2>
              <p>{message.message}</p>
              <p className="instruction">{message.instruction}</p>
            </div>
          </div>
        )}
      </div>

      <div className="tower-selector">
        <h3>Towers:</h3>
        <div className="tower-buttons">
          {Object.entries(towerTypes).map(([type, config]) => (
            <button
              key={type}
              className={`tower-btn ${selectedTowerType === type ? 'selected' : ''} ${money < config.cost ? 'disabled' : ''}`}
              onClick={() => setSelectedTowerType(type as Tower['type'])}
              disabled={money < config.cost}
            >
              <div className="tower-icon" style={{ backgroundColor: config.color }}></div>
              <div className="tower-info">
                <div className="tower-name">{type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div className="tower-cost">${config.cost}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="game-instructions">
        <h3>How to Play:</h3>
        <ul>
          <li>🎯 Click to place towers along the enemy path</li>
          <li>⚔️ Different towers have unique abilities and costs</li>
          <li>🌊 Press W to spawn the next wave (or wait for auto-spawn)</li>
          <li>💰 Earn money by defeating enemies to buy more towers</li>
          <li>❤️ Don't let enemies reach your base!</li>
        </ul>
      </div>
    </div>
  )
}

export default TowerDefense
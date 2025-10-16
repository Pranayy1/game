import React, { useState, useEffect } from 'react'
import './GameHub.css'

type GameType = 'hub' | 'tictactoe' | 'snake' | 'memory' | 'sudoku' | 'pong' | 'towerdefense' | 'spaceinvaders'

interface GameHubProps {
  onGameSelect: (game: GameType) => void
}

interface GameStats {
  totalGames: number
  gamesPlayed: number
  winStreak: number
  favoriteGame: string
}

const GameHub: React.FC<GameHubProps> = ({ onGameSelect }) => {
  const [stats, setStats] = useState<GameStats>({
    totalGames: 5,
    gamesPlayed: 0,
    winStreak: 0,
    favoriteGame: 'None'
  })

  useEffect(() => {
    // Load stats from localStorage
    const savedStats = localStorage.getItem('gameHubStats')
    if (savedStats) {
      setStats(JSON.parse(savedStats))
    }
  }, [])

  const games = [
    {
      id: 'tictactoe',
      title: 'Tic Tac Toe',
      description: 'Classic strategy game for two players. Get three in a row to win!',
      icon: '⭕',
      difficulty: 'easy',
      color: 'from-blue-400 to-blue-600'
    },
    {
      id: 'snake',
      title: 'Snake Game',
      description: 'Guide the snake to eat food and grow longer. Avoid hitting walls!',
      icon: '🐍',
      difficulty: 'medium',
      color: 'from-green-400 to-green-600'
    },
    {
      id: 'memory',
      title: 'Memory Game',
      description: 'Test your memory by matching pairs of cards. How fast can you complete it?',
      icon: '🧠',
      difficulty: 'easy',
      color: 'from-purple-400 to-purple-600'
    },
    {
      id: 'sudoku',
      title: 'Sudoku',
      description: 'Fill the 9x9 grid with numbers so each row, column, and box contains all digits!',
      icon: '🔢',
      difficulty: 'hard',
      color: 'from-red-400 to-red-600'
    },
    {
      id: 'pong',
      title: 'Pong',
      description: 'The original video game! Beat the AI in this classic paddle game.',
      icon: '🏏',
      difficulty: 'easy',
      color: 'from-cyan-400 to-cyan-600'
    },
    {
      id: 'towerdefense',
      title: 'Tower Defense',
      description: 'Build towers to defend against waves of colorful enemies!',
      icon: '🏰',
      difficulty: 'hard',
      color: 'from-red-400 to-red-600'
    },
    {
      id: 'spaceinvaders',
      title: 'Space Invaders',
      description: 'Defend Earth from alien invaders in this retro arcade classic!',
      icon: '👾',
      difficulty: 'hard',
      color: 'from-violet-400 to-violet-600'
    }
  ]

  const handleGameSelect = (gameId: string) => {
    // Update stats
    const newStats = {
      ...stats,
      gamesPlayed: stats.gamesPlayed + 1
    }
    setStats(newStats)
    localStorage.setItem('gameHubStats', JSON.stringify(newStats))
    
    onGameSelect(gameId as GameType)
  }

  return (
    <div className="game-hub fade-in-up">
      <div className="hero-section">
        <h1 className="hub-title">
          <span className="title-icon">🎮</span>
          Welcome to GameHub
        </h1>
        <p className="hub-subtitle">
          Experience classic games with modern design and smooth animations
        </p>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        <h2>Your Gaming Stats</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">{stats.totalGames}</span>
            <span className="stat-label">Available Games</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.gamesPlayed}</span>
            <span className="stat-label">Games Played</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.winStreak}</span>
            <span className="stat-label">Win Streak</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">⭐</span>
            <span className="stat-label">Level: Beginner</span>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="games-section">
        <h2>Choose Your Game</h2>
        <div className="games-grid">
          {games.map((game, index) => (
            <div
              key={game.id}
              className="game-card"
              onClick={() => handleGameSelect(game.id)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="game-card-header">
                <span className="game-card-icon">{game.icon}</span>
                <span className={`difficulty ${game.difficulty}`}>
                  {game.difficulty}
                </span>
              </div>
              
              <div className="game-card-content">
                <h3>{game.title}</h3>
                <p>{game.description}</p>
              </div>
              
              <div className="game-card-footer">
                <button className="play-btn">
                  <span>Play Now</span>
                  <span className="play-icon">▶️</span>
                </button>
              </div>
              
              <div className="card-glow"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <h2>Why Choose GameHub?</h2>
        <div className="features-grid">
          <div className="feature-item">
            <span className="feature-icon">🎨</span>
            <h3>Modern Design</h3>
            <p>Beautiful, responsive interface with smooth animations</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⚡</span>
            <h3>Fast Performance</h3>
            <p>Built with React and Vite for lightning-fast gameplay</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📱</span>
            <h3>Mobile Friendly</h3>
            <p>Play anywhere, anytime on any device</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🏆</span>
            <h3>Score Tracking</h3>
            <p>Keep track of your progress and achievements</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameHub
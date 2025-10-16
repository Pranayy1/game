import React from 'react'
import './Navbar.css'

interface NavbarProps {
  currentGame: string
  onHomeClick: () => void
}

const Navbar: React.FC<NavbarProps> = ({ currentGame, onHomeClick }) => {
  const getGameTitle = (game: string) => {
    const titles: { [key: string]: string } = {
      hub: 'Game Hub',
      tictactoe: 'Tic Tac Toe',
      snake: 'Snake Game',
      memory: 'Memory Game',
      sudoku: 'Sudoku',
      breakout: 'Breakout',
      pong: 'Pong',
      bubbleshooter: 'Bubble Shooter',
      flappybird: 'Flappy Bird',
      towerdefense: 'Tower Defense',
      puzzleslider: 'Puzzle Slider',
      spaceinvaders: 'Space Invaders'
    }
    return titles[game] || 'Game Hub'
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={onHomeClick}>
          <span className="brand-icon">🎮</span>
          <span className="brand-text">GameHub</span>
        </div>
        
        <div className="navbar-center">
          <h2 className="current-game-title">{getGameTitle(currentGame)}</h2>
        </div>
        
        <div className="navbar-actions">
          {currentGame !== 'hub' && (
            <button className="btn btn-secondary" onClick={onHomeClick}>
              <span>🏠</span>
              Home
            </button>
          )}
          <div className="user-profile">
            <span className="user-avatar">👤</span>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
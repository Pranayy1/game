import { useState } from 'react'
import './Navbar.css'

interface NavbarProps {
  currentGame: string
  onHomeClick: () => void
}

const Navbar: React.FC<NavbarProps> = ({ currentGame, onHomeClick }) => {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="game-navbar">
      <div className="game-navbar-inner">
        <div className="game-navbar-brand" onClick={onHomeClick}>
          <span className="game-navbar-icon">🎮</span>
          <span className="game-navbar-title">GameHub</span>
        </div>
        <div className="game-navbar-center">
          <a href="https://pranayy1.github.io/Studyplay/" className="game-navbar-back">
            <span>←</span>
            <span>StudyPlay</span>
          </a>
          {currentGame !== 'hub' && (
            <button className="game-navbar-home-btn" onClick={onHomeClick}>
              <span>🏠</span>
              <span>Home</span>
            </button>
          )}
        </div>
        <button
          className={`game-hamburger${mobileOpen ? ' open' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
      {mobileOpen && (
        <div className="game-mobile-menu">
          <button className="game-mobile-link" onClick={() => { onHomeClick(); setMobileOpen(false); }}>
            <span>🏠</span>
            <span>Home</span>
          </button>
          <a className="game-mobile-link" href="https://pranayy1.github.io/Studyplay/" onClick={() => setMobileOpen(false)}>
            <span>←</span>
            <span>StudyPlay</span>
          </a>
        </div>
      )}
    </nav>
  )
}

export default Navbar

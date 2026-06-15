import React from 'react'
import './Navbar.css'

interface NavbarProps {
  currentGame: string
  onHomeClick: () => void
}

const Navbar: React.FC<NavbarProps> = ({ currentGame, onHomeClick }) => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={onHomeClick}>
          <span className="brand-icon">🎮</span>
          <span className="brand-text">GameHub</span>
        </div>
        
        <div className="navbar-actions">
          <a href="https://pranayy1.github.io/Studyplay/" className="studyplay-link">
             StudyPlay
          </a>
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
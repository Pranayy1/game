import React from 'react'
import './Footer.css'

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h4>GameHub</h4>
            <p>Your ultimate destination for classic web games</p>
          </div>
          
          <div className="footer-section">
            <h4>Games</h4>
            <ul>
              <li>Tic Tac Toe</li>
              <li>Snake</li>
              <li>Memory Game</li>
              <li>Sudoku</li>
              <li>Pong</li>
              <li>Tower Defense</li>
              <li>Space Invaders</li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Features</h4>
            <ul>
              <li>Modern UI/UX</li>
              <li>Smooth Animations</li>
              <li>Responsive Design</li>
              <li>Interactive Games</li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Connect</h4>
            <div className="social-links">
              <span className="social-icon">🌐</span>
              <span className="social-icon">📧</span>
              <span className="social-icon">💬</span>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2026 GameHub. Built with React + Vite. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
import './Footer.css'

const Footer: React.FC = () => {
  return (
    <footer className="game-footer">
      <div className="game-footer-inner">
        <div className="game-footer-brand">
          <span style={{fontSize:'1.5rem'}}>🎮</span>
          <span className="game-footer-name">GameHub</span>
        </div>
        <p className="game-footer-text">© {new Date().getFullYear()} GameHub — All Rights Reserved</p>
      </div>
    </footer>
  )
}

export default Footer

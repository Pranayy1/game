import React, { useState, useEffect, useCallback, useRef } from 'react'
import './Memory.css'

interface MemoryProps {
  onBack: () => void
}

interface Card {
  id: number
  value: string
  isFlipped: boolean
  isMatched: boolean
}

const Memory: React.FC<MemoryProps> = ({ onBack }) => {
  const [cards, setCards] = useState<Card[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matches, setMatches] = useState(0)
  const matchesRef = useRef(0)
  matchesRef.current = matches
  const [gameWon, setGameWon] = useState(false)
  const [difficulty, setDifficulty] = useState<4 | 6 | 8>(4)

  const symbols = ['🎮', '🎯', '🎪', '🎨', '🎭', '🎲', '🎸', '🎺', '🎻', '🥁', '🎤', '🎧', '📱', '💻', '⚽', '🏀', '🎾', '🏈', '⚾', '🎱', '🏐', '🏉', '🥏', '🎳', '🏓', '🏸', '🥊', '🥋', '🎣', '🎽', '🎿', '🏂']

  const fisherYatesShuffle = (array: string[]) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const initializeGame = useCallback(() => {
    const numPairs = (difficulty * difficulty) / 2
    const gameSymbols = symbols.slice(0, numPairs)
    const cardPairs = [...gameSymbols, ...gameSymbols]
    
    const shuffled = fisherYatesShuffle(cardPairs)
      .map((symbol, index) => ({
        id: index,
        value: symbol,
        isFlipped: false,
        isMatched: false
      }))
    
    setCards(shuffled)
    setFlippedCards([])
    setMoves(0)
    setMatches(0)
    setGameWon(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty])

  useEffect(() => {
    initializeGame()
  }, [initializeGame])

  const handleCardClick = (cardId: number) => {
    if (flippedCards.length >= 2 || cards[cardId].isFlipped || cards[cardId].isMatched) return

    const newFlipped = [...flippedCards, cardId]
    setFlippedCards(newFlipped)

    const newCards = [...cards]
    newCards[cardId].isFlipped = true
    setCards(newCards)

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1)
      
      setTimeout(() => {
        const [firstCard, secondCard] = newFlipped
        if (cards[firstCard].value === cards[secondCard].value) {
          // Match found
          const updatedCards = [...newCards]
          updatedCards[firstCard].isMatched = true
          updatedCards[secondCard].isMatched = true
          setCards(updatedCards)
          setMatches(prev => {
            const newMatches = prev + 1
            if (newMatches === (difficulty * difficulty) / 2) {
              setGameWon(true)
            }
            return newMatches
          })
        } else {
          // No match
          const updatedCards = [...newCards]
          updatedCards[firstCard].isFlipped = false
          updatedCards[secondCard].isFlipped = false
          setCards(updatedCards)
        }
        setFlippedCards([])
      }, 1000)
    }
  }

  return (
    <div className="memory-game">
      <div className="game-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Hub
        </button>
        <h1>Memory Game</h1>
        <select 
          value={difficulty} 
          onChange={(e) => setDifficulty(parseInt(e.target.value) as 4 | 6 | 8)}
          className="difficulty-select"
        >
          <option value={4}>4x4 Easy</option>
          <option value={6}>6x6 Medium</option>
          <option value={8}>8x8 Hard</option>
        </select>
      </div>

      <div className="game-info">
        <div className="stat">
          <span className="stat-label">Moves</span>
          <span className="stat-value">{moves}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Matches</span>
          <span className="stat-value">{matches}/{(difficulty * difficulty) / 2}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Accuracy</span>
          <span className="stat-value">{moves > 0 ? Math.round((matches / moves) * 100) : 0}%</span>
        </div>
      </div>

      <div className={`card-grid grid-${difficulty}x${difficulty}`}>
        {cards.map((card) => (
          <div
            key={card.id}
            className={`memory-card ${card.isFlipped || card.isMatched ? 'flipped' : ''} ${card.isMatched ? 'matched' : ''}`}
            onClick={() => handleCardClick(card.id)}
          >
            <div className="card-inner">
              <div className="card-front">?</div>
              <div className="card-back">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {gameWon && (
        <div className="win-overlay">
          <div className="win-content">
            <h2>🎉 Congratulations!</h2>
            <p>You completed the game in {moves} moves!</p>
            <p>Accuracy: {Math.round((matches / moves) * 100)}%</p>
            <button className="btn btn-primary" onClick={initializeGame}>
              Play Again
            </button>
          </div>
        </div>
      )}

      <div className="game-actions">
        <button className="btn btn-secondary" onClick={initializeGame}>
          🔄 New Game
        </button>
      </div>
    </div>
  )
}

export default Memory
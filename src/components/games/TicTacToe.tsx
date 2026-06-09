import React, { useState, useEffect } from 'react'
import './TicTacToe.css'

interface TicTacToeProps {
  onBack: () => void
}

type Player = 'X' | 'O' | null
type GameMode = 'human' | 'ai'
type Difficulty = 'easy' | 'medium' | 'hard'

const TicTacToe: React.FC<TicTacToeProps> = ({ onBack }) => {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null))
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X')
  const [winner, setWinner] = useState<Player | 'tie' | null>(null)
  const [gameMode, setGameMode] = useState<GameMode>('human')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [score, setScore] = useState({ X: 0, O: 0, ties: 0 })
  const [gameHistory, setGameHistory] = useState<number[]>([])
  const [isAnimating, setIsAnimating] = useState(false)

  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
  ]

  const checkWinner = (boardState: Player[]): Player | 'tie' | null => {
    for (const pattern of winPatterns) {
      const [a, b, c] = pattern
      if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
        return boardState[a]
      }
    }
    
    if (boardState.every(cell => cell !== null)) {
      return 'tie'
    }
    
    return null
  }

  const minimax = (boardState: Player[], depth: number, isMaximizing: boolean, alpha: number = -Infinity, beta: number = Infinity): number => {
    const result = checkWinner(boardState)
    
    if (result === 'O') return 10 - depth
    if (result === 'X') return depth - 10
    if (result === 'tie') return 0

    if (isMaximizing) {
      let maxScore = -Infinity
      for (let i = 0; i < 9; i++) {
        if (boardState[i] === null) {
          boardState[i] = 'O'
          const score = minimax(boardState, depth + 1, false, alpha, beta)
          boardState[i] = null
          maxScore = Math.max(score, maxScore)
          alpha = Math.max(alpha, score)
          if (beta <= alpha) break
        }
      }
      return maxScore
    } else {
      let minScore = Infinity
      for (let i = 0; i < 9; i++) {
        if (boardState[i] === null) {
          boardState[i] = 'X'
          const score = minimax(boardState, depth + 1, true, alpha, beta)
          boardState[i] = null
          minScore = Math.min(score, minScore)
          beta = Math.min(beta, score)
          if (beta <= alpha) break
        }
      }
      return minScore
    }
  }

  const getAIMove = (boardState: Player[]): number => {
    if (difficulty === 'easy') {
      // Random move with 70% chance, smart move 30%
      if (Math.random() > 0.3) {
        const availableMoves = boardState.map((cell, index) => cell === null ? index : null).filter(val => val !== null) as number[]
        return availableMoves[Math.floor(Math.random() * availableMoves.length)]
      }
    }
    
    if (difficulty === 'medium') {
      // Block player wins and make winning moves, otherwise random
      // Check for winning move
      for (let i = 0; i < 9; i++) {
        if (boardState[i] === null) {
          boardState[i] = 'O'
          if (checkWinner(boardState) === 'O') {
            boardState[i] = null
            return i
          }
          boardState[i] = null
        }
      }
      
      // Check for blocking move
      for (let i = 0; i < 9; i++) {
        if (boardState[i] === null) {
          boardState[i] = 'X'
          if (checkWinner(boardState) === 'X') {
            boardState[i] = null
            return i
          }
          boardState[i] = null
        }
      }
      
      // Random move
      const availableMoves = boardState.map((cell, index) => cell === null ? index : null).filter(val => val !== null) as number[]
      return availableMoves[Math.floor(Math.random() * availableMoves.length)]
    }

    // Hard difficulty - use minimax
    let bestScore = -Infinity
    let bestMove = 0
    
    for (let i = 0; i < 9; i++) {
      if (boardState[i] === null) {
        boardState[i] = 'O'
        const score = minimax([...boardState], 0, false)
        boardState[i] = null
        
        if (score > bestScore) {
          bestScore = score
          bestMove = i
        }
      }
    }
    
    return bestMove
  }

  const makeMove = (index: number) => {
    if (board[index] || winner || isAnimating) return

    setIsAnimating(true)
    const newBoard = [...board]
    newBoard[index] = currentPlayer
    setBoard(newBoard)
    setGameHistory(prev => [...prev, index])

    const gameResult = checkWinner(newBoard)
    if (gameResult) {
      setWinner(gameResult)
      setScore(prev => ({
        ...prev,
        [gameResult === 'tie' ? 'ties' : gameResult]: prev[gameResult === 'tie' ? 'ties' : gameResult] + 1
      }))
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X')
    }

    setTimeout(() => setIsAnimating(false), 300)
  }

  useEffect(() => {
    if (gameMode === 'ai' && currentPlayer === 'O' && !winner && !isAnimating) {
      const timer = setTimeout(() => {
        const aiMove = getAIMove([...board])
        makeMove(aiMove)
      }, 500)
      
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayer, gameMode, board, winner, isAnimating])

  const resetGame = () => {
    setBoard(Array(9).fill(null))
    setCurrentPlayer('X')
    setWinner(null)
    setGameHistory([])
    setIsAnimating(false)
  }

  const resetScore = () => {
    setScore({ X: 0, O: 0, ties: 0 })
  }

  return (
    <div className="tic-tac-toe">
      <div className="game-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Hub
        </button>
        <h1>Tic Tac Toe</h1>
        <div className="game-controls">
          <select 
            value={gameMode} 
            onChange={(e) => {
              setGameMode(e.target.value as GameMode)
              resetGame()
            }}
            className="mode-select"
          >
            <option value="human">👥 2 Players</option>
            <option value="ai">🤖 vs AI</option>
          </select>
          
          {gameMode === 'ai' && (
            <select 
              value={difficulty} 
              onChange={(e) => {
                setDifficulty(e.target.value as Difficulty)
                resetGame()
              }}
              className="difficulty-select"
            >
              <option value="easy">😊 Easy</option>
              <option value="medium">😐 Medium</option>
              <option value="hard">😈 Hard</option>
            </select>
          )}
        </div>
      </div>

      <div className="game-info">
        <div className="current-player">
          <span className={`player-indicator ${currentPlayer === 'X' ? 'active' : ''}`}>
            Player X: {score.X}
          </span>
          <span className="vs">VS</span>
          <span className={`player-indicator ${currentPlayer === 'O' ? 'active' : ''}`}>
            {gameMode === 'ai' ? 'AI' : 'Player'} O: {score.O}
          </span>
        </div>
        <div className="ties-count">Ties: {score.ties}</div>
      </div>

      <div className="game-container">
        <div className="board">
          {board.map((cell, index) => (
            <div
              key={index}
              className={`cell ${cell ? 'filled' : ''} ${gameHistory.includes(index) ? 'recent-move' : ''}`}
              onClick={() => makeMove(index)}
            >
              {cell && (
                <span className={`mark mark-${cell.toLowerCase()}`}>
                  {cell}
                </span>
              )}
            </div>
          ))}
        </div>

        {winner && (
          <div className="game-result">
            <div className="result-content">
              {winner === 'tie' ? (
                <>
                  <span className="result-icon">🤝</span>
                  <h2>It's a Tie!</h2>
                  <p>Great game! Try again?</p>
                </>
              ) : (
                <>
                  <span className="result-icon">🎉</span>
                  <h2>{gameMode === 'ai' && winner === 'O' ? 'AI Wins!' : `Player ${winner} Wins!`}</h2>
                  <p>Congratulations!</p>
                </>
              )}
              <div className="result-actions">
                <button className="btn btn-primary" onClick={resetGame}>
                  Play Again
                </button>
                <button className="btn btn-secondary" onClick={resetScore}>
                  Reset Score
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="game-actions">
        <button className="btn btn-secondary" onClick={resetGame}>
          🔄 New Game
        </button>
        <button className="btn btn-secondary" onClick={resetScore}>
          📊 Reset Score
        </button>
      </div>
    </div>
  )
}

export default TicTacToe
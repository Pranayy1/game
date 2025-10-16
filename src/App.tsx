import { useState } from 'react'
import './App.css'
import GameHub from './components/GameHub'
import TicTacToe from './components/games/TicTacToe'
import Snake from './components/games/Snake'
import Memory from './components/games/Memory'
import Sudoku from './components/games/Sudoku'
import Pong from './components/games/Pong'
import TowerDefense from './components/games/TowerDefense'
import SpaceInvaders from './components/games/SpaceInvaders'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

type GameType = 'hub' | 'tictactoe' | 'snake' | 'memory' | 'sudoku' | 'pong' | 'towerdefense' | 'spaceinvaders'

function App() {
  const [currentGame, setCurrentGame] = useState<GameType>('hub')

  const renderGame = () => {
    switch (currentGame) {
      case 'tictactoe':
        return <TicTacToe onBack={() => setCurrentGame('hub')} />
      case 'snake':
        return <Snake onBack={() => setCurrentGame('hub')} />
      case 'memory':
        return <Memory onBack={() => setCurrentGame('hub')} />
      case 'sudoku':
        return <Sudoku onBack={() => setCurrentGame('hub')} />
      case 'pong':
        return <Pong onBack={() => setCurrentGame('hub')} />
      case 'towerdefense':
        return <TowerDefense onBack={() => setCurrentGame('hub')} />
      case 'spaceinvaders':
        return <SpaceInvaders onBack={() => setCurrentGame('hub')} />
      default:
        return <GameHub onGameSelect={setCurrentGame} />
    }
  }

  return (
    <div className="app">
      <Navbar currentGame={currentGame} onHomeClick={() => setCurrentGame('hub')} />
      <main className="main-content">
        {renderGame()}
      </main>
      <Footer />
    </div>
  )
}

export default App

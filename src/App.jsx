import { useState } from 'react'
import { LanguageProvider } from './LanguageContext'
import HomeScreen from './components/HomeScreen'
import LearnColors from './components/LearnColors'
import LearnShapes from './components/LearnShapes'
import Sudoku from './components/Sudoku'
import BalloonPop from './components/BalloonPop'
import './App.css'

function App() {
  const [screen, setScreen] = useState('home')

  return (
    <LanguageProvider>
      <div className="app">
        {screen === 'home' && <HomeScreen onNavigate={setScreen} />}
        {screen === 'colors' && <LearnColors onBack={() => setScreen('home')} />}
        {screen === 'shapes' && <LearnShapes onBack={() => setScreen('home')} />}
        {screen === 'sudoku' && <Sudoku onBack={() => setScreen('home')} />}
        {screen === 'balloon-colors' && <BalloonPop mode="colors" onBack={() => setScreen('home')} />}
        {screen === 'balloon-shapes' && <BalloonPop mode="shapes" onBack={() => setScreen('home')} />}
      </div>
    </LanguageProvider>
  )
}

export default App

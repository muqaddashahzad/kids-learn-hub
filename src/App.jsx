import { useState } from 'react'
import { LanguageProvider } from './LanguageContext'
import HomeScreen from './components/HomeScreen'
import LearnColors from './components/LearnColors'
import LearnShapes from './components/LearnShapes'
import Sudoku from './components/Sudoku'
import BalloonPop from './components/BalloonPop'
import ImageQuiz from './components/ImageQuiz'
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
        {screen === 'animals' && <ImageQuiz categoryKey="animals" onBack={() => setScreen('home')} />}
        {screen === 'fruits' && <ImageQuiz categoryKey="fruits" onBack={() => setScreen('home')} />}
        {screen === 'alphabet' && <ImageQuiz categoryKey="alphabet" onBack={() => setScreen('home')} />}
        {screen === 'vegetables' && <ImageQuiz categoryKey="vegetables" onBack={() => setScreen('home')} />}
        {screen === 'kitchen' && <ImageQuiz categoryKey="kitchen" onBack={() => setScreen('home')} />}
        {screen === 'home-items' && <ImageQuiz categoryKey="home" onBack={() => setScreen('home')} />}
        {screen === 'objects' && <ImageQuiz categoryKey="objects" onBack={() => setScreen('home')} />}
      </div>
    </LanguageProvider>
  )
}

export default App

import { useState } from 'react'
import { LanguageProvider } from './LanguageContext'
import HomeScreen from './components/HomeScreen'
import LearnColors from './components/LearnColors'
import LearnShapes from './components/LearnShapes'
import Sudoku from './components/Sudoku'
import BalloonPop from './components/BalloonPop'
import ImageQuiz from './components/ImageQuiz'
import CountingGame from './components/CountingGame'
import MusicPlay from './components/MusicPlay'
import TracingLetters from './components/TracingLetters'
import WordBuilder from './components/WordBuilder'
import OddOneOut from './components/OddOneOut'
import SimpleMath from './components/SimpleMath'
import ColorMixing from './components/ColorMixing'
import MatchPairs from './components/MatchPairs'
import './App.css'

function App() {
  const [screen, setScreen] = useState('home')
  const back = () => setScreen('home')

  return (
    <LanguageProvider>
      <div className="app">
        {screen === 'home' && <HomeScreen onNavigate={setScreen} />}
        {screen === 'colors' && <LearnColors onBack={back} />}
        {screen === 'shapes' && <LearnShapes onBack={back} />}
        {screen === 'sudoku' && <Sudoku onBack={back} />}
        {screen === 'balloon-colors' && <BalloonPop mode="colors" onBack={back} />}
        {screen === 'balloon-shapes' && <BalloonPop mode="shapes" onBack={back} />}
        {screen === 'animals' && <ImageQuiz categoryKey="animals" onBack={back} />}
        {screen === 'fruits' && <ImageQuiz categoryKey="fruits" onBack={back} />}
        {screen === 'alphabet' && <ImageQuiz categoryKey="alphabet" onBack={back} />}
        {screen === 'vegetables' && <ImageQuiz categoryKey="vegetables" onBack={back} />}
        {screen === 'kitchen' && <ImageQuiz categoryKey="kitchen" onBack={back} />}
        {screen === 'home-items' && <ImageQuiz categoryKey="home" onBack={back} />}
        {screen === 'objects' && <ImageQuiz categoryKey="objects" onBack={back} />}
        {screen === 'tools' && <ImageQuiz categoryKey="tools" onBack={back} />}
        {screen === 'counting' && <CountingGame onBack={back} />}
        {screen === 'music' && <MusicPlay onBack={back} />}
        {screen === 'tracing' && <TracingLetters onBack={back} />}
        {screen === 'word-builder' && <WordBuilder onBack={back} />}
        {screen === 'odd-one-out' && <OddOneOut onBack={back} />}
        {screen === 'math' && <SimpleMath onBack={back} />}
        {screen === 'color-mixing' && <ColorMixing onBack={back} />}
        {screen === 'match-pairs' && <MatchPairs onBack={back} />}
      </div>
    </LanguageProvider>
  )
}

export default App

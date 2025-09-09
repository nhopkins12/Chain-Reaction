import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './amplify'
import WordChainGame from './WordChainGame.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WordChainGame />
  </StrictMode>,
)

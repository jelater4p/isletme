import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css' // Trying to restore CSS too
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

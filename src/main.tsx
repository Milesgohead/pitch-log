import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'

// GitHub Pages serves this project under /pitch-log; the bundled app starts at /.
const pathname = window.location.pathname
const basename = pathname === '/pitch-log' || pathname.startsWith('/pitch-log/')
  ? '/pitch-log'
  : '/'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

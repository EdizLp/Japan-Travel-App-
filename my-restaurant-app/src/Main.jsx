import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './AuthProvider' // <-- Import this
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider> {/* <-- Wrap App with this */}
      <App />
    </AuthProvider>
  </StrictMode>,
)
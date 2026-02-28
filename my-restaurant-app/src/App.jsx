import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom' // Add this!
import Login from './Login' // Assuming you made the Login.jsx file
import SignUp from './SignUp'
import './App.css'



function App() {
  const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
      <div className="navbar-container">  
        {/* --- Navbar stays here so it shows on every page --- */}
        <nav className="navbar">
          <div className="nav-logo">🍕 JapanDB</div>
          <ul className="nav-links">
            {/* We use Link to instead of a href to prevent page reloads */}
            <li><Link to="/">Home</Link></li>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/signup">Sign up</Link></li>
            <li><Link to="/admin">Admin</Link></li>
          </ul>
        </nav>

        <main className="content">
          <Routes>
          {/* When at "/", show the Welcome text */}
            <Route path="/" element={
              <>
                <h1>Welcome to the Restaurant Database</h1>
                <p>This is where <b>master_restaurant_list</b> will live.</p>
              </>
              } /> 
            
            {/* Add these two specifically */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
export default App

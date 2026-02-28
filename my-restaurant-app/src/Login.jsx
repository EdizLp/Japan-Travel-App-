import { useState } from 'react';
import { Link } from 'react-router-dom';
import './auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault(); 
    console.log("Logging in with:", email, password);
  };

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <div className="login-form-container">
          <h1>Login</h1>
          
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <input 
                type="email" 
                placeholder="Email Address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            
            <div className="input-group">
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            <div className="forgot-password">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button type="submit" className="primary-btn">Continue</button>
          </form>

          <div className="divider">
            <span>Or Continue With</span>
          </div>

          <button className="google-btn">
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" />
            Google
          </button>

          <p className="signup-prompt">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>
      
      <div className="login-right">
        <div className="image-placeholder">
          [Your 3D Graphic Here]
        </div>
      </div>
    </div>
  );
};

export default Login;
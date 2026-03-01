import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from './SupabaseClient';
import './auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault(); 
    setMessage('');
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Success! Logging you in...');
      // Note: If you have a dashboard or home page, you can use React Router's useNavigate here to redirect them!
    }

    setLoading(false);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <div className="login-form-container">
          <h1>Welcome Back</h1>
          
          <form onSubmit={handleLogin} noValidate>
            <div className="input-group">
              <input 
                type="email" 
                placeholder="Email Address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className={
                  message.toLowerCase().includes('email') || message.toLowerCase().includes('credentials') ? 'input-error' : ''
                }
              />
            </div>
            
            <div className="input-group">
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className={
                  message.toLowerCase().includes('password') || message.toLowerCase().includes('credentials') ? 'input-error' : ''
                }
              />
            </div>

            <div className="forgot-password">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? <div className="spinner"></div> : 'Login'}
            </button>
          </form>

          {message &&(
            <div className="auth-message-container">
              <p className={message.includes('Error') ? 'error-text' : 'success-text'}>
                {message}
              </p>
            </div>
          )}

          <div className="divider">
            <span>Or Continue With</span>
          </div>

          <button className="google-btn" onClick={handleGoogle} type="button">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
            Sign in with Google
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
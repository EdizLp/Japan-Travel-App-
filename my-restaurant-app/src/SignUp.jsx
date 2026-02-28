import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from './SupabaseClient';
import './auth.css'; 

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    
    if (error) setMessage(error.message);
    else setMessage('Success! Check your email to confirm.');
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
      {/* Left Side: The Actual Form */}
      <div className="login-left">
        <div className="login-form-container">
          <h1>Join JapanDB</h1>
          
          <form onSubmit={handleSignUp}>
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
                placeholder="Create Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          {message && <p style={{ color: '#0066ff', marginTop: '10px', textAlign: 'center' }}>{message}</p>}

          <div className="divider">Or Continue With </div>

          <button className="google-btn" onClick={handleGoogle}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
            Sign up with Google
          </button>

          <p className="signup-prompt">
            Already have an account? <a href="/login">Log in</a>
          </p>
        </div>
      </div>

      {/* Right Side: The Decorative Gradient (Hidden on Mobile) */}
      <div className="login-right">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Discover the best of Japan</h2>
          <p>Your personal restaurant guide.</p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from './SupabaseClient';
import './auth.css'; 

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    setMessage('');


    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage("Error: Invalid email");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Error: Passwords do not match.");
      return; // Stop the function here
    }
    if (password.length < 8) {
      setMessage("Error: Password must be at least 8 characters.");
      return;
    }


    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharRegex.test(password)) {
      setMessage("Error: Password must contain at least one special character (example: ! @ # $).");
      return; 
    }
    
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else if (data?.user?.identities?.length === 0) {
    // Supabase found the email but didn't create a new identity 

      setMessage("Error: This email is already registered. Please login.");
    } else {
      setMessage('Success! Please check your email for a confirmation link.');
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
      {/* Left Side: The Actual Form */}
      <div className="login-left">
        <div className="login-form-container">
          <h1>Join JapanDB</h1>
          
          <form onSubmit={handleSignUp} noValidate>
            <div className="input-group">
              <input 
                type="email" 
                placeholder="Email Address" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className={
                  message.toLowerCase().includes('email') && message.includes('Error') ? 'input-error' : ''
                }
              />
            </div>
            <div className="input-group">
              <input 
                type="password" 
                placeholder="Create Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required 
                className={message.toLowerCase().includes('password') ? 'input-error' : ''}
              />
            </div>
            <div className="input-group">
              <input 
                type="password" 
                placeholder="Confirm Password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                className={message.toLowerCase().includes('password') ? 'input-error' : ''}
              />
            </div>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? <div className="spinner"></div>: 'Sign Up'}
            </button>
          </form>
        
          {message &&(
            <div className="auth-message-container">
              <p className={message.includes('Error') ? 'error-text' : 'success-text'}>
                {message}
              </p>
              
            </div>
          )}

          <div className="divider">Or Continue With </div>

          <button className="google-btn" onClick={handleGoogle}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
            Sign up with Google
          </button>

          <p className="signup-prompt">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>

      {/* Right Side: The Decorative Gradient (Hidden on Mobile) */}
      <div className="login-right">
        <div className="image-placeholder">
          [Your 3D Graphic Here]
        </div>
      </div>
    </div>
  );
};

export default SignUp;
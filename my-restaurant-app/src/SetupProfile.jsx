import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './SupabaseClient';
import { useAuth } from './AuthProvider';
import './auth.css';

const SetupProfile = () => {
  const { user } = useAuth(); // Get the logged-in user's ID
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (username.length < 3) {
      setMessage('Error: Username must be at least 3 characters.');
      setLoading(false);
      return;
    }

    // Update the username into your profiles table
    const { error } = await supabase
      .from('profiles')
      .update({username: username})
      .eq('id', user.id);

    if (error) {
      // Catch "duplicate username" errors if your database requires unique usernames
      if (error.code === '23505') {
        setMessage('Error: That username is already taken!');
      } else {
        setMessage(`Error: ${error.message}`);
      }
      setLoading(false);
    } else {
      // Success! Force a full page reload to update the AuthProvider's "Brain"
      // and send them to the home page.
      window.location.href = '/'; 
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <div className="login-form-container">
          <h1>Choose a Username</h1>
          <p style={{ marginBottom: '2rem', color: '#666' }}>
            Welcome to JapanDB! Let's get your profile set up before you continue.
          </p>
          
          <form onSubmit={handleSaveProfile} noValidate>
            <div className="input-group">
              <input 
                type="text" 
                placeholder="Enter a username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
                className={message.includes('Error') ? 'input-error' : ''}
              />
            </div>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? <div className="spinner"></div> : 'Save Profile'}
            </button>
          </form>

          {message &&(
            <div className="auth-message-container">
              <p className={message.includes('Error') ? 'error-text' : 'success-text'}>
                {message}
              </p>
            </div>
          )}
        </div>
      </div>
      
    
    </div>
  );
};

export default SetupProfile;
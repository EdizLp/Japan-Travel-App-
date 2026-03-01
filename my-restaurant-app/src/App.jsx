import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { supabase } from './SupabaseClient';
import Login from './Login';
import SignUp from './SignUp';
import SetupProfile from './SetupProfile';
import TableDetail from './TableDetail';
import TablesDashboard from './TablesDashboard';
import './App.css';


// --- GATEKEEPER 1: Stops logged-in users from seeing Login/Signup ---
const AuthRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) return <Navigate to="/" />;
  return children;
};

// --- GATEKEEPER 2: Protects special pages (Requires them to be logged in) ---
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile } = useAuth();
  
  if (!user) return <Navigate to="/login" />; 
  
  if (allowedRoles && !allowedRoles.includes(profile?.role)) {
    return <Navigate to="/" />; 
  }
  
  return children;
};

// --- GATEKEEPER 3: Forces users to create a username ---
const RequireUsername = ({ children }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>; 
  
  if (user && !profile?.username) {
    return <Navigate to="/setup-profile" />;
  }
  
  return children;
};

// --- GATEKEEPER 4: Kicks users OUT of setup if they already have a username ---
const ProfileCompleteRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>; 

  // If they are logged in AND already have a username, send them to Home
  if (user && profile?.username) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  const { user, profile, loading } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // If Supabase is still fetching data, don't render the app yet to prevent glitches
  if (loading) return <div>Loading...</div>;

  // Check if the user is stuck in the "Setup Profile" phase
  const needsSetup = user && !profile?.username;

  return (
    <BrowserRouter>
      <div className="navbar-container">  
        <nav className="navbar">
          {/* 1. Logo Section (Unclickable during setup!) */}
          <div className="nav-logo">
            {needsSetup ? (
              <span style={{ color: 'white', fontWeight: 'bold' }}>🍕 JapanDB</span>
            ) : (
              <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>🍕 JapanDB</Link>
            )}
          </div>

          {/* 2. Links Section */}
          <ul className="nav-links">
            {needsSetup ? (
              /* IF SETTING UP PROFILE: ONLY SHOW LOGOUT */
              <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
            ) : (
              /* OTHERWISE: SHOW NORMAL NAVBAR */
              <>
                <li><Link to="/">Home</Link></li>
                
                {user && (
                <li><Link to="/tables">Tables</Link></li>
                )}
                
                {user && (profile?.role === 'editor' || profile?.role === 'superuser') && (
                  <li><Link to="/admin">Admin</Link></li>
                )}

                {!user ? (
                  <>
                    <li><Link to="/login">Login</Link></li>
                    <li><Link to="/signup">Sign up</Link></li>
                  </>
                ) : (
                  <>
                    <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
                    <li>
                      <div className="avatar-circle" title={profile?.username || user.email}>
                        {profile?.username 
                          ? profile.username.charAt(0).toUpperCase() 
                          : user.email.charAt(0).toUpperCase()}
                      </div>
                    </li>
                  </>
                )}
              </>
            )}
          </ul>
        </nav>

        <main className="content">
          <Routes>
            <Route path="/" element={
              <RequireUsername>
                <>
                  <h1>Welcome to the Restaurant Database</h1>
                  <p>This is where <b>master_restaurant_list</b> will live.</p>
                </>
              </RequireUsername>
            } /> 
            
            <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
            <Route path="/signup" element={<AuthRoute><SignUp /></AuthRoute>} />

            
            <Route path="/setup-profile" element={
              <ProtectedRoute>
                <ProfileCompleteRoute>
                <SetupProfile />
                </ProfileCompleteRoute>
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['editor', 'superuser']}>
                <RequireUsername>
                  <h1>Admin Dashboard (Top Secret)</h1>
                </RequireUsername>
              </ProtectedRoute>
            } />

            {/* The Dashboard: Lists all of their tables */}
            <Route path="/tables" element={
              <ProtectedRoute>
                <RequireUsername>
                  <TablesDashboard /> 
                </RequireUsername>
              </ProtectedRoute>
            } />


            {/* The Actual Spreadsheet: Notice the /:tableId at the end */}
            <Route path="/tables/:tableId" element={
              <ProtectedRoute>
                <RequireUsername>
                  <TableDetail /> {/* This is your current Tables.jsx file, renamed */}
                </RequireUsername>
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App;
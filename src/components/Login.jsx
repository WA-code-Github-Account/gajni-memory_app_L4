import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        alert('Check your email for confirmation!');
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err.error_description || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative'
    }}>
      <div className="auth-form">
        <h2>{isSignUp ? 'Create Account' : 'Login'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              placeholder="Email"
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
              minLength="6"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="auth-button"
          >
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Login')}
          </button>
        </form>
        
        <div className="auth-separator">
          <span>OR</span>
        </div>
        
        <button 
          onClick={signInWithGoogle}
          className="google-auth-button"
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
            <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.83 18.17 13.74 18.56 12.5 18.56C9.62 18.56 7.17 16.52 6.21 13.85H2.64V16.66C4.59 20.43 8.56 23 12 23Z" fill="#34A853"/>
            <path d="M6.21 13.85C5.93 13.02 5.77 12.13 5.77 11.25C5.77 10.37 5.93 9.48 6.21 8.65V5.84H2.64C1.6 7.75 1 10.02 1 12.25C1 14.48 1.6 16.75 2.64 18.66L6.21 15.85L6.21 13.85Z" fill="#FBBC05"/>
            <path d="M12 4.75C13.81 4.75 15.4 5.36 16.64 6.47L19.36 3.75C17.45 1.94 14.97 1 12 1C8.56 1 5.59 2.57 3.64 5.34L7.17 8.15C7.83 6.15 9.73 4.75 12 4.75Z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>
        
        <div className="auth-toggle">
          <p>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              type="button" 
              onClick={() => setIsSignUp(!isSignUp)}
              className="toggle-link"
            >
              {isSignUp ? 'Login' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
      
      <footer className="login-footer" style={{
        position: 'absolute',
        bottom: '20px',
        width: '100%',
        textAlign: 'center',
        color: '#00f7ff',
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        <p style={{ margin: 0 }}>Created by: WA.SIDDIQUI ®</p>
      </footer>
    </div>
  );
};

export default Login;

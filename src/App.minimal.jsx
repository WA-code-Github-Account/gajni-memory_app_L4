import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import useMemories from './hooks/useMemories';

function App() {
  const { user, loading: authLoading } = useAuth();
  console.log("Auth state:", { user, authLoading }); // Debug logging
  
  // Simple test to see if the issue is with useMemories
  const [simpleState, setSimpleState] = useState("Initial");
  
  // If still loading auth state, show a loading indicator
  if (authLoading) {
    return (
      <div className="app-container">
        <h1>Gajni Memory</h1>
        <div className="loading-state">
          <p>Loading authentication... {simpleState}</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, try to show a minimal version first
  if (user) {
    console.log("User is authenticated:", user);
    return (
      <div className="app-container">
        <header className="app-header">
          <h1>Gajni Memory</h1>
          <div className="user-info">
            <span>Welcome, {user.email || user.user_metadata?.name || 'User'}!</span>
            <button onClick={() => {
              console.log("Logout clicked");
              const { signOut } = useAuth();
              signOut();
            }} className="logout-btn">Logout</button>
          </div>
        </header>
        <div>
          <p>Authenticated user interface loaded</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show the login page
  console.log("Showing login page");
  return <Login />;
}

export default App;
import React from 'react';
import { useAuth } from '../../context/AuthContext';

export function Header() {
  const { isAuthenticated, isDemo, logout } = useAuth();

  return (
    <header className="App-header">
      <h1>Oura Heart Rate History</h1>
      {isAuthenticated && (
        <div className="header-actions">
          {isDemo && <span className="demo-badge" aria-label="Demo mode">Demo</span>}
          <button type="button" onClick={logout} className="logout-button">
            Log out
          </button>
        </div>
      )}
    </header>
  );
}

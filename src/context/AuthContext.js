import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_TOKEN = 'ouraToken';
const STORAGE_AGE = 'ouraAge';

const AuthContext = createContext(null);

function parseAge(value) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return null;
  return Math.min(100, Math.max(18, n));
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState('');
  const [age, setAge] = useState(35);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [demoHeartRateData, setDemoHeartRateData] = useState(null);

  useEffect(() => {
    try {
      const savedToken = sessionStorage.getItem(STORAGE_TOKEN);
      const savedAge = sessionStorage.getItem(STORAGE_AGE);
      if (savedToken) {
        setToken(savedToken);
        setAge(savedAge ? (parseAge(savedAge) ?? 35) : 35);
        setIsAuthenticated(true);
      }
    } catch (e) {
      // sessionStorage not available or quota
    }
  }, []);

  const login = useCallback((newToken, newAge) => {
    const t = typeof newToken === 'string' ? newToken.trim() : '';
    const a = parseAge(String(newAge)) ?? 35;
    setToken(t);
    setAge(a);
    setIsAuthenticated(true);
    setIsDemo(false);
    setDemoHeartRateData(null);
    try {
      sessionStorage.setItem(STORAGE_TOKEN, t);
      sessionStorage.setItem(STORAGE_AGE, String(a));
    } catch (e) {}
  }, []);

  const logout = useCallback(() => {
    setToken('');
    setIsAuthenticated(false);
    setIsDemo(false);
    setDemoHeartRateData(null);
    try {
      sessionStorage.removeItem(STORAGE_TOKEN);
      sessionStorage.removeItem(STORAGE_AGE);
    } catch (e) {}
  }, []);

  const setAgeOnly = useCallback((newAge) => {
    const a = parseAge(String(newAge)) ?? age;
    setAge(a);
    try {
      if (token) sessionStorage.setItem(STORAGE_AGE, String(a));
    } catch (e) {}
  }, [age, token]);

  const enableDemo = useCallback((demoData) => {
    setDemoHeartRateData(demoData);
    setIsDemo(true);
    setIsAuthenticated(true);
  }, []);

  const value = {
    token,
    age,
    setAge: setAgeOnly,
    isAuthenticated,
    isDemo,
    demoHeartRateData,
    login,
    logout,
    enableDemo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

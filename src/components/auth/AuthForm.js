import React, { useState, useRef, useCallback } from 'react';
import { personalInfo } from '../../api/oura';
import { useAuth } from '../../context/AuthContext';
import { TokenInput } from './TokenInput';

const TOKEN_MIN = 20;
const TOKEN_MAX = 500;

function parseAge(value) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return null;
  return Math.min(100, Math.max(18, n));
}

export function AuthForm() {
  const { login, enableDemo } = useAuth();
  const [token, setToken] = useState('');
  const [age, setAge] = useState(35);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tokenError, setTokenError] = useState(null);
  const acRef = useRef(null);

  const validateToken = useCallback((t) => {
    const s = (t || '').trim();
    if (!s) return 'Token is required.';
    if (s.length < TOKEN_MIN) return `Token should be at least ${TOKEN_MIN} characters.`;
    if (s.length > TOKEN_MAX) return `Token should be at most ${TOKEN_MAX} characters.`;
    return null;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const t = token.trim();
    const tokenErr = validateToken(t);
    setTokenError(tokenErr || null);
    if (tokenErr) return;

    const a = parseAge(String(age)) ?? 35;
    setAge(a);

    if (acRef.current) acRef.current.abort();
    acRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      await personalInfo(t, acRef.current.signal);
      login(t, a);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message.startsWith('401') ? 'Invalid or expired token. Please check your token and try again.' : err.message);
    } finally {
      setLoading(false);
      acRef.current = null;
    }
  };

  const handleDemo = () => {
    const DEMO_DATA = [
      { timestamp: new Date(Date.now() - 3600 * 1000 * 6).toISOString(), bpm: 62 },
      { timestamp: new Date(Date.now() - 3600 * 1000 * 5).toISOString(), bpm: 75 },
      { timestamp: new Date(Date.now() - 3600 * 1000 * 4).toISOString(), bpm: 88 },
      { timestamp: new Date(Date.now() - 3600 * 1000 * 3).toISOString(), bpm: 102 },
      { timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(), bpm: 120 },
      { timestamp: new Date(Date.now() - 3600 * 1000 * 1).toISOString(), bpm: 135 },
      { timestamp: new Date(Date.now()).toISOString(), bpm: 110 },
      { timestamp: new Date(Date.now() - 1800 * 1000).toISOString(), bpm: 95 },
      { timestamp: new Date(Date.now() - 900 * 1000).toISOString(), bpm: 80 },
      { timestamp: new Date(Date.now() - 300 * 1000).toISOString(), bpm: 70 },
    ];
    enableDemo(DEMO_DATA);
  };

  return (
    <div className="auth-form">
      <p className="auth-value-prop">See your heart rate history and zones from Oura.</p>
      <h2>Connect to Your Oura Ring</h2>
      {error && <div className="error-message" role="alert">{error}</div>}
      <form onSubmit={handleSubmit}>
        <TokenInput
          value={token}
          onChange={(v) => { setToken(v); setTokenError(null); }}
          disabled={loading}
          error={tokenError}
        />
        <div className="form-group">
          <label htmlFor="oura-age">Your age (for heart rate zone calculation)</label>
          <input
            id="oura-age"
            type="number"
            min={18}
            max={100}
            aria-label="Your age for heart rate zones"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Connecting…' : 'Connect'}
        </button>
      </form>
      <div className="demo-section">
        <button type="button" className="demo-button" onClick={handleDemo} disabled={loading}>
          View Demo
        </button>
        <p className="demo-info">Or view demo data without connecting.</p>
      </div>
    </div>
  );
}

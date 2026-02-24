import React from 'react';

export function TokenInput({ value, onChange, disabled, error }) {
  return (
    <div className="form-group">
      <label htmlFor="oura-token">Oura Personal Access Token</label>
      <input
        id="oura-token"
        type="password"
        autoComplete="off"
        aria-label="Oura personal access token"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your Oura token"
        disabled={disabled}
        required
      />
      {error && <span className="form-error">{error}</span>}
      <a
        href="https://cloud.ouraring.com/personal-access-tokens"
        target="_blank"
        rel="noopener noreferrer"
        className="token-link"
      >
        Get your token here
      </a>
      <p className="token-hint">Create a token at Oura Cloud; paste it below. We only keep it for this session.</p>
    </div>
  );
}

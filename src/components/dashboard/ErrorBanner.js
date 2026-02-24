import React from 'react';

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="error-message" role="alert">
      {message}
      {onRetry && (
        <button type="button" className="error-retry" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

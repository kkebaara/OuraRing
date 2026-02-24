import React from 'react';

export function LoadingState() {
  return (
    <div className="loading-message" aria-live="polite">
      Loading heart rate data…
    </div>
  );
}

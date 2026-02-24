import React from 'react';

export function EmptyState() {
  return (
    <div className="no-data">
      <p>No heart rate data available for the selected time period.</p>
      <p>Try selecting a different date range or make sure your Oura Ring is synced.</p>
    </div>
  );
}

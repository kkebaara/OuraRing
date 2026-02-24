import React from 'react';

export function StatsCards({ statistics }) {
  if (!statistics) return null;
  return (
    <div className="stats-container">
      <div className="stat-card">
        <div className="stat-value">{statistics.min}</div>
        <div className="stat-label">Min HR</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{statistics.avg}</div>
        <div className="stat-label">Avg HR</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{statistics.max}</div>
        <div className="stat-label">Max HR</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{statistics.count}</div>
        <div className="stat-label">Readings</div>
      </div>
    </div>
  );
}

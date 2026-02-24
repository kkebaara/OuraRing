import React from 'react';
import { formatDate } from '../../utils/dateHelpers';

const VIEWS = [
  { id: 'day', label: 'Last 24 Hours' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
];

export function TimeRangeTabs({ view, dateRange, onViewChange }) {
  return (
    <div className="time-selector">
      <h2>Heart Rate History</h2>
      <div className="time-range-tabs" role="tablist" aria-label="Time range">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={view === v.id}
            aria-controls="heart-rate-panel"
            id={`tab-${v.id}`}
            className={view === v.id ? 'active' : ''}
            onClick={() => onViewChange(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div className="date-range-info" id="heart-rate-panel" role="tabpanel">
        {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}
      </div>
    </div>
  );
}

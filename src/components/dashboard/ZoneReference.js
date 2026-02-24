import React from 'react';

export function ZoneReference({ heartRateZones }) {
  if (!heartRateZones) return null;
  const zones = Object.values(heartRateZones);

  return (
    <div className="zone-reference">
      <h3>Your Heart Rate Zones</h3>
      <div className="zone-grid">
        {zones.map((zone) => (
          <div
            key={zone.name}
            className="zone-card"
            style={{ backgroundColor: zone.color }}
          >
            <div className="zone-name">{zone.name}</div>
            <div className="zone-range">{zone.min}-{zone.max} bpm</div>
          </div>
        ))}
      </div>
    </div>
  );
}

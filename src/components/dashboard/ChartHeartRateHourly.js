import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

export function ChartHeartRateHourly({ dailyData }) {
  if (!dailyData || dailyData.length === 0) return null;

  return (
    <div className="chart-container" aria-label="Heart rate by hour">
      <h3>Heart Rate by Hour</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={dailyData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hourLabel" />
          <YAxis domain={[(dataMin) => Math.max(0, dataMin - 10), (dataMax) => dataMax + 10]} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="custom-tooltip">
                  <p className="time">{d.hourLabel}</p>
                  <p className="bpm">{d.avgBpm} bpm</p>
                  <p className="zone" style={{ color: d.zoneColor }}>{d.zone}</p>
                  <p className="readings">{d.readings} readings</p>
                </div>
              );
            }}
          />
          <Bar dataKey="avgBpm" name="Average BPM" animationDuration={500}>
            {dailyData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.zoneColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

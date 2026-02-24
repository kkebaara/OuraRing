import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

export function ChartHeartRateLine({ processedHeartRateData, heartRateZones }) {
  if (!processedHeartRateData || processedHeartRateData.length === 0) return null;
  const zonesList = heartRateZones ? Object.values(heartRateZones) : [];

  return (
    <div className="chart-container" aria-label="Detailed heart rate over time">
      <h3>Detailed Heart Rate</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={processedHeartRateData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            type="category"
            tickFormatter={(tick, index) =>
              index % Math.ceil(processedHeartRateData.length / 10) === 0 ? tick : ''
            }
          />
          <YAxis domain={[(dataMin) => Math.max(30, dataMin - 10), (dataMax) => dataMax + 10]} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="bpm" stroke="#ff7300" dot={false} activeDot={{ r: 5 }} />
          {zonesList.map((zone) => (
            <Line
              key={zone.name}
              type="monotone"
              dataKey={() => zone.min}
              stroke={zone.color}
              strokeDasharray="5 5"
              dot={false}
              activeDot={false}
              name={`${zone.name} (${zone.min} bpm)`}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

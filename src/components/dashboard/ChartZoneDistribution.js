import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export function ChartZoneDistribution({ zoneDistribution }) {
  if (!zoneDistribution || zoneDistribution.length === 0) return null;

  return (
    <div className="chart-container" aria-label="Heart rate zone distribution">
      <h3>Heart Rate Zone Distribution</h3>
      <div className="chart-grid">
        <div className="pie-chart">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={zoneDistribution}
                dataKey="percentage"
                nameKey="zone"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {zoneDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="zone-table">
          <h4>Time in Each Zone</h4>
          <table>
            <thead>
              <tr>
                <th>Zone</th>
                <th>Time</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {zoneDistribution.map((zone, i) => (
                <tr key={i}>
                  <td>
                    <span className="zone-color-dot" style={{ backgroundColor: zone.color }} aria-hidden />
                    {zone.zone}
                  </td>
                  <td>{Math.round(zone.count * 5)} min</td>
                  <td>{zone.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

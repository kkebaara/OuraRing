import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import './App.css';

function App() {
  // States
  const [token, setToken] = useState('');
  const [age, setAge] = useState(35);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [heartRateData, setHeartRateData] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  const [view, setView] = useState('day'); // 'day', 'week', 'month'
  const [isDemo, setIsDemo] = useState(false);
  // Sample demo heart rate data
  const DEMO_HEART_RATE_DATA = [
    { timestamp: new Date(Date.now() - 3600 * 1000 * 6).toISOString(), bpm: 62 },
    { timestamp: new Date(Date.now() - 3600 * 1000 * 5).toISOString(), bpm: 75 },
    { timestamp: new Date(Date.now() - 3600 * 1000 * 4).toISOString(), bpm: 88 },
    { timestamp: new Date(Date.now() - 3600 * 1000 * 3).toISOString(), bpm: 102 },
    { timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(), bpm: 120 },
    { timestamp: new Date(Date.now() - 3600 * 1000 * 1).toISOString(), bpm: 135 },
    { timestamp: new Date(Date.now()).toISOString(), bpm: 110 },
    { timestamp: new Date(Date.now() - 1800 * 1000).toISOString(), bpm: 95 },
    { timestamp: new Date(Date.now() - 900 * 1000).toISOString(), bpm: 80 },
    { timestamp: new Date(Date.now() - 300 * 1000).toISOString(), bpm: 70 }
  ];

  // Handler for demo button
  const handleDemo = () => {
    setIsDemo(true);
    setIsAuthenticated(true);
    setHeartRateData(DEMO_HEART_RATE_DATA);
    setError(null);
  };

  // Calculate heart rate zones based on age
  const calculateZones = (age) => {
    const maxHR = 220 - age;
    return {
      zone1: { min: Math.round(maxHR * 0.5), max: Math.round(maxHR * 0.6), name: "Recovery", color: "#91C4F2" },
      zone2: { min: Math.round(maxHR * 0.6), max: Math.round(maxHR * 0.7), name: "Moderate", color: "#8CA0D7" },
      zone3: { min: Math.round(maxHR * 0.7), max: Math.round(maxHR * 0.8), name: "Aerobic", color: "#9D79BC" },
      zone4: { min: Math.round(maxHR * 0.8), max: Math.round(maxHR * 0.9), name: "Anaerobic", color: "#A14DA0" },
      zone5: { min: Math.round(maxHR * 0.9), max: maxHR, name: "Maximum", color: "#7E1F86" }
    };
  };

  const heartRateZones = calculateZones(age);

  // Get zone for heart rate
  const getZoneForHeartRate = (hr, zones) => {
    if (!hr) return { name: "Unknown", color: "#D3D3D3" };
    if (hr < zones.zone1.min) return { name: "Below Zones", color: "#D3D3D3" };
    if (hr <= zones.zone1.max) return zones.zone1;
    if (hr <= zones.zone2.max) return zones.zone2;
    if (hr <= zones.zone3.max) return zones.zone3;
    if (hr <= zones.zone4.max) return zones.zone4;
    if (hr <= zones.zone5.max) return zones.zone5;
    return { name: "Above Maximum", color: "#FF0000" };
  };

  // Handle authentication
  const handleAuthentication = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Test the token
      const response = await fetch('https://api.ouraring.com/v2/usercollection/personal_info', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }
      
      // If successful, set authenticated
      setIsAuthenticated(true);
      // Store token in localStorage for persistence
      localStorage.setItem('ouraToken', token);
      localStorage.setItem('ouraAge', age.toString());
      
      // Fetch heart rate data
      fetchHeartRateData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load saved token on startup
  useEffect(() => {
    const savedToken = localStorage.getItem('ouraToken');
    const savedAge = localStorage.getItem('ouraAge');
    
    if (savedToken) {
      setToken(savedToken);
      setAge(savedAge ? parseInt(savedAge) : 35);
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch heart rate data when authenticated or date range changes
  useEffect(() => {
    if (isAuthenticated && !isDemo) {
      fetchHeartRateData();
    }
  }, [isAuthenticated, dateRange, isDemo]);

  // Set date range based on view
  const updateDateRange = (view) => {
    const today = new Date();
    let startDate;
    
    switch(view) {
      case 'day':
        // Last 24 hours
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 1);
        break;
      case 'week':
        // Last 7 days
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        // Last 30 days
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 1);
    }
    
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
    
    setView(view);
  };

  // Fetch heart rate data
  const fetchHeartRateData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { startDate, endDate } = dateRange;
      
      // Format timestamps for API query (include full day)
      const startDateTime = `${startDate}T00:00:00Z`;
      const endDateTime = `${endDate}T23:59:59Z`;
      
      console.log(`Fetching heart rate data from ${startDateTime} to ${endDateTime}`);
      
      const response = await fetch(
        `https://api.ouraring.com/v2/usercollection/heartrate?start_datetime=${startDateTime}&end_datetime=${endDateTime}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch heart rate data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Heart rate data:', data);
      
      if (data.data && data.data.length > 0) {
        setHeartRateData(data.data);
      } else {
        setHeartRateData([]);
        setError('No heart rate data available for this time range');
      }
    } catch (err) {
      setError(err.message);
      setHeartRateData([]);
    } finally {
      setLoading(false);
    }
  };

  // Process heart rate data for charts
  const processedHeartRateData = heartRateData.map(hr => {
    const timestamp = new Date(hr.timestamp);
    const zone = getZoneForHeartRate(hr.bpm, heartRateZones);
    return {
      ...hr,
      time: `${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}`,
      date: timestamp.toLocaleDateString(),
      dateTime: timestamp,
      zone: zone.name,
      zoneColor: zone.color
    };
  });
  
  // Group data for daily view
  const getDailyData = () => {
    if (processedHeartRateData.length === 0) return [];
    
    // Group by hour
    const hourlyData = processedHeartRateData.reduce((acc, hr) => {
      const hour = hr.dateTime.getHours();
      if (!acc[hour]) {
        acc[hour] = [];
      }
      acc[hour].push(hr);
      return acc;
    }, {});
    
    // Calculate average for each hour
    return Object.keys(hourlyData).map(hour => {
      const readings = hourlyData[hour];
      const avgBpm = readings.reduce((sum, r) => sum + r.bpm, 0) / readings.length;
      const zone = getZoneForHeartRate(avgBpm, heartRateZones);
      return {
        hour: parseInt(hour),
        hourLabel: `${hour}:00`,
        avgBpm: Math.round(avgBpm),
        zone: zone.name,
        zoneColor: zone.color,
        readings: readings.length
      };
    }).sort((a, b) => a.hour - b.hour);
  };
  
  // Calculate time spent in each zone
  const calculateZoneDistribution = () => {
    if (processedHeartRateData.length === 0) return [];
    
    // Count readings in each zone
    const zoneCounts = processedHeartRateData.reduce((acc, hr) => {
      const zone = getZoneForHeartRate(hr.bpm, heartRateZones).name;
      acc[zone] = (acc[zone] || 0) + 1;
      return acc;
    }, {});
    
    // Convert to percentage
    const total = processedHeartRateData.length;
    return Object.entries(zoneCounts).map(([zone, count]) => {
      const percentage = (count / total) * 100;
      return {
        zone,
        count,
        percentage: Math.round(percentage),
        color: Object.values(heartRateZones).find(z => z.name === zone)?.color || 
               (zone === "Below Zones" ? "#D3D3D3" : "#FF0000")
      };
    });
  };
  
  // Calculate daily statistics
  const calculateStatistics = () => {
    if (processedHeartRateData.length === 0) return null;
    
    const bpms = processedHeartRateData.map(d => d.bpm);
    return {
      min: Math.min(...bpms),
      max: Math.max(...bpms),
      avg: Math.round(bpms.reduce((sum, bpm) => sum + bpm, 0) / bpms.length),
      count: bpms.length
    };
  };
  
  const dailyData = getDailyData();
  const zoneDistribution = calculateZoneDistribution();
  const statistics = calculateStatistics();

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setToken('');
    setHeartRateData([]);
    localStorage.removeItem('ouraToken');
    localStorage.removeItem('ouraAge');
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Render
  return (
    <div className="App">
      <header className="App-header">
        <h1>Oura Heart Rate History</h1>
        {isAuthenticated && (
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        )}
      </header>
      
      <main className="App-main">
        {/* Authentication Form */}
        {!isAuthenticated ? (
          <div className="auth-form">
            <h2>Connect to Your Oura Ring</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleAuthentication}>
              <div className="form-group">
                <label>Oura Personal Access Token</label>
                <input 
                  type="text" 
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter your Oura token"
                  required
                />
                <a 
                  href="https://cloud.ouraring.com/personal-access-tokens" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="token-link"
                >
                  Get your token here
                </a>
              </div>
              <div className="form-group">
                <label>Your Age (for heart rate zone calculation)</label>
                <input 
                  type="number" 
                  min="18" 
                  max="100"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value))}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="submit-button"
                disabled={loading}
              >
                {loading ? 'Connecting...' : 'Connect'}
              </button>
            </form>
            <div className="demo-section">
              <button className="demo-button" onClick={handleDemo} disabled={loading}>
                View Demo
              </button>
              <p className="demo-info">Or view demo data without connecting.</p>
            </div>
          </div>
        ) : (
          /* Heart Rate Data Section */
          <div className="heart-rate-analysis">
            {error && <div className="error-message">{error}</div>}
            {loading && <div className="loading-message">Loading heart rate data...</div>}
            
            {/* Time Range Selector */}
            <div className="time-selector">
              <h2>Heart Rate History</h2>
              
              <div className="time-range-tabs">
                <button 
                  className={view === 'day' ? 'active' : ''}
                  onClick={() => updateDateRange('day')}
                >
                  Last 24 Hours
                </button>
                <button 
                  className={view === 'week' ? 'active' : ''}
                  onClick={() => updateDateRange('week')}
                >
                  Week
                </button>
                <button 
                  className={view === 'month' ? 'active' : ''}
                  onClick={() => updateDateRange('month')}
                >
                  Month
                </button>
              </div>
              
              <div className="date-range-info">
                {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}
              </div>
            </div>
            
            {/* Heart Rate Statistics */}
            {statistics && (
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
            )}
            
            {/* Heart Rate Charts */}
            {heartRateData.length > 0 ? (
              <>
                {/* Daily View */}
                {view === 'day' && dailyData.length > 0 && (
                  <div className="chart-container">
                    <h3>Heart Rate by Hour</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hourLabel" />
                        <YAxis 
                          domain={[
                            dataMin => Math.max(0, dataMin - 10), 
                            dataMax => dataMax + 10
                          ]} 
                        />
                        <Tooltip content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="custom-tooltip">
                                <p className="time">{data.hourLabel}</p>
                                <p className="bpm">{data.avgBpm} bpm</p>
                                <p className="zone" style={{ color: data.zoneColor }}>
                                  {data.zone}
                                </p>
                                <p className="readings">{data.readings} readings</p>
                              </div>
                            );
                          }
                          return null;
                        }} />
                        <Bar 
                          dataKey="avgBpm" 
                          name="Average BPM" 
                          animationDuration={500}
                        >
                          {dailyData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.zoneColor} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                {/* Raw Heart Rate Data (for all views) */}
                <div className="chart-container">
                  <h3>Detailed Heart Rate</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={processedHeartRateData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        type="category"
                        tickFormatter={(tick, index) => {
                          // Show fewer ticks for readability
                          return index % Math.ceil(processedHeartRateData.length / 10) === 0 ? tick : '';
                        }}
                      />
                      <YAxis 
                        domain={[
                          dataMin => Math.max(30, dataMin - 10), 
                          dataMax => dataMax + 10
                        ]} 
                      />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="bpm"
                        stroke="#ff7300"
                        dot={false}
                        activeDot={{ r: 5 }}
                      />
                      
                      {/* Zone threshold lines */}
                      {Object.values(heartRateZones).map(zone => (
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
                
                {/* Zone Distribution */}
                {zoneDistribution.length > 0 && (
                  <div className="chart-container">
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
                                  <span 
                                    className="zone-color-dot"
                                    style={{ backgroundColor: zone.color }}
                                  ></span>
                                  {zone.zone}
                                </td>
                                <td>
                                  {/* Each measurement is about 5 minutes */}
                                  {Math.round(zone.count * 5)} min
                                </td>
                                <td>{zone.percentage}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Zone Thresholds Reference */}
                <div className="zone-reference">
                  <h3>Your Heart Rate Zones</h3>
                  <div className="zone-grid">
                    {Object.values(heartRateZones).map(zone => (
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
              </>
            ) : (
              !loading && (
                <div className="no-data">
                  <p>No heart rate data available for the selected time period.</p>
                  <p>Try selecting a different date range or make sure your Oura Ring is synced.</p>
                </div>
              )
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
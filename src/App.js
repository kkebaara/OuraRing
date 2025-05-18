import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import './App.css';

// Sample data for demo mode
const SAMPLE_HEART_RATE_DATA = generateSampleHeartRateData();

function App() {
  // States
  const [token, setToken] = useState('');
  const [age, setAge] = useState(35);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [heartRateData, setHeartRateData] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  const [view, setView] = useState('day'); // 'day', 'week', 'month'

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
      setIsDemo(false);
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

  // Enter demo mode
  const handleDemoMode = () => {
    setIsDemo(true);
    setHeartRateData(SAMPLE_HEART_RATE_DATA);
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
    if (isAuthenticated) {
      fetchHeartRateData();
    }
  }, [isAuthenticated, dateRange]);

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
    
    // If in demo mode, regenerate sample data for the new view
    if (isDemo) {
      switch(view) {
        case 'day':
          setHeartRateData(SAMPLE_HEART_RATE_DATA);
          break;
        case 'week':
          setHeartRateData(generateSampleHeartRateData(7));
          break;
        case 'month':
          setHeartRateData(generateSampleHeartRateData(30));
          break;
        default:
          setHeartRateData(SAMPLE_HEART_RATE_DATA);
      }
    }
  };

  // Fetch heart rate data
  const fetchHeartRateData = async () => {
    if (isDemo) return; // Skip API call in demo mode
    
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
    setIsDemo(false);
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
        {(isAuthenticated || isDemo) && (
          <button onClick={handleLogout} className="logout-button">
            {isDemo ? 'Exit Demo' : 'Logout'}
          </button>
        )}
      </header>
      
      <main className="App-main">
        {/* Authentication Form */}
        {!isAuthenticated && !isDemo ? (
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
                <div className="token-links">
                  <a 
                    href="https://cloud.ouraring.com/personal-access-tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="token-link"
                  >
                    Get your token here
                  </a>
                </div>
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
              
              <div className="demo-option">
                <p>Don't have an Oura Ring?</p>
                <button 
                  type="button" 
                  className="demo-button"
                  onClick={handleDemoMode}
                >
                  Try Demo Mode
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Heart Rate Data Section */
          <div className="heart-rate-analysis">
            {isDemo && (
              <div className="demo-banner">
                <strong>Demo Mode:</strong> Showing sample data. Connect your Oura Ring for your actual heart rate data.
              </div>
            )}
            
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
              <div className="charts-container">
                <Slider
                  dots={true}
                  infinite={false}
                  speed={500}
                  slidesToShow={1}
                  slidesToScroll={1}
                  arrows={true}
                  className="charts-carousel"
                >
                  {/* Daily View */}
                  {view === 'day' && dailyData.length > 0 && (
                    <div className="chart-slide">
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
                  <div className="chart-slide">
                    <h3>Heart Rate History</h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={processedHeartRateData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="time" 
                          type="category"
                          tickFormatter={(tick, index) => {
                            // Show fewer ticks for readability
                            return index % Math.ceil(processedHeartRateData.length / 8) === 0 ? tick : '';
                          }}
                          tick={{ fontSize: 12, fill: '#666' }}
                          axisLine={{ stroke: '#ccc' }}
                        />
                        <YAxis 
                          domain={[
                            dataMin => Math.max(30, dataMin - 10), 
                            dataMax => dataMax + 10
                          ]}
                          tick={{ fontSize: 12, fill: '#666' }}
                          axisLine={{ stroke: '#ccc' }}
                          label={{ 
                            value: 'Heart Rate (BPM)', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { textAnchor: 'middle', fill: '#666' }
                          }}
                        />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="custom-tooltip">
                                  <p className="time">{data.time}</p>
                                  <p className="date">{data.date}</p>
                                  <p className="bpm" style={{ color: data.zoneColor }}>
                                    {data.bpm} bpm
                                  </p>
                                  <p className="zone" style={{ color: data.zoneColor }}>
                                    {data.zone}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend 
                          verticalAlign="top" 
                          height={36}
                          formatter={(value, entry) => (
                            <span style={{ color: '#666' }}>{value}</span>
                          )}
                        />
                        <Line
                          type="monotone"
                          dataKey="bpm"
                          name="Heart Rate"
                          stroke="#ff7300"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 6, strokeWidth: 2 }}
                          animationDuration={1000}
                        />
                        
                        {/* Zone threshold lines with labels */}
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
                            strokeWidth={1.5}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                    
                    {/* Zone Legend */}
                    <div className="zone-legend">
                      {Object.values(heartRateZones).map(zone => (
                        <div key={zone.name} className="zone-legend-item">
                          <span 
                            className="zone-color" 
                            style={{ backgroundColor: zone.color }}
                          ></span>
                          <span className="zone-name">{zone.name}</span>
                          <span className="zone-range">{zone.min}-{zone.max} bpm</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Zone Distribution */}
                  {zoneDistribution.length > 0 && (
                    <div className="chart-slide">
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
                  <div className="chart-slide">
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
                </Slider>
              </div>
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

// Generate realistic sample heart rate data
function generateSampleHeartRateData(days = 1) {
  const data = [];
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - days);
  
  // Generate data for each day
  for (let day = 0; day < days; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    
    // Generate data for each hour
    for (let hour = 0; hour < 24; hour++) {
      const currentHour = new Date(currentDate);
      currentHour.setHours(hour);
      
      // Determine base heart rate based on time of day
      let baseHeartRate;
      if (hour >= 0 && hour < 6) {
        // Night/sleep: lower heart rate
        baseHeartRate = 55;
      } else if (hour >= 6 && hour < 9) {
        // Morning: gradually increasing
        baseHeartRate = 65 + (hour - 6) * 5;
      } else if (hour >= 9 && hour < 12) {
        // Morning activity: moderate
        baseHeartRate = 75;
      } else if (hour >= 12 && hour < 14) {
        // Lunch time: slightly elevated
        baseHeartRate = 80;
      } else if (hour >= 14 && hour < 17) {
        // Afternoon: moderate
        baseHeartRate = 75;
      } else if (hour >= 17 && hour < 20) {
        // Evening exercise: higher
        const exerciseDay = day % 2 === 0; // Exercise every other day
        baseHeartRate = exerciseDay ? 110 : 85;
      } else {
        // Evening relaxation: gradually decreasing
        baseHeartRate = 70 - (hour - 20) * 3;
      }
      
      // Generate 12 readings per hour (every 5 minutes)
      for (let minute = 0; minute < 60; minute += 5) {
        const timestamp = new Date(currentHour);
        timestamp.setMinutes(minute);
        
        // Add some random variation
        const variation = Math.random() * 10 - 5; // -5 to +5
        const heartRate = Math.round(baseHeartRate + variation);
        
        // Add some "workout" spikes on exercise days
        const isExerciseTime = hour >= 17 && hour < 19 && day % 2 === 0;
        const exerciseBoost = isExerciseTime ? Math.random() * 50 : 0;
        
        data.push({
          timestamp: timestamp.toISOString(),
          bpm: Math.max(40, Math.min(180, Math.round(heartRate + exerciseBoost))),
          source: "sample"
        });
      }
    }
  }
  
  return data;
}

export default App;
import { getZoneForHeartRate } from './zones';

export function processHeartRateData(heartRateData, zones) {
  if (!heartRateData?.length || !zones) return [];
  return heartRateData.map((hr) => {
    const timestamp = new Date(hr.timestamp);
    const zone = getZoneForHeartRate(hr.bpm, zones);
    return {
      ...hr,
      time: `${String(timestamp.getHours()).padStart(2, '0')}:${String(timestamp.getMinutes()).padStart(2, '0')}`,
      date: timestamp.toLocaleDateString(),
      dateTime: timestamp,
      zone: zone.name,
      zoneColor: zone.color,
    };
  });
}

export function getDailyData(processedHeartRateData, zones) {
  if (!processedHeartRateData?.length || !zones) return [];
  const hourlyData = processedHeartRateData.reduce((acc, hr) => {
    const hour = hr.dateTime.getHours();
    if (!acc[hour]) acc[hour] = [];
    acc[hour].push(hr);
    return acc;
  }, {});
  return Object.keys(hourlyData)
    .map((hour) => {
      const readings = hourlyData[hour];
      const avgBpm = readings.reduce((sum, r) => sum + r.bpm, 0) / readings.length;
      const zone = getZoneForHeartRate(avgBpm, zones);
      return {
        hour: parseInt(hour, 10),
        hourLabel: `${hour}:00`,
        avgBpm: Math.round(avgBpm),
        zone: zone.name,
        zoneColor: zone.color,
        readings: readings.length,
      };
    })
    .sort((a, b) => a.hour - b.hour);
}

export function getZoneDistribution(processedHeartRateData, zones) {
  if (!processedHeartRateData?.length || !zones) return [];
  const zoneCounts = processedHeartRateData.reduce((acc, hr) => {
    const name = getZoneForHeartRate(hr.bpm, zones).name;
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  const total = processedHeartRateData.length;
  const zoneList = Object.values(zones);
  return Object.entries(zoneCounts).map(([zone, count]) => {
    const percentage = (count / total) * 100;
    const color =
      zoneList.find((z) => z.name === zone)?.color ||
      (zone === 'Below Zones' ? '#D3D3D3' : '#FF0000');
    return { zone, count, percentage: Math.round(percentage), color };
  });
}

export function getStatistics(processedHeartRateData) {
  if (!processedHeartRateData?.length) return null;
  const bpms = processedHeartRateData.map((d) => d.bpm);
  return {
    min: Math.min(...bpms),
    max: Math.max(...bpms),
    avg: Math.round(bpms.reduce((sum, bpm) => sum + bpm, 0) / bpms.length),
    count: bpms.length,
  };
}

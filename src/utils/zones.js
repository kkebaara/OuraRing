export function calculateZones(age) {
  const maxHR = 220 - age;
  return {
    zone1: { min: Math.round(maxHR * 0.5), max: Math.round(maxHR * 0.6), name: 'Recovery', color: '#91C4F2' },
    zone2: { min: Math.round(maxHR * 0.6), max: Math.round(maxHR * 0.7), name: 'Moderate', color: '#8CA0D7' },
    zone3: { min: Math.round(maxHR * 0.7), max: Math.round(maxHR * 0.8), name: 'Aerobic', color: '#9D79BC' },
    zone4: { min: Math.round(maxHR * 0.8), max: Math.round(maxHR * 0.9), name: 'Anaerobic', color: '#A14DA0' },
    zone5: { min: Math.round(maxHR * 0.9), max: maxHR, name: 'Maximum', color: '#7E1F86' },
  };
}

export function getZoneForHeartRate(bpm, zones) {
  if (bpm == null) return { name: 'Unknown', color: '#D3D3D3' };
  const list = [zones.zone1, zones.zone2, zones.zone3, zones.zone4, zones.zone5];
  const below = { name: 'Below Zones', color: '#D3D3D3' };
  if (bpm < zones.zone1.min) return below;
  const found = list.find(z => bpm <= z.max);
  return found || { name: 'Above Maximum', color: '#FF0000' };
}

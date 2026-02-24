import { calculateZones, getZoneForHeartRate } from './zones';

describe('calculateZones', () => {
  it('returns five zones for age 35', () => {
    const zones = calculateZones(35);
    expect(zones.zone1.name).toBe('Recovery');
    expect(zones.zone1.min).toBe(93); // 185 * 0.5 rounded
    expect(zones.zone1.max).toBe(111);
    expect(zones.zone2.name).toBe('Moderate');
    expect(zones.zone5.name).toBe('Maximum');
    expect(zones.zone5.max).toBe(185);
  });
});

describe('getZoneForHeartRate', () => {
  const zones = calculateZones(35);

  it('returns Unknown for null/undefined bpm', () => {
    expect(getZoneForHeartRate(null, zones).name).toBe('Unknown');
    expect(getZoneForHeartRate(undefined, zones).name).toBe('Unknown');
  });

  it('returns Below Zones for bpm below zone1.min', () => {
    expect(getZoneForHeartRate(50, zones).name).toBe('Below Zones');
  });

  it('returns correct zone for bpm in each band', () => {
    expect(getZoneForHeartRate(100, zones).name).toBe('Recovery');
    expect(getZoneForHeartRate(120, zones).name).toBe('Moderate');
    expect(getZoneForHeartRate(135, zones).name).toBe('Aerobic');
    expect(getZoneForHeartRate(155, zones).name).toBe('Anaerobic');
    expect(getZoneForHeartRate(185, zones).name).toBe('Maximum');
  });

  it('returns Above Maximum for bpm above zone5.max', () => {
    expect(getZoneForHeartRate(200, zones).name).toBe('Above Maximum');
  });
});

import { formatDate, getDateRangeForView } from './dateHelpers';

describe('formatDate', () => {
  it('formats date string with default options', () => {
    const result = formatDate('2025-02-24');
    expect(result).toMatch(/\w{3}/); // weekday
    expect(result).toMatch(/\w{3}/); // month
    expect(result).toMatch(/\d+/); // day
  });
});

describe('getDateRangeForView', () => {
  it('returns startDate one day before endDate for day view', () => {
    const range = getDateRangeForView('day');
    expect(range.startDate).toBeDefined();
    expect(range.endDate).toBeDefined();
    const start = new Date(range.startDate);
    const end = new Date(range.endDate);
    const diffDays = (end - start) / (24 * 60 * 60 * 1000);
    expect(diffDays).toBe(1);
  });

  it('returns startDate 7 days before endDate for week view', () => {
    const range = getDateRangeForView('week');
    const start = new Date(range.startDate);
    const end = new Date(range.endDate);
    const diffDays = (end - start) / (24 * 60 * 60 * 1000);
    expect(diffDays).toBe(7);
  });

  it('returns startDate 30 days before endDate for month view', () => {
    const range = getDateRangeForView('month');
    const start = new Date(range.startDate);
    const end = new Date(range.endDate);
    const diffDays = (end - start) / (24 * 60 * 60 * 1000);
    expect(diffDays).toBe(30);
  });
});

export function formatDate(dateString, options = { weekday: 'short', month: 'short', day: 'numeric' }) {
  return new Date(dateString).toLocaleDateString(undefined, options);
}

export function getDateRangeForView(view) {
  const today = new Date();
  const start = new Date(today);
  if (view === 'day') start.setDate(today.getDate() - 1);
  else if (view === 'week') start.setDate(today.getDate() - 7);
  else if (view === 'month') start.setDate(today.getDate() - 30);
  else start.setDate(today.getDate() - 1);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  };
}

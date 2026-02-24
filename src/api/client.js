const API_BASE = process.env.REACT_APP_OURA_API_URL || 'https://api.ouraring.com/v2';

export async function ouraFetch(path, { token, signal } = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

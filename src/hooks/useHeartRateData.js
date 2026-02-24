import { useState, useEffect, useCallback, useRef } from 'react';
import { heartrate } from '../api/oura';

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map();

function cacheKey(token, startDate, endDate) {
  return `${token.slice(0, 8)}-${startDate}-${endDate}`;
}

function mapApiError(err) {
  if (err.message.startsWith('401')) return 'Invalid or expired token. Please check your token and try again.';
  if (err.message.startsWith('429')) return 'Too many requests. Please try again later.';
  return err.message || 'Something went wrong. Please try again.';
}

export function useHeartRateData(token, dateRange, enabled) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refetchCount, setRefetchCount] = useState(0);
  const bypassCacheRef = useRef(false);

  const refetch = useCallback(() => {
    bypassCacheRef.current = true;
    setRefetchCount((c) => c + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !token || !dateRange?.startDate || !dateRange?.endDate) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    const key = cacheKey(token, dateRange.startDate, dateRange.endDate);
    const cached = !bypassCacheRef.current && cache.get(key);
    bypassCacheRef.current = false;
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      setData(cached.data);
      setLoading(false);
      setError(null);
      return;
    }

    const ac = new AbortController();
    const signal = ac.signal;

    setLoading(true);
    setError(null);

    const startDateTime = `${dateRange.startDate}T00:00:00Z`;
    const endDateTime = `${dateRange.endDate}T23:59:59Z`;

    heartrate(token, startDateTime, endDateTime, signal)
      .then((res) => {
        if (signal.aborted) return;
        const list = res.data && res.data.length > 0 ? res.data : [];
        if (list.length > 0) cache.set(key, { data: list, ts: Date.now() });
        setData(list);
        if (list.length === 0) setError('No heart rate data available for this time range.');
      })
      .catch((err) => {
        if (signal.aborted) return;
        setData([]);
        setError(mapApiError(err));
      })
      .finally(() => {
        if (!signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [enabled, token, dateRange?.startDate, dateRange?.endDate, refetchCount]);

  return { data, loading, error, refetch };
}

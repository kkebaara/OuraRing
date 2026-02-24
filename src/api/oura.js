import { ouraFetch } from './client';

export function personalInfo(token, signal) {
  return ouraFetch('/usercollection/personal_info', { token, signal });
}

export function heartrate(token, startDatetime, endDatetime, signal) {
  const params = new URLSearchParams({
    start_datetime: startDatetime,
    end_datetime: endDatetime,
  });
  return ouraFetch(`/usercollection/heartrate?${params}`, { token, signal });
}

import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHeartRateData } from '../hooks/useHeartRateData';
import { getDateRangeForView } from '../utils/dateHelpers';
import { calculateZones } from '../utils/zones';
import {
  processHeartRateData,
  getDailyData,
  getZoneDistribution,
  getStatistics,
} from '../utils/heartRateData';
import { TimeRangeTabs } from '../components/dashboard/TimeRangeTabs';
import { StatsCards } from '../components/dashboard/StatsCards';
import { ChartHeartRateHourly } from '../components/dashboard/ChartHeartRateHourly';
import { ChartHeartRateLine } from '../components/dashboard/ChartHeartRateLine';
import { ChartZoneDistribution } from '../components/dashboard/ChartZoneDistribution';
import { ZoneReference } from '../components/dashboard/ZoneReference';
import { ErrorBanner } from '../components/dashboard/ErrorBanner';
import { LoadingState } from '../components/dashboard/LoadingState';
import { EmptyState } from '../components/dashboard/EmptyState';

export function DashboardPage() {
  const { token, age, isDemo, demoHeartRateData, logout } = useAuth();
  const [view, setView] = useState('day');
  const dateRange = useMemo(() => getDateRangeForView(view), [view]);

  const enabled = !isDemo && !!token;
  const { data: apiData, loading, error, refetch } = useHeartRateData(
    token,
    dateRange,
    enabled
  );

  const heartRateData = useMemo(
    () => (isDemo ? (demoHeartRateData || []) : apiData),
    [isDemo, demoHeartRateData, apiData]
  );

  const heartRateZones = useMemo(() => calculateZones(age), [age]);

  const processedHeartRateData = useMemo(
    () => processHeartRateData(heartRateData, heartRateZones),
    [heartRateData, heartRateZones]
  );

  const dailyData = useMemo(
    () => getDailyData(processedHeartRateData, heartRateZones),
    [processedHeartRateData, heartRateZones]
  );

  const zoneDistribution = useMemo(
    () => getZoneDistribution(processedHeartRateData, heartRateZones),
    [processedHeartRateData, heartRateZones]
  );

  const statistics = useMemo(
    () => getStatistics(processedHeartRateData),
    [processedHeartRateData]
  );

  const handleViewChange = useCallback((newView) => {
    setView(newView);
  }, []);

  const showCharts = heartRateData.length > 0;
  const showEmpty = !loading && heartRateData.length === 0 && !isDemo;

  return (
    <div className="heart-rate-analysis">
      <ErrorBanner message={error} onRetry={refetch} />

      {loading && <LoadingState />}

      <TimeRangeTabs
        view={view}
        dateRange={dateRange}
        onViewChange={handleViewChange}
      />

      {statistics && <StatsCards statistics={statistics} />}

      {showCharts && (
        <>
          {view === 'day' && dailyData.length > 0 && (
            <ChartHeartRateHourly dailyData={dailyData} />
          )}
          <ChartHeartRateLine
            processedHeartRateData={processedHeartRateData}
            heartRateZones={heartRateZones}
          />
          {zoneDistribution.length > 0 && (
            <ChartZoneDistribution zoneDistribution={zoneDistribution} />
          )}
          <ZoneReference heartRateZones={heartRateZones} />
        </>
      )}

      {showEmpty && <EmptyState />}

      {isDemo && (
        <div className="demo-cta" role="region" aria-label="Connect your account">
          <p>Connect your Oura account to see your real data.</p>
          <button type="button" className="submit-button" onClick={() => logout()}>
            Connect account
          </button>
        </div>
      )}

      {showCharts && !isDemo && (
        <div className="dashboard-actions">
          <button type="button" className="refresh-button" onClick={refetch}>
            Refresh data
          </button>
        </div>
      )}
    </div>
  );
}

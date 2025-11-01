import { useState, useEffect } from 'react';
import { ClusterAPI } from '../api/ClusterAPI';
import { PerUserBreakdownChart } from './charts/PerUserBreakdownChart';
import { DiskHeatmapChart } from './charts/DiskHeatmapChart';
import type { UserUsage, DiskUsage, MetricsResponse } from '../types';

export function Dashboard() {
  const [selectedCluster, setSelectedCluster] = useState<string>('asuka');
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [userData, setUserData] = useState<UserUsage[]>([]);
  const [diskData, setDiskData] = useState<DiskUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const api = new ClusterAPI({ baseUrl: '/api' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch general metrics
        const metricsData = await api.fetchMetrics('current');
        setMetrics(metricsData);

        // Fetch cluster-specific data
        const [users, disk] = await Promise.all([
          api.fetchClusterUsers(selectedCluster),
          api.fetchClusterDisk(selectedCluster),
        ]);

        setUserData(users);
        setDiskData(disk);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh data every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [selectedCluster]);

  if (loading && !metrics) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <header
        style={{
          marginBottom: '30px',
          borderBottom: '2px solid #333',
          paddingBottom: '10px',
        }}
      >
        <h1>Computing Cluster Status Monitor</h1>
        <p style={{ color: '#666' }}>
          Last updated: {metrics ? new Date(metrics.timestamp).toLocaleString() : 'N/A'}
        </p>
      </header>

      {!metrics?.has_data && (
        <div
          style={{
            padding: '15px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          <strong>Warning:</strong> No data available. Using dummy data for demonstration.
        </div>
      )}

      <section style={{ marginBottom: '30px' }}>
        <label htmlFor="cluster-select" style={{ marginRight: '10px' }}>
          Select Cluster:
        </label>
        <select
          id="cluster-select"
          value={selectedCluster}
          onChange={(e) => setSelectedCluster(e.target.value)}
          style={{
            padding: '8px',
            fontSize: '14px',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        >
          <option value="asuka">Asuka</option>
          <option value="naruko">Naruko</option>
          <option value="yoyogi">Yoyogi</option>
        </select>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>Overview</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginTop: '20px',
          }}
        >
          <div
            style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#666' }}>
              CPU Usage
            </h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
              {metrics?.cpu_usage[0]?.value.toFixed(1) ?? 'N/A'}%
            </p>
          </div>
          <div
            style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#666' }}>
              Load Average
            </h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
              {metrics?.load_average[0]?.value.toFixed(2) ?? 'N/A'}
            </p>
          </div>
          <div
            style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#666' }}>
              PBS Usage
            </h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
              {metrics?.pbs_usage[0]?.value.toFixed(1) ?? 'N/A'}%
            </p>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <PerUserBreakdownChart
          data={userData}
          clusterName={selectedCluster}
          width={1000}
          height={400}
        />
      </section>

      <section style={{ marginBottom: '40px' }}>
        <DiskHeatmapChart
          data={diskData}
          clusterName={selectedCluster}
          width={1000}
          height={400}
        />
      </section>

      {loading && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '10px 20px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            borderRadius: '4px',
          }}
        >
          Updating...
        </div>
      )}
    </div>
  );
}

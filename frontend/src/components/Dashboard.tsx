import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ClusterAPI } from '../api/ClusterAPI';
import { PerUserBreakdownChart } from './charts/PerUserBreakdownChart';
import { DiskHeatmapChart } from './charts/DiskHeatmapChart';
import { NodeStatusList } from './NodeStatusList';
import { useAuth } from '../contexts/AuthContext';
import type { UserUsage, DiskUsage, MetricsResponse, NodeStatusResponse } from '../types';
import './Dashboard.css';

export function Dashboard() {
  const [selectedCluster, setSelectedCluster] = useState<string>('asuka');
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [nodeStatus, setNodeStatus] = useState<NodeStatusResponse | null>(null);
  const [userData, setUserData] = useState<UserUsage[]>([]);
  const [diskData, setDiskData] = useState<DiskUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, logout } = useAuth();

  const apiRef = useRef(new ClusterAPI({ baseUrl: '/api' }));

  useEffect(() => {
    const fetchData = async () => {
      const api = apiRef.current;
      try {
        setLoading(true);
        setError(null);

        // Fetch general metrics and node status
        const [metricsData, nodesData] = await Promise.all([
          api.fetchMetrics('current'),
          api.fetchNodes(),
        ]);

        setMetrics(metricsData);
        setNodeStatus(nodesData);

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
    <div className="dashboard">
      <div className="main-container">
        <div className="auth-section">
          {isAuthenticated ? (
            <button onClick={logout} className="btn btn-border-shadow btn-border-shadow--color">
              Logout
            </button>
          ) : (
            <Link to="/login" className="btn btn-border-shadow btn-border-shadow--color">
              Login
            </Link>
          )}
        </div>

        <div className="explain">
          <p>現在の各クラスタの稼働状況</p>
          <p>1時間毎に更新されます。</p>
        </div>

        {!metrics?.has_data && (
          <div className="warning-message">
            <strong>⚠️ 警告:</strong> 実データが取得できていません。ダミー値を表示しています。
          </div>
        )}

        <div className="mainblock">
          <div className="iplist">
            <h3>Down nodes</h3>
            <NodeStatusList nodes={nodeStatus?.down || []} type="down" />
          </div>

          <div className="iplist">
            <h3>Alive nodes</h3>
            <NodeStatusList nodes={nodeStatus?.alive || []} type="alive" />
          </div>

          <div className="mainchart">
            {metrics && metrics.load_average && metrics.pbs_usage && (
              <PerUserBreakdownChart
                data={userData}
                clusterName={selectedCluster}
                width={680}
                height={450}
              />
            )}
          </div>
        </div>

        <section className="cluster-select-section">
          <label htmlFor="cluster-select">
            クラスタを選択:
          </label>
          <select
            id="cluster-select"
            value={selectedCluster}
            onChange={(e) => setSelectedCluster(e.target.value)}
          >
            <option value="asuka">Asuka</option>
            <option value="naruko">Naruko</option>
            <option value="yoyogi">Yoyogi</option>
          </select>
        </section>

        <section className="overview-section">
          <h2>メトリクス概要</h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>CPU Usage</h3>
              <p className="metric-value">
                {metrics?.cpu_usage[0]?.value.toFixed(1) ?? 'N/A'}%
              </p>
            </div>
            <div className="metric-card">
              <h3>Load Average</h3>
              <p className="metric-value">
                {metrics?.load_average[0]?.value.toFixed(2) ?? 'N/A'}
              </p>
            </div>
            <div className="metric-card">
              <h3>PBS Usage</h3>
              <p className="metric-value">
                {metrics?.pbs_usage[0]?.value.toFixed(1) ?? 'N/A'}%
              </p>
            </div>
          </div>
        </section>

        <section className="chart-section">
          <DiskHeatmapChart
            data={diskData}
            clusterName={selectedCluster}
            width={1000}
            height={400}
          />
        </section>
      </div>

      {loading && (
        <div className="loading-indicator">
          更新中...
        </div>
      )}
    </div>
  );
}

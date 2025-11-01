import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ClusterAPI } from '../api/ClusterAPI';
import { useAuth } from '../contexts/AuthContext';
import { generateAllMockData } from '../utils/mockData';
import type { MetricsResponse, NodeStatusResponse, DiskUsage } from '../types';
import './Dashboard.css';

type TimeRange = '1h' | '6h' | '24h' | '7d' | 'custom';
type RefreshInterval = 5 | 30 | 60;
type NodeFilter = 'all' | 'up' | 'down';
type DiskTab = 'total' | 'top5' | 'inode';

// Set to true to use mock data for development
const USE_MOCK_DATA = true;

export function Dashboard() {
  // State
  const [selectedCluster, setSelectedCluster] = useState<string>('asuka');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(60);
  const [countdown, setCountdown] = useState(60);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [nodeStatus, setNodeStatus] = useState<NodeStatusResponse | null>(null);
  const [diskData, setDiskData] = useState<DiskUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [serverTime, setServerTime] = useState<Date | null>(null);
  const [nodeFilter, setNodeFilter] = useState<NodeFilter>('all');
  const [nodeSearch, setNodeSearch] = useState('');
  const [diskTab, setDiskTab] = useState<DiskTab>('total');
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { isAuthenticated, logout } = useAuth();
  const apiRef = useRef(new ClusterAPI({ baseUrl: '/api' }));
  const nodeTableRef = useRef<HTMLDivElement>(null);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);

      if (USE_MOCK_DATA) {
        // Use mock data for development
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        const mockData = generateAllMockData(selectedCluster);
        setMetrics(mockData.metrics);
        setNodeStatus(mockData.nodeStatus);
        setDiskData(mockData.diskData);
        setServerTime(new Date()); // Mock server time
      } else {
        // Use real API
        const api = apiRef.current;
        const [metricsData, nodesData, disk] = await Promise.all([
          api.fetchMetrics('current'),
          api.fetchNodes(),
          api.fetchClusterDisk(selectedCluster),
        ]);

        setMetrics(metricsData);
        setNodeStatus(nodesData);
        setDiskData(disk);

        // Get server time from response timestamp
        if (metricsData.timestamp) {
          setServerTime(new Date(metricsData.timestamp));
        }
      }

      const now = new Date();
      setLastUpdate(now);
      setCountdown(refreshInterval);
    } catch (err) {
      console.error('Failed to fetch data:', err);

      // Fallback to mock data on error
      if (!USE_MOCK_DATA) {
        console.log('Falling back to mock data...');
        const mockData = generateAllMockData(selectedCluster);
        setMetrics(mockData.metrics);
        setNodeStatus(mockData.nodeStatus);
        setDiskData(mockData.diskData);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCluster, timeRange]);

  // Auto-refresh timer
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, selectedCluster, timeRange]);

  // Countdown timer
  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefresh, refreshInterval]);

  // Reset countdown when interval changes
  useEffect(() => {
    setCountdown(refreshInterval);
  }, [refreshInterval]);

  // Computed values
  const allNodes = useMemo(() => {
    if (!nodeStatus) return [];

    // Type guard to check if nodeStatus has details
    const hasDetails = 'aliveDetails' in nodeStatus && 'downDetails' in nodeStatus;

    if (hasDetails) {
      const statusWithDetails = nodeStatus as NodeStatusResponse & {
        aliveDetails: Array<{ name: string; last_seen: string }>;
        downDetails: Array<{ name: string; last_seen: string }>;
      };

      const alive = statusWithDetails.aliveDetails.map(node => ({
        name: node.name,
        status: 'up' as const,
        last_seen: node.last_seen
      }));
      const down = statusWithDetails.downDetails.map(node => ({
        name: node.name,
        status: 'down' as const,
        last_seen: node.last_seen
      }));
      return [...alive, ...down];
    } else {
      // Fallback for API data without details
      const alive = nodeStatus.alive.map(name => ({
        name,
        status: 'up' as const,
        last_seen: 'N/A'
      }));
      const down = nodeStatus.down.map(name => ({
        name,
        status: 'down' as const,
        last_seen: 'N/A'
      }));
      return [...alive, ...down];
    }
  }, [nodeStatus]);

  const healthStatus = useMemo(() => {
    if (!nodeStatus) return { status: 'unknown', aliveCount: 0, downCount: 0 };

    const aliveCount = nodeStatus.alive.length;
    const downCount = nodeStatus.down.length;
    let status: 'healthy' | 'degraded' | 'down' = 'healthy';

    if (downCount > 0) {
      status = downCount > aliveCount / 2 ? 'down' : 'degraded';
    }

    return { status, aliveCount, downCount };
  }, [nodeStatus]);

  const filteredNodes = useMemo(() => {
    let nodes = allNodes;

    // Apply filter
    if (nodeFilter === 'up') {
      nodes = nodes.filter(n => n.status === 'up');
    } else if (nodeFilter === 'down') {
      nodes = nodes.filter(n => n.status === 'down');
    }

    // Apply search
    if (nodeSearch) {
      nodes = nodes.filter(n =>
        n.name.toLowerCase().includes(nodeSearch.toLowerCase())
      );
    }

    // Apply sort
    nodes = [...nodes].sort((a, b) => {
      let aVal: any = a[sortColumn as keyof typeof a];
      let bVal: any = b[sortColumn as keyof typeof b];

      if (aVal === undefined) aVal = '';
      if (bVal === undefined) bVal = '';

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return nodes;
  }, [allNodes, nodeFilter, nodeSearch, sortColumn, sortDirection]);

  const topDiskUsage = useMemo(() => {
    return [...diskData]
      .sort((a, b) => b.usage_percent - a.usage_percent)
      .slice(0, 5);
  }, [diskData]);

  // Handlers
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const scrollToNodes = (filter: NodeFilter) => {
    setNodeFilter(filter);
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const element = nodeTableRef.current;
        if (element) {
          const top = element.getBoundingClientRect().top + window.scrollY - 100; // 100px offset for header
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  };

  const exportCSV = () => {
    const headers = ['Name', 'Status', 'Last Heartbeat'];
    const rows = filteredNodes.map(n => [
      n.name,
      n.status,
      n.last_seen || 'N/A',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nodes-${selectedCluster}-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getProgressClass = (percent: number) => {
    if (percent >= 90) return 'high';
    if (percent >= 75) return 'medium';
    return '';
  };

  const getTimeDrift = (): number | null => {
    if (!serverTime) return null;
    const clientTime = new Date();
    const drift = Math.abs(clientTime.getTime() - serverTime.getTime()) / 1000;
    return drift;
  };

  const timeDrift = getTimeDrift();
  const hasTimeDrift = timeDrift !== null && timeDrift > 60;

  if (loading && !metrics) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Custom Range Modal */}
      {showCustomRange && (
        <div className="modal-overlay" onClick={() => setShowCustomRange(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Custom Time Range</h3>
            <div className="custom-range-form">
              <div className="form-group">
                <label>Start Date:</label>
                <input
                  type="datetime-local"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>End Date:</label>
                <input
                  type="datetime-local"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button onClick={() => {
                  setShowCustomRange(false);
                  fetchData();
                }}>Apply</button>
                <button onClick={() => {
                  setShowCustomRange(false);
                  setTimeRange('24h');
                }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="app-title">Cluster Monitor</h1>
          </div>

          <div className="header-center">
            <div className="control-group">
              <label className="control-label">Cluster:</label>
              <select
                className="select-input"
                value={selectedCluster}
                onChange={(e) => setSelectedCluster(e.target.value)}
              >
                <option value="asuka">Asuka</option>
                <option value="naruko">Naruko</option>
                <option value="yoyogi">Yoyogi</option>
              </select>
            </div>

            <div className="control-group">
              <label className="control-label">Period:</label>
              <select
                className="select-input"
                value={timeRange}
                onChange={(e) => {
                  const value = e.target.value as TimeRange;
                  setTimeRange(value);
                  if (value === 'custom') {
                    setShowCustomRange(true);
                  }
                }}
              >
                <option value="1h">1 hour</option>
                <option value="6h">6 hours</option>
                <option value="24h">24 hours</option>
                <option value="7d">7 days</option>
                <option value="custom">Custom...</option>
              </select>
            </div>

            <div className="control-group">
              <label className="control-label">Auto refresh:</label>
              <button
                className={`toggle-button ${autoRefresh ? 'active' : ''}`}
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? 'ON' : 'OFF'}
              </button>
              {autoRefresh && (
                <select
                  className="select-input"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value) as RefreshInterval)}
                >
                  <option value={5}>5s</option>
                  <option value={30}>30s</option>
                  <option value={60}>60s</option>
                </select>
              )}
            </div>
          </div>

          <div className="header-right">
            <div className="update-info">
              {autoRefresh && loading && <div className="spinner"></div>}
              <div className="last-update-wrapper">
                <span className="last-update">
                  Updated: {formatTime(lastUpdate)}
                  {hasTimeDrift && (
                    <span className="time-drift-warning" title={`Clock drift detected: ${timeDrift?.toFixed(0)}s`}>
                      {' '}⚠️
                    </span>
                  )}
                </span>
                {autoRefresh && !loading && (
                  <span className="countdown">Next: {countdown}s</span>
                )}
              </div>
            </div>
            <div className="user-menu">
              {isAuthenticated ? (
                <button onClick={logout}>Logout</button>
              ) : (
                <Link to="/login">
                  <button>Login</button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* Warning Banner */}
        {USE_MOCK_DATA && (
          <div className="warning-banner">
            <span className="warning-icon">⚠️</span>
            <span className="warning-text">
              Development Mode: Using mock data. Set USE_MOCK_DATA to false in Dashboard.tsx to use real API.
            </span>
          </div>
        )}
        {!USE_MOCK_DATA && metrics && !metrics.has_data && (
          <div className="warning-banner">
            <span className="warning-icon">⚠️</span>
            <span className="warning-text">
              Warning: No real data available. Showing dummy values.
            </span>
          </div>
        )}

        {/* Health Overview Cards */}
        <section className="health-overview">
          <div
            className="health-card"
            onClick={() => scrollToNodes('all')}
          >
            <div className="health-card-header">
              <span className="health-card-title">Overall Status</span>
              <span className={`health-badge ${healthStatus.status === 'healthy' ? 'success' : healthStatus.status === 'degraded' ? 'warning' : 'error'}`}>
                {healthStatus.status}
              </span>
            </div>
            <div className="health-value">
              {healthStatus.aliveCount + healthStatus.downCount}
            </div>
            <p className="health-description">Total nodes</p>
          </div>

          <div
            className="health-card"
            onClick={() => scrollToNodes('up')}
          >
            <div className="health-card-header">
              <span className="health-card-title">Alive Nodes</span>
              <span className="health-badge success">UP</span>
            </div>
            <div className="health-value">{healthStatus.aliveCount}</div>
            <p className="health-description">Currently running</p>
          </div>

          <div
            className="health-card"
            onClick={() => scrollToNodes('down')}
          >
            <div className="health-card-header">
              <span className="health-card-title">Down Nodes</span>
              <span className="health-badge error">DOWN</span>
            </div>
            <div className="health-value">{healthStatus.downCount}</div>
            <p className="health-description">Needs attention</p>
          </div>
        </section>

        {/* Metrics Cards */}
        <section className="metrics-section">
          <h2 className="section-title">Key Metrics</h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">CPU Usage</span>
                <span
                  className="metric-tooltip"
                  title="Average CPU utilization across all nodes in the cluster. Values approaching 100% indicate potential resource shortage. Normal operating range is typically 60-80%. High sustained usage may require additional compute resources."
                >
                  ?
                </span>
              </div>
              <div className="metric-value">
                {metrics?.cpu_usage[0]?.value.toFixed(1) ?? 'N/A'}%
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Load Average</span>
                <span
                  className="metric-tooltip"
                  title="System load average over 1 minute. Represents the number of processes waiting for CPU time. Values higher than the number of CPU cores indicate processes are queued. For example, on a 4-core system, a value above 4.0 indicates high load conditions."
                >
                  ?
                </span>
              </div>
              <div className="metric-value">
                {metrics?.load_average[0]?.value.toFixed(2) ?? 'N/A'}
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">PBS Queue</span>
                <span
                  className="metric-tooltip"
                  title="PBS job queue utilization. Percentage of active slots occupied by running and queued jobs. Values approaching 100% indicate queue saturation, which may result in longer wait times for new job submissions. Consider reviewing job priorities or adding resources."
                >
                  ?
                </span>
              </div>
              <div className="metric-value">
                {metrics?.pbs_usage[0]?.value.toFixed(1) ?? 'N/A'}%
              </div>
            </div>
          </div>
        </section>

        {/* Disk Usage */}
        <section className="disk-section">
          <h2 className="section-title">Disk Usage</h2>
          <div className="tabs">
            <button
              className={`tab ${diskTab === 'total' ? 'active' : ''}`}
              onClick={() => setDiskTab('total')}
            >
              Total
            </button>
            <button
              className={`tab ${diskTab === 'top5' ? 'active' : ''}`}
              onClick={() => setDiskTab('top5')}
            >
              Top 5 Volumes
            </button>
            <button
              className={`tab ${diskTab === 'inode' ? 'active' : ''}`}
              onClick={() => setDiskTab('inode')}
            >
              Inode Usage
            </button>
          </div>

          <div className="tab-content">
            {diskTab === 'total' && diskData.length > 0 && (
              <>
                {diskData.map((disk, idx) => (
                  <div key={`${disk.node}-${disk.mount_point}-${idx}`} className="disk-item">
                    <div className="disk-header">
                      <span className="disk-name">{disk.node}: {disk.mount_point}</span>
                      <span className="disk-usage">
                        {disk.used_gb.toFixed(1)}GB / {disk.total_gb.toFixed(1)}GB ({disk.usage_percent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${getProgressClass(disk.usage_percent)}`}
                        style={{ width: `${Math.min(disk.usage_percent, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {diskTab === 'top5' && topDiskUsage.length > 0 && (
              <>
                {topDiskUsage.map((disk, idx) => (
                  <div key={`${disk.node}-${disk.mount_point}-${idx}`} className="disk-item">
                    <div className="disk-header">
                      <span className="disk-name">{disk.node}: {disk.mount_point}</span>
                      <span className="disk-usage">
                        {disk.used_gb.toFixed(1)}GB / {disk.total_gb.toFixed(1)}GB ({disk.usage_percent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${getProgressClass(disk.usage_percent)}`}
                        style={{ width: `${Math.min(disk.usage_percent, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {diskTab === 'inode' && diskData.length > 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-title">Inode data not available</div>
                <p>Inode usage information is not currently tracked</p>
              </div>
            )}

            {diskData.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-title">No disk data available</div>
              </div>
            )}
          </div>
        </section>

        {/* Node Table */}
        <section className="node-table-section" ref={nodeTableRef}>
          <h2 className="section-title">Node List</h2>

          <div className="table-controls">
            <input
              type="text"
              className="search-input"
              placeholder="Search nodes..."
              value={nodeSearch}
              onChange={(e) => setNodeSearch(e.target.value)}
            />

            <div className="filter-buttons">
              <button
                className={`filter-button ${nodeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setNodeFilter('all')}
              >
                All ({allNodes.length})
              </button>
              <button
                className={`filter-button ${nodeFilter === 'up' ? 'active' : ''}`}
                onClick={() => setNodeFilter('up')}
              >
                Up ({healthStatus.aliveCount})
              </button>
              <button
                className={`filter-button ${nodeFilter === 'down' ? 'active' : ''}`}
                onClick={() => setNodeFilter('down')}
              >
                Down ({healthStatus.downCount})
              </button>
            </div>

            <button className="export-button" onClick={exportCSV}>
              Export CSV
            </button>
          </div>

          <div className="node-table-container">
            {filteredNodes.length > 0 ? (
              <table className="node-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('name')}>
                      Node Name {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('status')}>
                      Status {sortColumn === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('last_seen')}>
                      Last Heartbeat {sortColumn === 'last_seen' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNodes.map((node) => (
                    <tr key={node.name}>
                      <td>{node.name}</td>
                      <td>
                        <span className={`status-badge ${node.status}`}>
                          {node.status}
                        </span>
                      </td>
                      <td>{node.last_seen || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <div className="empty-state-title">No nodes found</div>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

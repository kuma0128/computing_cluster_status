import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { generateAllClustersOverview } from '../utils/mockData';
import type { ClusterSummary } from '../types';
import './ClustersListPage.css';

type ViewMode = 'cards' | 'table';

// Mini sparkline for failure count trend
function MiniSparkline({ data, className = '' }: { data: number[]; className?: string }) {
  if (!data || data.length === 0) return null;

  const width = 60;
  const height = 20;
  const padding = 2;

  const values = data;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data.map((value, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((value - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className={`mini-sparkline ${className}`}>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Compact cluster card component
function ClusterCard({
  cluster,
  isPinned,
  onPin,
  onClick
}: {
  cluster: ClusterSummary;
  isPinned: boolean;
  onPin: (name: string) => void;
  onClick: () => void;
}) {
  const availabilityPercent = cluster.totalNodes > 0
    ? (cluster.availableNodes / cluster.totalNodes) * 100
    : 0;

  const statusBadge = cluster.downNodes === 0 ? 'healthy'
    : cluster.downNodes > cluster.aliveNodes / 2 ? 'critical'
    : 'degraded';

  // Mock failure trend data
  const failureTrend = [2, 3, 1, 4, 2, 1, cluster.downNodes];

  return (
    <div className={`cluster-list-card ${isPinned ? 'pinned' : ''}`}>
      <div className="card-header">
        <button
          className={`pin-button ${isPinned ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onPin(cluster.name);
          }}
          title={isPinned ? 'Unpin' : 'Pin to top'}
        >
          {isPinned ? '★' : '☆'}
        </button>
        <h3 className="cluster-name" onClick={onClick}>
          {cluster.name.toUpperCase()}
        </h3>
        <span className={`status-badge ${statusBadge}`}>
          {statusBadge === 'healthy' ? 'Healthy' : statusBadge === 'degraded' ? 'Degraded' : 'Critical'}
        </span>
      </div>

      <div className="card-body" onClick={onClick}>
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-label">Total</span>
            <span className="stat-value">{cluster.totalNodes}</span>
          </div>
          <div className="stat-item success">
            <span className="stat-label">Alive</span>
            <span className="stat-value">{cluster.aliveNodes}</span>
          </div>
          <div className="stat-item error">
            <span className="stat-label">Down</span>
            <span className="stat-value">{cluster.downNodes}</span>
          </div>
        </div>

        <div className="availability-section">
          <div className="availability-header">
            <span className="availability-label">Availability</span>
            <span className="availability-value">{availabilityPercent.toFixed(0)}%</span>
          </div>
          <div className="availability-bar">
            <div
              className={`availability-fill ${
                availabilityPercent >= 90 ? 'high' :
                availabilityPercent >= 75 ? 'medium' : 'low'
              }`}
              style={{ width: `${Math.min(availabilityPercent, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="sparkline-section">
          <span className="sparkline-label">Failures (7d)</span>
          <MiniSparkline data={failureTrend} />
        </div>
      </div>
    </div>
  );
}

// Table row component
function ClusterTableRow({
  cluster,
  isPinned,
  onPin,
  onClick
}: {
  cluster: ClusterSummary;
  isPinned: boolean;
  onPin: (name: string) => void;
  onClick: () => void;
}) {
  const availabilityPercent = cluster.totalNodes > 0
    ? (cluster.availableNodes / cluster.totalNodes) * 100
    : 0;

  const statusBadge = cluster.downNodes === 0 ? 'healthy'
    : cluster.downNodes > cluster.aliveNodes / 2 ? 'critical'
    : 'degraded';

  const failureTrend = [2, 3, 1, 4, 2, 1, cluster.downNodes];

  return (
    <tr className={`cluster-table-row ${isPinned ? 'pinned' : ''}`}>
      <td>
        <button
          className={`pin-button ${isPinned ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onPin(cluster.name);
          }}
        >
          {isPinned ? '★' : '☆'}
        </button>
      </td>
      <td className="cluster-name-cell" onClick={onClick}>
        <strong>{cluster.name.toUpperCase()}</strong>
      </td>
      <td>
        <span className={`status-badge ${statusBadge}`}>
          {statusBadge === 'healthy' ? 'Healthy' : statusBadge === 'degraded' ? 'Degraded' : 'Critical'}
        </span>
      </td>
      <td className="text-center">{cluster.totalNodes}</td>
      <td className="text-center text-success">{cluster.aliveNodes}</td>
      <td className="text-center text-error">{cluster.downNodes}</td>
      <td>
        <div className="inline-availability">
          <span className="availability-value">{availabilityPercent.toFixed(0)}%</span>
          <div className="availability-bar-small">
            <div
              className={`availability-fill ${
                availabilityPercent >= 90 ? 'high' :
                availabilityPercent >= 75 ? 'medium' : 'low'
              }`}
              style={{ width: `${Math.min(availabilityPercent, 100)}%` }}
            ></div>
          </div>
        </div>
      </td>
      <td>
        <MiniSparkline data={failureTrend} />
      </td>
    </tr>
  );
}

export function ClustersListPage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('clustersViewMode');
    return (saved as ViewMode) || 'cards';
  });

  const [pinnedClusters, setPinnedClusters] = useState<string[]>(() => {
    const saved = localStorage.getItem('pinnedClusters');
    return saved ? JSON.parse(saved) : [];
  });

  const [clusters, setClusters] = useState<ClusterSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch cluster data
  useEffect(() => {
    const fetchClusters = async () => {
      try {
        setLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        const data = generateAllClustersOverview();
        setClusters(data);
      } catch (error) {
        console.error('Failed to fetch clusters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClusters();
  }, []);

  // Save view mode to localStorage
  useEffect(() => {
    localStorage.setItem('clustersViewMode', viewMode);
  }, [viewMode]);

  // Save pinned clusters to localStorage
  useEffect(() => {
    localStorage.setItem('pinnedClusters', JSON.stringify(pinnedClusters));
  }, [pinnedClusters]);

  const handlePin = (clusterName: string) => {
    setPinnedClusters(prev => {
      if (prev.includes(clusterName)) {
        return prev.filter(name => name !== clusterName);
      } else {
        return [...prev, clusterName];
      }
    });
  };

  const handleClusterClick = (clusterName: string) => {
    navigate(`/clusters/${clusterName}`);
  };

  // Sort clusters: pinned first, then alphabetically
  const sortedClusters = useMemo(() => {
    const pinned = clusters.filter(c => pinnedClusters.includes(c.name));
    const unpinned = clusters.filter(c => !pinnedClusters.includes(c.name));
    return [...pinned, ...unpinned];
  }, [clusters, pinnedClusters]);

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="clusters-list-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title">Cluster Monitor</h1>
            <span className="page-subtitle">All Clusters</span>
          </div>

          <div className="header-right">
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
      <main className="page-content">
        <div className="content-header">
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
            >
              Cards
            </button>
            <button
              className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              Table
            </button>
          </div>

          <div className="content-stats">
            <span className="stat">
              Total: <strong>{clusters.length}</strong> clusters
            </span>
            {pinnedClusters.length > 0 && (
              <span className="stat">
                Pinned: <strong>{pinnedClusters.length}</strong>
              </span>
            )}
          </div>
        </div>

        {viewMode === 'cards' ? (
          <div className="clusters-grid">
            {sortedClusters.map(cluster => (
              <ClusterCard
                key={cluster.name}
                cluster={cluster}
                isPinned={pinnedClusters.includes(cluster.name)}
                onPin={handlePin}
                onClick={() => handleClusterClick(cluster.name)}
              />
            ))}
          </div>
        ) : (
          <div className="clusters-table-container">
            <table className="clusters-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}></th>
                  <th>Cluster</th>
                  <th>Status</th>
                  <th className="text-center">Total</th>
                  <th className="text-center">Alive</th>
                  <th className="text-center">Down</th>
                  <th>Availability</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {sortedClusters.map(cluster => (
                  <ClusterTableRow
                    key={cluster.name}
                    cluster={cluster}
                    isPinned={pinnedClusters.includes(cluster.name)}
                    onPin={handlePin}
                    onClick={() => handleClusterClick(cluster.name)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

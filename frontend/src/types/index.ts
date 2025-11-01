// API Response Types
export interface MetricsResponse {
  load_average: MetricData[];
  pbs_usage: MetricData[];
  cpu_usage: MetricData[];
  timestamp: number;
  has_data: boolean;
  history?: MetricHistory;
}

export interface MetricData {
  cluster: string;
  value: number;
}

export interface MetricHistory {
  cpu_usage: TimeSeriesPoint[];
  load_average: TimeSeriesPoint[];
  pbs_usage: TimeSeriesPoint[];
}

export interface TimeSeriesPoint {
  timestamp: number;
  value: number;
}

export interface MetricStats {
  min: number;
  max: number;
  avg: number;
  p95: number;
  change_percent: number; // Comparison with previous period
}

export interface ClusterOverview {
  name: string;
  total_nodes: number;
  active_nodes: number;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  load_average: number;
  pbs_usage: number;
}

export interface ClusterSummary {
  name: string;
  totalNodes: number;
  aliveNodes: number;
  downNodes: number;
  availableNodes: number;
}

export interface UserUsage {
  username: string;
  cpu_cores: number;
  memory_gb: number;
  jobs: number;
}

export interface DiskUsage {
  node: string;
  mount_point: string;
  used_gb: number;
  total_gb: number;
  usage_percent: number;
}

export interface ClusterHistory {
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
}

export interface NodeStatus {
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  cpu_usage: number;
  memory_usage: number;
  load_average: number;
}

export interface NodeStatusResponse {
  alive: string[];
  down: string[];
  total: number;
  has_data: boolean;
  message?: string;
}

export interface NodeDetails {
  name: string;
  status: 'up' | 'down';
  last_seen: string;
  cpu_usage?: number;
  load_average?: number;
  disk_usage?: number;
}

// Chart Props Types
export interface BaseChartProps {
  width?: number;
  height?: number;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface PerUserBreakdownChartProps extends BaseChartProps {
  data: UserUsage[];
  clusterName: string;
}

export interface DiskHeatmapChartProps extends BaseChartProps {
  data: DiskUsage[];
  clusterName: string;
}

// API Client Types
export interface APIConfig {
  baseUrl: string;
  cacheDuration?: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

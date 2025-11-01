// API Response Types
export interface MetricsResponse {
  load_average: MetricData[];
  pbs_usage: MetricData[];
  cpu_usage: MetricData[];
  timestamp: number;
  has_data: boolean;
}

export interface MetricData {
  cluster: string;
  value: number;
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

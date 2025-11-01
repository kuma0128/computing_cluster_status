import type { MetricsResponse, NodeStatusResponse, DiskUsage, NodeDetails, MetricHistory, TimeSeriesPoint } from '../types';

// Fixed time series data for sparklines
const FIXED_TIME_SERIES = {
  cpu_usage: [
    55.2, 58.1, 52.3, 56.8, 61.4, 58.9, 54.7, 59.3, 62.5, 57.8,
    55.6, 60.2, 63.1, 58.4, 56.9, 61.7, 59.5, 57.2, 60.8, 62.3
  ],
  load_average: [
    2.1, 2.4, 1.9, 2.3, 2.7, 2.5, 2.2, 2.6, 2.9, 2.4,
    2.3, 2.8, 3.0, 2.5, 2.2, 2.7, 2.6, 2.3, 2.8, 2.9
  ],
  pbs_usage: [
    45.3, 48.7, 42.1, 46.5, 51.2, 47.8, 44.6, 49.3, 52.4, 46.9,
    45.8, 50.1, 53.6, 48.2, 45.4, 51.8, 49.2, 46.7, 50.9, 52.8
  ]
};

// Generate time series data from fixed values
function generateTimeSeriesData(values: number[]): TimeSeriesPoint[] {
  const now = Date.now();
  const interval = 3600000; // 1 hour in milliseconds

  return values.map((value, i) => ({
    timestamp: now - ((values.length - 1 - i) * interval),
    value: value
  }));
}

// Generate mock metrics data with fixed history
export function generateMockMetrics(): MetricsResponse {
  const history: MetricHistory = {
    cpu_usage: generateTimeSeriesData(FIXED_TIME_SERIES.cpu_usage),
    load_average: generateTimeSeriesData(FIXED_TIME_SERIES.load_average),
    pbs_usage: generateTimeSeriesData(FIXED_TIME_SERIES.pbs_usage),
  };

  return {
    cpu_usage: [
      { cluster: 'asuka', value: 62.3 },
      { cluster: 'naruko', value: 54.7 },
      { cluster: 'yoyogi', value: 68.9 },
    ],
    load_average: [
      { cluster: 'asuka', value: 2.9 },
      { cluster: 'naruko', value: 2.2 },
      { cluster: 'yoyogi', value: 3.4 },
    ],
    pbs_usage: [
      { cluster: 'asuka', value: 52.8 },
      { cluster: 'naruko', value: 38.5 },
      { cluster: 'yoyogi', value: 61.2 },
    ],
    timestamp: Date.now(),
    has_data: true,
    history,
  };
}

export interface NodeWithDetails extends NodeDetails {}

// Cluster configurations with different node counts
const CLUSTER_CONFIGS = {
  asuka: { nodeCount: 30, prefix: 'asuka' },
  naruko: { nodeCount: 20, prefix: 'naruko' },
  yoyogi: { nodeCount: 40, prefix: 'yoyogi' },
};

// Fixed node configurations for consistent data
const FIXED_NODE_DATA = {
  asuka: {
    downNodes: ['asuka005', 'asuka018'],
    nodeStats: {
      asuka001: { cpu: 45.2, load: 85.3, disk: 67.4 },
      asuka002: { cpu: 23.1, load: 45.2, disk: 54.8 },
      asuka003: { cpu: 78.5, load: 125.6, disk: 82.3 },
      asuka004: { cpu: 34.7, load: 62.1, disk: 45.9 },
      asuka005: { cpu: 0, load: 0, disk: 71.2 },
      asuka006: { cpu: 56.3, load: 95.4, disk: 58.6 },
      asuka007: { cpu: 12.8, load: 28.5, disk: 39.7 },
      asuka008: { cpu: 65.9, load: 110.2, disk: 73.4 },
      asuka009: { cpu: 41.5, load: 72.8, disk: 61.5 },
      asuka010: { cpu: 28.6, load: 51.3, disk: 48.2 },
    }
  },
  naruko: {
    downNodes: ['naruko012'],
    nodeStats: {
      naruko001: { cpu: 52.3, load: 88.7, disk: 69.3 },
      naruko002: { cpu: 31.4, load: 58.2, disk: 51.7 },
      naruko003: { cpu: 67.8, load: 115.4, disk: 78.9 },
      naruko004: { cpu: 24.9, load: 42.6, disk: 44.3 },
      naruko005: { cpu: 58.7, load: 98.5, disk: 72.8 },
      naruko006: { cpu: 19.3, load: 35.1, disk: 41.5 },
      naruko007: { cpu: 73.2, load: 128.9, disk: 85.6 },
      naruko008: { cpu: 38.6, load: 68.4, disk: 57.2 },
    }
  },
  yoyogi: {
    downNodes: ['yoyogi008', 'yoyogi023', 'yoyogi035'],
    nodeStats: {
      yoyogi001: { cpu: 48.7, load: 82.4, disk: 65.8 },
      yoyogi002: { cpu: 27.3, load: 49.5, disk: 52.4 },
      yoyogi003: { cpu: 71.4, load: 118.7, disk: 79.6 },
      yoyogi004: { cpu: 35.8, load: 64.2, disk: 47.3 },
      yoyogi005: { cpu: 54.2, load: 92.6, disk: 68.9 },
      yoyogi006: { cpu: 15.7, load: 31.8, disk: 38.4 },
      yoyogi007: { cpu: 68.9, load: 112.3, disk: 81.7 },
      yoyogi008: { cpu: 0, load: 0, disk: 74.5 },
      yoyogi009: { cpu: 42.3, load: 75.8, disk: 59.6 },
      yoyogi010: { cpu: 29.1, load: 53.7, disk: 49.8 },
    }
  }
};

// Generate mock node status data with fixed values
export function generateMockNodeStatus(cluster: string = 'asuka'): NodeStatusResponse & {
  aliveDetails: NodeWithDetails[];
  downDetails: NodeWithDetails[];
} {
  const config = CLUSTER_CONFIGS[cluster as keyof typeof CLUSTER_CONFIGS] || CLUSTER_CONFIGS.asuka;
  const fixedData = FIXED_NODE_DATA[cluster as keyof typeof FIXED_NODE_DATA] || FIXED_NODE_DATA.asuka;

  // Generate all node names
  const nodeNames: string[] = [];
  for (let i = 1; i <= config.nodeCount; i++) {
    nodeNames.push(`${config.prefix}${i.toString().padStart(3, '0')}`);
  }

  const downNodeNames = fixedData.downNodes;
  const aliveNodeNames = nodeNames.filter(name => !downNodeNames.includes(name));

  // Helper function to get fixed stats or use defaults
  const getNodeStats = (nodeName: string) => {
    const stats = fixedData.nodeStats[nodeName as keyof typeof fixedData.nodeStats];
    if (stats) {
      return stats;
    }
    // Default values for nodes not in fixed config (cycle through patterns)
    const nodeNum = parseInt(nodeName.match(/\d+$/)?.[0] || '0');
    return {
      cpu: 30 + (nodeNum % 5) * 10,
      load: 50 + (nodeNum % 6) * 15,
      disk: 45 + (nodeNum % 4) * 12,
    };
  };

  // Add detailed information to alive nodes
  const aliveDetails: NodeWithDetails[] = aliveNodeNames.map(name => {
    const stats = getNodeStats(name);
    return {
      name,
      status: 'up' as const,
      last_seen: '2025-11-01 19:15:30',
      cpu_usage: stats.cpu,
      load_average: stats.load,
      disk_usage: stats.disk,
    };
  });

  // Add detailed information to down nodes
  const downDetails: NodeWithDetails[] = downNodeNames.map(name => {
    const stats = getNodeStats(name);
    return {
      name,
      status: 'down' as const,
      last_seen: '2025-11-01 08:23:45',
      cpu_usage: 0,
      load_average: 0,
      disk_usage: stats.disk,
    };
  });

  return {
    alive: aliveNodeNames,
    down: downNodeNames,
    aliveDetails,
    downDetails,
    total: nodeNames.length,
    has_data: true,
  };
}

// Fixed disk usage data
const FIXED_DISK_DATA: DiskUsage[] = [
  // node001
  { node: 'node001', mount_point: '/home', used_gb: 1256.3, total_gb: 2000, usage_percent: 62.8 },
  { node: 'node001', mount_point: '/data', used_gb: 2847.5, total_gb: 4000, usage_percent: 71.2 },
  { node: 'node001', mount_point: '/scratch', used_gb: 782.1, total_gb: 1500, usage_percent: 52.1 },

  // node002
  { node: 'node002', mount_point: '/home', used_gb: 945.8, total_gb: 2000, usage_percent: 47.3 },
  { node: 'node002', mount_point: '/data', used_gb: 3124.6, total_gb: 4000, usage_percent: 78.1 },

  // node003
  { node: 'node003', mount_point: '/home', used_gb: 1678.4, total_gb: 2000, usage_percent: 83.9 },
  { node: 'node003', mount_point: '/data', used_gb: 2456.7, total_gb: 4000, usage_percent: 61.4 },
  { node: 'node003', mount_point: '/scratch', used_gb: 1123.5, total_gb: 1500, usage_percent: 74.9 },
  { node: 'node003', mount_point: '/tmp', used_gb: 234.8, total_gb: 500, usage_percent: 47.0 },

  // node004
  { node: 'node004', mount_point: '/home', used_gb: 834.2, total_gb: 2000, usage_percent: 41.7 },
  { node: 'node004', mount_point: '/data', used_gb: 1895.3, total_gb: 4000, usage_percent: 47.4 },
  { node: 'node004', mount_point: '/scratch', used_gb: 456.9, total_gb: 1500, usage_percent: 30.5 },

  // node005
  { node: 'node005', mount_point: '/home', used_gb: 1523.7, total_gb: 2000, usage_percent: 76.2 },
  { node: 'node005', mount_point: '/data', used_gb: 3567.8, total_gb: 4000, usage_percent: 89.2 },
  { node: 'node005', mount_point: '/scratch', used_gb: 987.6, total_gb: 1500, usage_percent: 65.8 },
  { node: 'node005', mount_point: '/tmp', used_gb: 167.4, total_gb: 500, usage_percent: 33.5 },
];

// Generate mock disk usage data with fixed values
export function generateMockDiskData(_cluster: string): DiskUsage[] {
  return FIXED_DISK_DATA;
}

// Generate all mock data for a specific cluster
export function generateAllMockData(cluster: string) {
  return {
    metrics: generateMockMetrics(),
    nodeStatus: generateMockNodeStatus(cluster),
    diskData: generateMockDiskData(cluster),
  };
}

// Generate overview data for all clusters
export function generateAllClustersOverview() {
  return Object.keys(CLUSTER_CONFIGS).map(cluster => {
    const nodeStatus = generateMockNodeStatus(cluster);
    const config = CLUSTER_CONFIGS[cluster as keyof typeof CLUSTER_CONFIGS];

    return {
      name: cluster,
      totalNodes: config.nodeCount,
      aliveNodes: nodeStatus.alive.length,
      downNodes: nodeStatus.down.length,
      availableNodes: nodeStatus.aliveDetails.filter(n =>
        (n.cpu_usage || 0) < 70 && (n.load_average || 0) < 80
      ).length,
    };
  });
}

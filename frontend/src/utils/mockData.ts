import type { MetricsResponse, NodeStatusResponse, DiskUsage, NodeDetails, MetricHistory, TimeSeriesPoint } from '../types';

// Generate random number between min and max
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Generate random integer between min and max
const randomInt = (min: number, max: number) => Math.floor(random(min, max + 1));

// Generate time series data for sparklines
function generateTimeSeriesData(baseValue: number, points: number = 20): TimeSeriesPoint[] {
  const now = Date.now();
  const interval = 3600000; // 1 hour in milliseconds
  const data: TimeSeriesPoint[] = [];

  let value = baseValue;
  for (let i = points - 1; i >= 0; i--) {
    // Add some variation
    value = value + random(-5, 5);
    value = Math.max(0, Math.min(100, value)); // Clamp between 0 and 100

    data.push({
      timestamp: now - (i * interval),
      value: value
    });
  }

  return data;
}

// Generate mock metrics data with history
export function generateMockMetrics(): MetricsResponse {
  const cpuValue = random(30, 85);
  const loadValue = random(0.5, 4.5);
  const pbsValue = random(15, 75);

  const history: MetricHistory = {
    cpu_usage: generateTimeSeriesData(cpuValue),
    load_average: generateTimeSeriesData(loadValue / 5 * 100).map(p => ({
      ...p,
      value: p.value / 20 // Scale back to load average range
    })),
    pbs_usage: generateTimeSeriesData(pbsValue),
  };

  return {
    cpu_usage: [
      { cluster: 'asuka', value: cpuValue },
      { cluster: 'naruko', value: random(20, 75) },
      { cluster: 'yoyogi', value: random(40, 90) },
    ],
    load_average: [
      { cluster: 'asuka', value: loadValue },
      { cluster: 'naruko', value: random(0.3, 3.8) },
      { cluster: 'yoyogi', value: random(0.8, 5.2) },
    ],
    pbs_usage: [
      { cluster: 'asuka', value: pbsValue },
      { cluster: 'naruko', value: random(10, 65) },
      { cluster: 'yoyogi', value: random(25, 80) },
    ],
    timestamp: Date.now(),
    has_data: true,
    history,
  };
}

// Generate random timestamp within last N hours
const randomRecentTime = (hoursAgo: number): string => {
  const now = Date.now();
  const msAgo = hoursAgo * 60 * 60 * 1000;
  const timestamp = now - Math.random() * msAgo;
  return new Date(timestamp).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export interface NodeWithDetails extends NodeDetails {}

// Generate mock node status data with details
export function generateMockNodeStatus(): NodeStatusResponse & {
  aliveDetails: NodeWithDetails[];
  downDetails: NodeWithDetails[];
} {
  const nodeNames = [
    'node001', 'node002', 'node003', 'node004', 'node005',
    'node006', 'node007', 'node008', 'node009', 'node010',
    'node011', 'node012', 'node013', 'node014', 'node015',
    'node016', 'node017', 'node018', 'node019', 'node020',
  ];

  // Randomly select some nodes to be down (0-30% of nodes for variety)
  const downCount = randomInt(0, 6);
  const shuffled = [...nodeNames].sort(() => Math.random() - 0.5);
  const downNodeNames = shuffled.slice(0, downCount);
  const aliveNodeNames = shuffled.slice(downCount);

  // Add detailed information to alive nodes
  const aliveDetails: NodeWithDetails[] = aliveNodeNames.map(name => ({
    name,
    status: 'up' as const,
    last_seen: randomRecentTime(0.5), // Alive nodes: within last 30 minutes
    load_average: random(0.1, 3.5),
    disk_usage: random(20, 95),
  }));

  // Add detailed information to down nodes
  const downDetails: NodeWithDetails[] = downNodeNames.map(name => ({
    name,
    status: 'down' as const,
    last_seen: randomRecentTime(24), // Down nodes: within last 24 hours
    load_average: 0,
    disk_usage: random(20, 95),
  }));

  return {
    alive: aliveNodeNames,
    down: downNodeNames,
    aliveDetails,
    downDetails,
    total: nodeNames.length,
    has_data: true,
  };
}

// Generate mock disk usage data
export function generateMockDiskData(_cluster: string): DiskUsage[] {
  const mountPoints = ['/home', '/data', '/scratch', '/tmp', '/var', '/opt', '/apps'];
  const nodes = ['node001', 'node002', 'node003', 'node004', 'node005'];

  const diskData: DiskUsage[] = [];

  nodes.forEach(node => {
    // Each node has 2-4 mount points
    const numMounts = randomInt(2, 4);
    const selectedMounts = mountPoints.slice(0, numMounts);

    selectedMounts.forEach(mount => {
      const totalGb = randomInt(500, 5000);
      const usagePercent = random(20, 95);
      const usedGb = (totalGb * usagePercent) / 100;

      diskData.push({
        node,
        mount_point: mount,
        used_gb: usedGb,
        total_gb: totalGb,
        usage_percent: usagePercent,
      });
    });
  });

  return diskData;
}

// Generate all mock data
export function generateAllMockData(cluster: string) {
  return {
    metrics: generateMockMetrics(),
    nodeStatus: generateMockNodeStatus(),
    diskData: generateMockDiskData(cluster),
  };
}

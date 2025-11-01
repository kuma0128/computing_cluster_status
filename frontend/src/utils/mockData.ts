import type { MetricsResponse, NodeStatusResponse, DiskUsage } from '../types';

// Generate random number between min and max
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Generate random integer between min and max
const randomInt = (min: number, max: number) => Math.floor(random(min, max + 1));

// Generate mock metrics data
export function generateMockMetrics(): MetricsResponse {
  return {
    cpu_usage: [
      { cluster: 'asuka', value: random(30, 85) },
      { cluster: 'naruko', value: random(20, 75) },
      { cluster: 'yoyogi', value: random(40, 90) },
    ],
    load_average: [
      { cluster: 'asuka', value: random(0.5, 4.5) },
      { cluster: 'naruko', value: random(0.3, 3.8) },
      { cluster: 'yoyogi', value: random(0.8, 5.2) },
    ],
    pbs_usage: [
      { cluster: 'asuka', value: random(15, 75) },
      { cluster: 'naruko', value: random(10, 65) },
      { cluster: 'yoyogi', value: random(25, 80) },
    ],
    timestamp: Date.now(),
    has_data: true,
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

export interface NodeWithDetails {
  name: string;
  last_seen: string;
}

// Generate mock node status data
export function generateMockNodeStatus(): NodeStatusResponse & { aliveDetails: NodeWithDetails[], downDetails: NodeWithDetails[] } {
  const nodeNames = [
    'node001', 'node002', 'node003', 'node004', 'node005',
    'node006', 'node007', 'node008', 'node009', 'node010',
    'node011', 'node012', 'node013', 'node014', 'node015',
    'node016', 'node017', 'node018', 'node019', 'node020',
  ];

  // Randomly select some nodes to be down (10-30% of nodes)
  const downCount = randomInt(2, 6);
  const shuffled = [...nodeNames].sort(() => Math.random() - 0.5);
  const downNodeNames = shuffled.slice(0, downCount);
  const aliveNodeNames = shuffled.slice(downCount);

  // Add last_seen times
  const aliveDetails = aliveNodeNames.map(name => ({
    name,
    last_seen: randomRecentTime(0.5), // Alive nodes: within last 30 minutes
  }));

  const downDetails = downNodeNames.map(name => ({
    name,
    last_seen: randomRecentTime(24), // Down nodes: within last 24 hours
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

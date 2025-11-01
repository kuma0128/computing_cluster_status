import type {
  MetricsResponse,
  ClusterOverview,
  UserUsage,
  DiskUsage,
  ClusterHistory,
  NodeStatusResponse,
  APIConfig,
  CacheEntry,
} from '../types';

export class ClusterAPI {
  private baseUrl: string;
  private cacheDuration: number;
  private cache: Map<string, CacheEntry<unknown>>;

  constructor(config: APIConfig = { baseUrl: '/api' }) {
    this.baseUrl = config.baseUrl;
    this.cacheDuration = config.cacheDuration ?? 60000; // 60 seconds default
    this.cache = new Map();
  }

  private getCacheKey(endpoint: string, params?: Record<string, string>): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return `${endpoint}:${paramStr}`;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.cacheDuration) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private async fetch<T>(
    endpoint: string,
    params?: Record<string, string>
  ): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, params);
    const cached = this.getFromCache<T>(cacheKey);
    if (cached) return cached;

    const url = new URL(endpoint, window.location.origin + this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Failed to fetch ${endpoint}:`, error);
      throw error;
    }
  }

  async fetchMetrics(type: string = 'current'): Promise<MetricsResponse> {
    try {
      return await this.fetch<MetricsResponse>('/metrics.php', { type });
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return {
        load_average: [],
        pbs_usage: [],
        cpu_usage: [],
        timestamp: Date.now(),
        has_data: false,
      };
    }
  }

  async fetchNodes(): Promise<NodeStatusResponse> {
    try {
      return await this.fetch<NodeStatusResponse>('/metrics.php', { type: 'nodes' });
    } catch (error) {
      console.error('Error fetching node status:', error);
      return {
        alive: [],
        down: [],
        total: 0,
        has_data: false,
        message: 'データ取得エラー',
      };
    }
  }

  async fetchClusterOverview(clusterName: string): Promise<ClusterOverview> {
    try {
      return await this.fetch<ClusterOverview>('/cluster.php', {
        name: clusterName,
        type: 'overview',
      });
    } catch (error) {
      console.error(`Error fetching cluster overview for ${clusterName}:`, error);
      throw error;
    }
  }

  async fetchClusterUsers(clusterName: string): Promise<UserUsage[]> {
    try {
      const response = await this.fetch<{ users: UserUsage[] }>('/cluster.php', {
        name: clusterName,
        type: 'users',
      });
      return response.users || [];
    } catch (error) {
      console.error(`Error fetching users for ${clusterName}:`, error);
      return [];
    }
  }

  async fetchClusterDisk(clusterName: string): Promise<DiskUsage[]> {
    try {
      const response = await this.fetch<{ disk: DiskUsage[] }>('/cluster.php', {
        name: clusterName,
        type: 'disk',
      });
      return response.disk || [];
    } catch (error) {
      console.error(`Error fetching disk usage for ${clusterName}:`, error);
      return [];
    }
  }

  async fetchClusterHistory(
    clusterName: string,
    days: number = 7
  ): Promise<ClusterHistory[]> {
    try {
      const response = await this.fetch<{ history: ClusterHistory[] }>(
        '/cluster.php',
        {
          name: clusterName,
          type: 'history',
          days: days.toString(),
        }
      );
      return response.history || [];
    } catch (error) {
      console.error(`Error fetching history for ${clusterName}:`, error);
      return [];
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default new ClusterAPI();

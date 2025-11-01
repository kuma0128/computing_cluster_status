/**
 * Cluster API Client
 * Handles all API communication with backend
 *
 * @module api/ClusterAPI
 */

export class ClusterAPI {
  /**
   * @param {string} baseUrl - Base URL for API endpoints
   */
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
    this.cache = new Map();
    this.cacheDuration = 60000; // 1 minute
  }

  /**
   * Fetch metrics with caching
   * @param {string} type - Metric type (current, nodes, load, pbs, cpu)
   * @returns {Promise<Object>}
   */
  async fetchMetrics(type = 'current') {
    const cacheKey = `metrics_${type}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheDuration) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/metrics.php?type=${type}`);
      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        return this.getEmptyResponse(type);
      }
      const data = await response.json();

      // Cache the response
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Fetch error:', error);
      return this.getEmptyResponse(type);
    }
  }

  /**
   * Fetch specific cluster information
   * @param {string} clusterName - Name of the cluster
   * @returns {Promise<Object>}
   */
  async fetchCluster(clusterName) {
    const cacheKey = `cluster_${clusterName}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheDuration) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/cluster.php?name=${clusterName}`);
      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        return this.getEmptyClusterResponse(clusterName);
      }
      const data = await response.json();

      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Fetch error:', error);
      return this.getEmptyClusterResponse(clusterName);
    }
  }

  /**
   * Fetch user breakdown for a cluster
   * @param {string} clusterName - Name of the cluster
   * @returns {Promise<Object>}
   */
  async fetchClusterUsers(clusterName) {
    try {
      const response = await fetch(`${this.baseUrl}/cluster.php?name=${clusterName}&type=users`);
      if (!response.ok) {
        return { users: [], has_data: false };
      }
      return await response.json();
    } catch (error) {
      console.error('Fetch error:', error);
      return { users: [], has_data: false };
    }
  }

  /**
   * Fetch disk usage for a cluster
   * @param {string} clusterName - Name of the cluster
   * @returns {Promise<Object>}
   */
  async fetchClusterDisk(clusterName) {
    try {
      const response = await fetch(`${this.baseUrl}/cluster.php?name=${clusterName}&type=disk`);
      if (!response.ok) {
        return { nodes: [], has_data: false };
      }
      return await response.json();
    } catch (error) {
      console.error('Fetch error:', error);
      return { nodes: [], has_data: false };
    }
  }

  /**
   * Fetch node status
   * @returns {Promise<Object>}
   */
  async fetchNodes() {
    return await this.fetchMetrics('nodes');
  }

  /**
   * Get empty response structure
   * @private
   * @param {string} type - Response type
   * @returns {Object}
   */
  getEmptyResponse(type) {
    switch(type) {
      case 'nodes':
        return {
          alive: [],
          down: [],
          total: 0,
          has_data: false,
          message: 'データ取得エラー'
        };
      case 'current':
        return {
          load_average: [],
          pbs_usage: [],
          cpu_usage: [],
          has_data: false
        };
      default:
        return { data: [], has_data: false };
    }
  }

  /**
   * Get empty cluster response
   * @private
   * @param {string} clusterName - Cluster name
   * @returns {Object}
   */
  getEmptyClusterResponse(clusterName) {
    return {
      name: clusterName,
      load_average: 0,
      pbs_usage: 0,
      cpu_usage: '0/0',
      nodes: [],
      has_data: false,
      message: 'クラスタデータが取得できませんでした'
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Set cache duration
   * @param {number} duration - Duration in milliseconds
   */
  setCacheDuration(duration) {
    this.cacheDuration = duration;
  }
}

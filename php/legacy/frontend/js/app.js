/**
 * Main Application Entry Point
 * Manages all charts and application state
 *
 * @module app
 */

import { ClusterAPI } from './api/ClusterAPI.js';
import { BaseChart } from './charts/BaseChart.js';
import { PerUserBreakdownChart } from './charts/PerUserBreakdownChart.js';
import { DiskHeatmapChart } from './charts/DiskHeatmapChart.js';

/**
 * Main Application Class
 */
class ClusterDashboardApp {
  constructor() {
    this.api = new ClusterAPI('/api');
    this.charts = {};
    this.currentCluster = null;
    this.autoRefreshInterval = null;
    this.autoRefreshEnabled = false;

    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    console.log('Initializing Cluster Dashboard App...');

    // Initialize charts
    this.initializeCharts();

    // Setup event listeners
    this.setupEventListeners();

    // Load initial data
    await this.loadDashboard();

    console.log('Dashboard initialized successfully');
  }

  /**
   * Initialize all charts
   */
  initializeCharts() {
    // Main overview chart (if container exists)
    if (document.getElementById('barchart')) {
      // Use existing chart implementation from index.php
      console.log('Bar chart container found');
    }

    // Per-user breakdown chart
    if (document.getElementById('user-breakdown-chart')) {
      this.charts.userBreakdown = new PerUserBreakdownChart('user-breakdown-chart', {
        height: 400
      });
    }

    // Disk heatmap chart
    if (document.getElementById('disk-heatmap-chart')) {
      this.charts.diskHeatmap = new DiskHeatmapChart('disk-heatmap-chart', {
        height: 500
      });
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Cluster selection
    const clusterSelect = document.getElementById('cluster-select');
    if (clusterSelect) {
      clusterSelect.addEventListener('change', (e) => {
        this.currentCluster = e.target.value;
        this.loadClusterDetails(this.currentCluster);
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.refresh();
      });
    }

    // Auto-refresh toggle
    const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
    if (autoRefreshToggle) {
      autoRefreshToggle.addEventListener('change', (e) => {
        this.toggleAutoRefresh(e.target.checked);
      });
    }

    // Tab navigation
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });
  }

  /**
   * Load main dashboard
   */
  async loadDashboard() {
    try {
      // Load overview metrics
      const metrics = await this.api.fetchMetrics('current');
      this.updateOverview(metrics);

      // Load node status
      const nodes = await this.api.fetchNodes();
      this.updateNodeStatus(nodes);

      // If a specific cluster is selected, load its details
      if (this.currentCluster) {
        await this.loadClusterDetails(this.currentCluster);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      this.showError('ダッシュボードの読み込みに失敗しました');
    }
  }

  /**
   * Load cluster-specific details
   * @param {string} clusterName - Cluster name
   */
  async loadClusterDetails(clusterName) {
    try {
      // Load cluster info
      const cluster = await this.api.fetchCluster(clusterName);

      // Load user breakdown
      const userBreakdown = await this.api.fetchClusterUsers(clusterName);
      if (this.charts.userBreakdown) {
        this.charts.userBreakdown.render({
          ...userBreakdown,
          cluster: clusterName
        });
      }

      // Load disk usage
      const diskUsage = await this.api.fetchClusterDisk(clusterName);
      if (this.charts.diskHeatmap) {
        this.charts.diskHeatmap.render({
          ...diskUsage,
          cluster: clusterName
        });
      }

      console.log(`Loaded details for cluster: ${clusterName}`);
    } catch (error) {
      console.error(`Failed to load cluster ${clusterName}:`, error);
      this.showError(`クラスタ ${clusterName} の読み込みに失敗しました`);
    }
  }

  /**
   * Update overview section
   * @param {Object} metrics - Metrics data
   */
  updateOverview(metrics) {
    // This would update the main overview chart
    // Implementation depends on the existing chart structure
    console.log('Updating overview with metrics:', metrics);
  }

  /**
   * Update node status
   * @param {Object} nodes - Node status data
   */
  updateNodeStatus(nodes) {
    const downEl = document.getElementById('down-nodes');
    const aliveEl = document.getElementById('alive-nodes');

    if (downEl && aliveEl) {
      // Show warning if no data
      if (nodes.message && nodes.message !== 'OK') {
        this.showWarning(nodes.message);
      }

      downEl.innerHTML = nodes.down && nodes.down.length > 0
        ? nodes.down.join('<br>')
        : 'なし';

      aliveEl.innerHTML = nodes.alive && nodes.alive.length > 0
        ? nodes.alive.join('<br>')
        : 'なし';
    }
  }

  /**
   * Refresh all data
   */
  async refresh() {
    console.log('Refreshing dashboard...');

    // Clear cache
    this.api.clearCache();

    // Reload dashboard
    await this.loadDashboard();

    console.log('Dashboard refreshed');
  }

  /**
   * Toggle auto-refresh
   * @param {boolean} enabled - Enable auto-refresh
   */
  toggleAutoRefresh(enabled) {
    this.autoRefreshEnabled = enabled;

    if (enabled) {
      // Refresh every 5 minutes
      this.autoRefreshInterval = setInterval(() => {
        this.refresh();
      }, 5 * 60 * 1000);

      console.log('Auto-refresh enabled (5 minutes)');
    } else {
      if (this.autoRefreshInterval) {
        clearInterval(this.autoRefreshInterval);
        this.autoRefreshInterval = null;
      }
      console.log('Auto-refresh disabled');
    }
  }

  /**
   * Switch tab
   * @param {string} tabName - Tab name
   */
  switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
      content.style.display = 'none';
    });

    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });

    // Show selected tab content
    const tabContent = document.getElementById(`${tabName}-tab`);
    if (tabContent) {
      tabContent.style.display = 'block';
    }

    // Add active class to selected tab
    const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedTab) {
      selectedTab.classList.add('active');
    }

    console.log(`Switched to tab: ${tabName}`);
  }

  /**
   * Show warning message
   * @param {string} message - Warning message
   */
  showWarning(message) {
    const warningEl = document.getElementById('warning-message');
    const textEl = document.getElementById('warning-text');

    if (warningEl && textEl) {
      textEl.textContent = message;
      warningEl.style.display = 'block';
    }
  }

  /**
   * Hide warning message
   */
  hideWarning() {
    const warningEl = document.getElementById('warning-message');
    if (warningEl) {
      warningEl.style.display = 'none';
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    console.error(message);
    // Could implement a more sophisticated error display
    alert(message);
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    // Stop auto-refresh
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }

    // Destroy all charts
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });

    console.log('Dashboard destroyed');
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.clusterDashboard = new ClusterDashboardApp();
  });
} else {
  window.clusterDashboard = new ClusterDashboardApp();
}

// Export for module usage
export { ClusterDashboardApp };

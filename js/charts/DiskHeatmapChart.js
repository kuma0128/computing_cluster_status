/**
 * Disk Heatmap Chart
 * Visualizes disk usage across nodes as a heatmap
 *
 * @module charts/DiskHeatmapChart
 */

import { BaseChart } from './BaseChart.js';

export class DiskHeatmapChart extends BaseChart {
  /**
   * @param {string} containerId - DOM element ID
   * @param {Object} options - Chart options
   */
  constructor(containerId, options = {}) {
    super(containerId, {
      margin: { top: 60, right: 20, bottom: 100, left: 100 },
      height: 500,
      cellPadding: 2,
      ...options
    });

    // Color scale for disk usage
    this.colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateRdYlGn)
      .domain([100, 0]); // Reverse: 100% (red) to 0% (green)

    this.init();
  }

  /**
   * Initialize the chart
   */
  init() {
    // Chart is initialized on first render
  }

  /**
   * Render the chart
   * @param {Object} data - Chart data
   * @param {Array} data.nodes - Array of node data with disk info
   * @param {string} data.cluster - Cluster name
   */
  render(data) {
    this.currentData = data;
    this.clear();

    if (!data || !data.nodes || data.nodes.length === 0) {
      this.showError('ディスク使用率データがありません');
      return;
    }

    // Show warning if dummy data
    if (!data.has_data) {
      this.showWarning('実データが取得できていません。ダミー値を表示しています。');
    } else {
      this.hideWarning();
    }

    // Prepare data
    const nodes = data.nodes;

    // Get unique mount points
    const mountPoints = [...new Set(nodes.flatMap(n => n.disks.map(d => d.mount)))];

    // Calculate cell dimensions
    const cellWidth = (this.width - this.options.cellPadding * (mountPoints.length - 1)) / mountPoints.length;
    const cellHeight = (this.height - this.options.cellPadding * (nodes.length - 1)) / nodes.length;

    // Create SVG
    this.svg = d3.select(`#${this.containerId}`)
      .append('svg')
      .attr('width', this.width + this.options.margin.left + this.options.margin.right)
      .attr('height', this.height + this.options.margin.top + this.options.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.options.margin.left},${this.options.margin.top})`);

    // Add title
    this.svg.append('text')
      .attr('x', this.width / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text(`ディスク使用率ヒートマップ - ${data.cluster || 'All Clusters'}`);

    // Add subtitle
    this.svg.append('text')
      .attr('x', this.width / 2)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#666')
      .text('色: 緑=空き多, 黄=中程度, 赤=空き少');

    // Create scales for positioning
    const xScale = d3.scaleBand()
      .domain(mountPoints)
      .range([0, this.width])
      .padding(0.05);

    const yScale = d3.scaleBand()
      .domain(nodes.map(n => n.name))
      .range([0, this.height])
      .padding(0.05);

    // Add X axis (mount points)
    this.svg.append('g')
      .attr('transform', `translate(0, ${this.height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    // Add Y axis (nodes)
    this.svg.append('g')
      .call(d3.axisLeft(yScale));

    // Create heatmap cells
    nodes.forEach((node) => {
      node.disks.forEach((disk) => {
        const usagePercent = (disk.used / disk.total) * 100;

        this.svg.append('rect')
          .attr('x', xScale(disk.mount))
          .attr('y', yScale(node.name))
          .attr('width', xScale.bandwidth())
          .attr('height', yScale.bandwidth())
          .attr('fill', this.colorScale(usagePercent))
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .style('cursor', 'pointer')
          .on('mouseover', (event) => {
            this.showTooltip(`
              <strong>${node.name}</strong><br>
              Mount: ${disk.mount}<br>
              Used: ${this.formatBytes(disk.used)}<br>
              Total: ${this.formatBytes(disk.total)}<br>
              Usage: ${usagePercent.toFixed(1)}%<br>
              Available: ${this.formatBytes(disk.total - disk.used)}
            `, event);

            d3.select(event.target)
              .attr('stroke', '#000')
              .attr('stroke-width', 2);
          })
          .on('mouseout', (event) => {
            this.hideTooltip();
            d3.select(event.target)
              .attr('stroke', '#fff')
              .attr('stroke-width', 1);
          });

        // Add percentage text if cell is large enough
        if (xScale.bandwidth() > 40 && yScale.bandwidth() > 30) {
          this.svg.append('text')
            .attr('x', xScale(disk.mount) + xScale.bandwidth() / 2)
            .attr('y', yScale(node.name) + yScale.bandwidth() / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('font-weight', 'bold')
            .style('fill', usagePercent > 70 ? 'white' : 'black')
            .style('pointer-events', 'none')
            .text(`${usagePercent.toFixed(0)}%`);
        }
      });
    });

    // Add color legend
    this.addColorLegend();

    // Add summary statistics
    this.addDiskSummary(nodes);
  }

  /**
   * Add color legend
   * @private
   */
  addColorLegend() {
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = this.width - legendWidth;
    const legendY = -60;

    const legend = this.svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${legendX}, ${legendY})`);

    // Create gradient
    const defs = this.svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'disk-usage-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', this.colorScale(0));

    gradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', this.colorScale(50));

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', this.colorScale(100));

    // Add legend rectangle
    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#disk-usage-gradient)');

    // Add legend labels
    legend.append('text')
      .attr('x', 0)
      .attr('y', legendHeight + 15)
      .style('font-size', '10px')
      .text('0%');

    legend.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', legendHeight + 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .text('50%');

    legend.append('text')
      .attr('x', legendWidth)
      .attr('y', legendHeight + 15)
      .attr('text-anchor', 'end')
      .style('font-size', '10px')
      .text('100%');
  }

  /**
   * Add summary statistics
   * @private
   * @param {Array} nodes - Node data
   */
  addDiskSummary(nodes) {
    const stats = this.svg.append('g')
      .attr('class', 'disk-summary')
      .attr('transform', `translate(0, ${this.height + 70})`);

    // Calculate total and used across all disks
    let totalSpace = 0;
    let usedSpace = 0;

    nodes.forEach(node => {
      node.disks.forEach(disk => {
        totalSpace += disk.total;
        usedSpace += disk.used;
      });
    });

    const usagePercent = (usedSpace / totalSpace) * 100;

    stats.append('text')
      .attr('x', 0)
      .style('font-size', '12px')
      .text(`Total Capacity: ${this.formatBytes(totalSpace)}`);

    stats.append('text')
      .attr('x', 250)
      .style('font-size', '12px')
      .text(`Used: ${this.formatBytes(usedSpace)} (${usagePercent.toFixed(1)}%)`);

    stats.append('text')
      .attr('x', 500)
      .style('font-size', '12px')
      .text(`Available: ${this.formatBytes(totalSpace - usedSpace)}`);
  }

  /**
   * Format bytes to human-readable string
   * @private
   * @param {number} bytes - Bytes
   * @returns {string}
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

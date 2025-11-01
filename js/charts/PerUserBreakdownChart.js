/**
 * Per-User Breakdown Chart
 * Visualizes resource usage per user in a stacked bar chart
 *
 * @module charts/PerUserBreakdownChart
 */

import { BaseChart } from './BaseChart.js';

export class PerUserBreakdownChart extends BaseChart {
  /**
   * @param {string} containerId - DOM element ID
   * @param {Object} options - Chart options
   */
  constructor(containerId, options = {}) {
    super(containerId, {
      margin: { top: 40, right: 120, bottom: 60, left: 60 },
      height: 400,
      showLegend: true,
      colorScheme: d3.schemeCategory10,
      ...options
    });

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
   * @param {Array} data.users - Array of user data
   * @param {string} data.cluster - Cluster name
   */
  render(data) {
    this.currentData = data;
    this.clear();

    if (!data || !data.users || data.users.length === 0) {
      this.showError('ユーザー別使用率データがありません');
      return;
    }

    // Show warning if dummy data
    if (!data.has_data) {
      this.showWarning('実データが取得できていません。ダミー値を表示しています。');
    } else {
      this.hideWarning();
    }

    // Prepare data
    const users = data.users.sort((a, b) => b.usage - a.usage);
    const totalUsage = d3.sum(users, d => d.usage);

    // Create scales
    const xScale = d3.scaleBand()
      .domain(users.map(d => d.username))
      .range([0, this.width])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(users, d => d.usage)])
      .nice()
      .range([this.height, 0]);

    const colorScale = d3.scaleOrdinal()
      .domain(users.map(d => d.username))
      .range(this.options.colorScheme);

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
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text(`ユーザー別使用率 - ${data.cluster || 'All Clusters'}`);

    // Add X axis
    this.svg.append('g')
      .attr('transform', `translate(0,${this.height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    // Add Y axis
    this.svg.append('g')
      .call(d3.axisLeft(yScale));

    // Add Y axis label
    this.svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - this.options.margin.left)
      .attr('x', 0 - (this.height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('使用時間 (hours)');

    // Add bars
    this.svg.selectAll('.bar')
      .data(users)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.username))
      .attr('y', d => yScale(d.usage))
      .attr('width', xScale.bandwidth())
      .attr('height', d => this.height - yScale(d.usage))
      .attr('fill', d => colorScale(d.username))
      .style('opacity', 0.8)
      .on('mouseover', (event, d) => {
        const percentage = ((d.usage / totalUsage) * 100).toFixed(1);
        this.showTooltip(`
          <strong>${d.username}</strong><br>
          使用時間: ${d.usage.toFixed(2)} hours<br>
          割合: ${percentage}%<br>
          ジョブ数: ${d.jobs || 'N/A'}
        `, event);
        d3.select(event.target).style('opacity', 1);
      })
      .on('mouseout', (event) => {
        this.hideTooltip();
        d3.select(event.target).style('opacity', 0.8);
      });

    // Add value labels on bars
    this.svg.selectAll('.label')
      .data(users)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', d => xScale(d.username) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.usage) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .text(d => d.usage.toFixed(1));

    // Add legend if enabled
    if (this.options.showLegend) {
      this.addLegend(users.slice(0, 5), colorScale); // Show top 5 users
    }

    // Add summary stats
    this.addSummaryStats(users, totalUsage);
  }

  /**
   * Add legend
   * @private
   * @param {Array} topUsers - Top users
   * @param {Function} colorScale - Color scale function
   */
  addLegend(topUsers, colorScale) {
    const legend = this.svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${this.width + 20}, 0)`);

    legend.append('text')
      .attr('y', -10)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text('Top 5 Users');

    const legendItems = legend.selectAll('.legend-item')
      .data(topUsers)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`);

    legendItems.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', d => colorScale(d.username))
      .style('opacity', 0.8);

    legendItems.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .style('font-size', '11px')
      .text(d => `${d.username.substring(0, 10)}...`);
  }

  /**
   * Add summary statistics
   * @private
   * @param {Array} users - User data
   * @param {number} totalUsage - Total usage
   */
  addSummaryStats(users, totalUsage) {
    const stats = this.svg.append('g')
      .attr('class', 'summary-stats')
      .attr('transform', `translate(0, ${this.height + 50})`);

    stats.append('text')
      .attr('x', 0)
      .style('font-size', '12px')
      .text(`Total Users: ${users.length}`);

    stats.append('text')
      .attr('x', 150)
      .style('font-size', '12px')
      .text(`Total Usage: ${totalUsage.toFixed(2)} hours`);

    const avgUsage = totalUsage / users.length;
    stats.append('text')
      .attr('x', 350)
      .style('font-size', '12px')
      .text(`Avg Usage: ${avgUsage.toFixed(2)} hours`);
  }
}

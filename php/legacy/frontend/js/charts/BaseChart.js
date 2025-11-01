/**
 * Base Chart Class
 * Abstract base class for all chart visualizations
 *
 * @module charts/BaseChart
 */

export class BaseChart {
  /**
   * @param {string} containerId - DOM element ID for the chart
   * @param {Object} options - Chart options
   */
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);

    if (!this.container) {
      throw new Error(`Container element #${containerId} not found`);
    }

    // Default options
    this.options = {
      margin: { top: 20, right: 20, bottom: 60, left: 100 },
      width: 680,
      height: 450,
      responsive: true,
      tooltip: true,
      ...options
    };

    this.width = this.options.width - this.options.margin.left - this.options.margin.right;
    this.height = this.options.height - this.options.margin.top - this.options.margin.bottom;

    this.svg = null;
    this.tooltip = null;
    this.resizeTimer = null;

    if (this.options.responsive) {
      this.setupResize();
    }

    if (this.options.tooltip) {
      this.setupTooltip();
    }
  }

  /**
   * Initialize the chart
   * Must be implemented by subclasses
   * @abstract
   */
  init() {
    throw new Error('init() must be implemented by subclass');
  }

  /**
   * Render the chart with data
   * Must be implemented by subclasses
   * @abstract
   * @param {*} data - Chart data
   */
  render(data) {
    throw new Error('render() must be implemented by subclass');
  }

  /**
   * Update the chart with new data
   * @param {*} data - New chart data
   */
  update(data) {
    this.clear();
    this.render(data);
  }

  /**
   * Clear the chart
   */
  clear() {
    if (this.svg) {
      this.svg.remove();
      this.svg = null;
    }
  }

  /**
   * Setup responsive behavior
   * @private
   */
  setupResize() {
    window.addEventListener('resize', () => {
      if (this.resizeTimer) {
        clearTimeout(this.resizeTimer);
      }
      this.resizeTimer = setTimeout(() => {
        this.resize();
      }, 200);
    });
  }

  /**
   * Handle window resize
   */
  resize() {
    const containerWidth = this.container.clientWidth;
    if (containerWidth > 0) {
      this.options.width = containerWidth;
      this.width = this.options.width - this.options.margin.left - this.options.margin.right;
      // Trigger re-render if data exists
      if (this.currentData) {
        this.update(this.currentData);
      }
    }
  }

  /**
   * Setup tooltip
   * @private
   */
  setupTooltip() {
    this.tooltip = d3.select('body')
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000');
  }

  /**
   * Show tooltip
   * @param {string} html - HTML content for tooltip
   * @param {Event} event - Mouse event
   */
  showTooltip(html, event) {
    if (!this.tooltip) return;

    this.tooltip
      .style('visibility', 'visible')
      .html(html)
      .style('top', `${event.pageY + 20}px`)
      .style('left', `${event.pageX + 10}px`);
  }

  /**
   * Hide tooltip
   */
  hideTooltip() {
    if (!this.tooltip) return;
    this.tooltip.style('visibility', 'hidden');
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
   * Show error message in container
   * @param {string} message - Error message
   */
  showError(message) {
    this.clear();
    this.container.innerHTML = `
      <div class="error-message" style="
        padding: 20px;
        text-align: center;
        color: #d32f2f;
        background: #ffebee;
        border: 1px solid #ef5350;
        border-radius: 4px;
      ">
        ${message}
      </div>
    `;
  }

  /**
   * Show loading indicator
   */
  showLoading() {
    this.container.innerHTML = `
      <div class="loading" style="
        padding: 20px;
        text-align: center;
        color: #666;
      ">
        <div class="spinner"></div>
        Loading...
      </div>
    `;
  }

  /**
   * Destroy the chart and clean up
   */
  destroy() {
    this.clear();
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }
  }
}

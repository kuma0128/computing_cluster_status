import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import type { DiskUsage, DiskHeatmapChartProps } from '../../types';
import { BaseChartComponent } from './BaseChart';

class DiskHeatmapChartImpl extends BaseChartComponent<DiskUsage[]> {
  render(data: DiskUsage[]): void {
    if (!data || data.length === 0) {
      this.showWarning('No disk data available');
      return;
    }

    this.setupSVG();
    this.setupTooltip();

    if (!this.svg) return;

    // Get unique nodes and mount points
    const nodes = Array.from(new Set(data.map((d) => d.node))).sort();
    const mountPoints = Array.from(new Set(data.map((d) => d.mount_point))).sort();

    // Calculate cell dimensions
    const cellWidth = this.getInnerWidth() / mountPoints.length;
    const cellHeight = this.getInnerHeight() / nodes.length;

    // Color scale for usage percentage
    const colorScale = d3
      .scaleSequential(d3.interpolateRdYlGn)
      .domain([100, 0]); // Inverted: high usage = red, low usage = green

    // Create a map for quick lookup
    const dataMap = new Map<string, DiskUsage>();
    data.forEach((d) => {
      dataMap.set(`${d.node}:${d.mount_point}`, d);
    });

    // Add X axis (mount points)
    this.svg
      .append('g')
      .attr('transform', `translate(0,${this.getInnerHeight()})`)
      .call(
        d3.axisBottom(
          d3
            .scaleBand()
            .domain(mountPoints)
            .range([0, this.getInnerWidth()])
        )
      )
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    // Add Y axis (nodes)
    this.svg.append('g').call(
      d3.axisLeft(
        d3
          .scaleBand()
          .domain(nodes)
          .range([0, this.getInnerHeight()])
      )
    );

    // Create heatmap cells
    nodes.forEach((node, i) => {
      mountPoints.forEach((mountPoint, j) => {
        const diskData = dataMap.get(`${node}:${mountPoint}`);
        const usage = diskData?.usage_percent ?? 0;

        const cell = this.svg!
          .append('rect')
          .attr('x', j * cellWidth)
          .attr('y', i * cellHeight)
          .attr('width', cellWidth)
          .attr('height', cellHeight)
          .attr('fill', diskData ? colorScale(usage) : '#f0f0f0')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .style('cursor', diskData ? 'pointer' : 'default');

        if (diskData) {
          cell
            .on('mouseover', (event) => {
              const tooltipHtml = `
                <strong>${node}</strong><br/>
                Mount: ${mountPoint}<br/>
                Used: ${diskData.used_gb.toFixed(1)} GB<br/>
                Total: ${diskData.total_gb.toFixed(1)} GB<br/>
                Usage: ${usage.toFixed(1)}%
              `;
              this.showTooltip(tooltipHtml, event);
            })
            .on('mouseout', () => {
              this.hideTooltip();
            });

          // Add percentage label if cell is large enough
          if (cellWidth > 40 && cellHeight > 20) {
            this.svg!
              .append('text')
              .attr('x', j * cellWidth + cellWidth / 2)
              .attr('y', i * cellHeight + cellHeight / 2)
              .attr('text-anchor', 'middle')
              .attr('dominant-baseline', 'middle')
              .style('font-size', '11px')
              .style('fill', usage > 50 ? 'white' : 'black')
              .style('pointer-events', 'none')
              .text(`${usage.toFixed(0)}%`);
          }
        }
      });
    });

    // Add title
    this.svg
      .append('text')
      .attr('x', this.getInnerWidth() / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Disk Usage Heatmap');

    // Add legend
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = this.getInnerWidth() - legendWidth - 10;
    const legendY = -30;

    const legendScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([0, legendWidth]);

    // Create gradient
    const defs = this.svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'legend-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');

    gradient
      .selectAll('stop')
      .data(
        d3.range(0, 1.01, 0.1).map((t) => ({
          offset: `${t * 100}%`,
          color: colorScale(100 - t * 100),
        }))
      )
      .enter()
      .append('stop')
      .attr('offset', (d) => d.offset)
      .attr('stop-color', (d) => d.color);

    this.svg
      .append('rect')
      .attr('x', legendX)
      .attr('y', legendY)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#legend-gradient)');

    // Add legend axis
    this.svg
      .append('g')
      .attr('transform', `translate(${legendX},${legendY + legendHeight})`)
      .call(
        d3
          .axisBottom(legendScale)
          .ticks(5)
          .tickFormat((d) => `${d}%`)
      );
  }
}

export function DiskHeatmapChart({
  data,
  clusterName,
  width,
  height,
  margin,
}: DiskHeatmapChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<DiskHeatmapChartImpl | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    chartRef.current = new DiskHeatmapChartImpl(containerRef, {
      width,
      height,
      margin: margin ?? { top: 60, right: 20, bottom: 80, left: 100 },
    });
    chartRef.current.render(data);

    return () => {
      chartRef.current?.destroy();
    };
  }, [data, width, height, margin]);

  return (
    <div style={{ width: '100%' }}>
      <h3>{clusterName} - Disk Usage</h3>
      <div ref={containerRef} style={{ position: 'relative' }} />
    </div>
  );
}

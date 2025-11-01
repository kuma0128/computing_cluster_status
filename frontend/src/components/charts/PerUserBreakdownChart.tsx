import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import type { UserUsage, PerUserBreakdownChartProps } from '../../types';
import { BaseChartComponent } from './BaseChart';

class PerUserBreakdownChartImpl extends BaseChartComponent<UserUsage[]> {
  render(data: UserUsage[]): void {
    if (!data || data.length === 0) {
      this.showWarning('No user data available');
      return;
    }

    this.setupSVG();
    this.setupTooltip();

    if (!this.svg) return;

    // Sort data by CPU cores (descending)
    const sortedData = [...data].sort((a, b) => b.cpu_cores - a.cpu_cores);

    // Setup scales
    const x = d3
      .scaleBand()
      .domain(sortedData.map((d) => d.username))
      .range([0, this.getInnerWidth()])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(sortedData, (d) => d.cpu_cores) ?? 0])
      .nice()
      .range([this.getInnerHeight(), 0]);

    // Color scale
    const color = d3
      .scaleOrdinal<string>()
      .domain(sortedData.map((d) => d.username))
      .range(d3.schemeSet3);

    // Add X axis
    this.svg
      .append('g')
      .attr('transform', `translate(0,${this.getInnerHeight()})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    // Add Y axis
    this.svg.append('g').call(d3.axisLeft(y));

    // Add bars
    this.svg
      .selectAll('.bar')
      .data(sortedData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => x(d.username) ?? 0)
      .attr('y', (d) => y(d.cpu_cores))
      .attr('width', x.bandwidth())
      .attr('height', (d) => this.getInnerHeight() - y(d.cpu_cores))
      .attr('fill', (d) => color(d.username))
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        const tooltipHtml = `
          <strong>${d.username}</strong><br/>
          CPU Cores: ${d.cpu_cores}<br/>
          Memory: ${d.memory_gb.toFixed(1)} GB<br/>
          Jobs: ${d.jobs}
        `;
        this.showTooltip(tooltipHtml, event);
      })
      .on('mouseout', () => {
        this.hideTooltip();
      });

    // Add title
    this.svg
      .append('text')
      .attr('x', this.getInnerWidth() / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('User Resource Usage');

    // Add Y axis label
    this.svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - this.margin.left)
      .attr('x', 0 - this.getInnerHeight() / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('CPU Cores');

    // Add summary statistics
    const totalCores = d3.sum(sortedData, (d) => d.cpu_cores);
    const totalMemory = d3.sum(sortedData, (d) => d.memory_gb);
    const totalJobs = d3.sum(sortedData, (d) => d.jobs);

    this.svg
      .append('text')
      .attr('x', this.getInnerWidth())
      .attr('y', -5)
      .attr('text-anchor', 'end')
      .style('font-size', '12px')
      .text(
        `Total: ${totalCores} cores, ${totalMemory.toFixed(1)} GB, ${totalJobs} jobs`
      );
  }
}

export function PerUserBreakdownChart({
  data,
  clusterName,
  width,
  height,
  margin,
}: PerUserBreakdownChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<PerUserBreakdownChartImpl | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    chartRef.current = new PerUserBreakdownChartImpl(containerRef, {
      width,
      height,
      margin,
    });
    chartRef.current.render(data);

    return () => {
      chartRef.current?.destroy();
    };
  }, [data, width, height, margin]);

  return (
    <div style={{ width: '100%' }}>
      <h3>{clusterName} - User Breakdown</h3>
      <div ref={containerRef} style={{ position: 'relative' }} />
    </div>
  );
}

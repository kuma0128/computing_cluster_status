import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { BaseChartProps } from '../../types';

export interface BaseChartState {
  width: number;
  height: number;
  error: string | null;
  warning: string | null;
}

export abstract class BaseChartComponent<T> {
  protected containerRef: React.RefObject<HTMLDivElement>;
  protected svg: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  protected tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined> | null = null;
  protected width: number;
  protected height: number;
  protected margin: { top: number; right: number; bottom: number; left: number };

  constructor(
    containerRef: React.RefObject<HTMLDivElement>,
    props: BaseChartProps
  ) {
    this.containerRef = containerRef;
    this.width = props.width ?? 800;
    this.height = props.height ?? 400;
    this.margin = props.margin ?? { top: 20, right: 20, bottom: 30, left: 40 };
  }

  protected getInnerWidth(): number {
    return this.width - this.margin.left - this.margin.right;
  }

  protected getInnerHeight(): number {
    return this.height - this.margin.top - this.margin.bottom;
  }

  protected setupSVG(): void {
    if (!this.containerRef.current) return;

    // Clear existing content
    d3.select(this.containerRef.current).selectAll('*').remove();

    this.svg = d3
      .select(this.containerRef.current)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
  }

  protected setupTooltip(): void {
    if (!this.containerRef.current) return;

    this.tooltip = d3
      .select(this.containerRef.current)
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000');
  }

  protected showTooltip(html: string, event: MouseEvent): void {
    if (!this.tooltip) return;

    this.tooltip
      .html(html)
      .style('visibility', 'visible')
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`);
  }

  protected hideTooltip(): void {
    if (!this.tooltip) return;
    this.tooltip.style('visibility', 'hidden');
  }

  protected showError(message: string): void {
    if (!this.containerRef.current) return;

    d3.select(this.containerRef.current)
      .append('div')
      .attr('class', 'chart-error')
      .style('color', 'red')
      .style('padding', '10px')
      .text(`Error: ${message}`);
  }

  protected showWarning(message: string): void {
    if (!this.containerRef.current) return;

    d3.select(this.containerRef.current)
      .append('div')
      .attr('class', 'chart-warning')
      .style('color', 'orange')
      .style('padding', '10px')
      .text(`Warning: ${message}`);
  }

  abstract render(data: T): void;

  destroy(): void {
    if (this.containerRef.current) {
      d3.select(this.containerRef.current).selectAll('*').remove();
    }
  }
}

interface BaseChartComponentProps<T> extends BaseChartProps {
  data: T;
  ChartClass: new (
    containerRef: React.RefObject<HTMLDivElement>,
    props: BaseChartProps
  ) => BaseChartComponent<T>;
}

export function BaseChart<T>({
  data,
  ChartClass,
  width,
  height,
  margin,
}: BaseChartComponentProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<BaseChartComponent<T> | null>(null);
  const [state, setState] = useState<BaseChartState>({
    width: width ?? 800,
    height: height ?? 400,
    error: null,
    warning: null,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      chartRef.current = new ChartClass(containerRef, { width, height, margin });
      chartRef.current.render(data);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }

    return () => {
      chartRef.current?.destroy();
    };
  }, [data, ChartClass, width, height, margin]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setState((prev) => ({
          ...prev,
          width: rect.width,
        }));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: state.height,
      }}
    >
      {state.error && (
        <div style={{ color: 'red', padding: '10px' }}>Error: {state.error}</div>
      )}
      {state.warning && (
        <div style={{ color: 'orange', padding: '10px' }}>
          Warning: {state.warning}
        </div>
      )}
    </div>
  );
}

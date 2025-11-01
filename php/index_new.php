<!DOCTYPE html>
<html lang="ja">

<head>
  <title>計算機稼働状況</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="author" content="伊藤大晟 佐藤大和">
  <link href="../css/index.css" rel="stylesheet" type="text/css">
  <script src="../js/d3.v5.min.js"></script>
  <style>
    .error-message {
      color: red;
      padding: 20px;
      text-align: center;
    }

    .loading {
      text-align: center;
      padding: 20px;
    }

    .tooltip {
      position: absolute;
      text-align: center;
      padding: 8px;
      font: 12px sans-serif;
      background: lightsteelblue;
      border: 0px;
      border-radius: 8px;
      pointer-events: none;
      visibility: hidden;
    }
  </style>
</head>

<body>
  <div id="main">
    <div align="right">
      <a href="login.php" class="btn btn-border-shadow btn-border-shadow--color">Login</a>
    </div>

    <div class="explain">
      <p>現在の各クラスタの稼働状況</p>
      <p>1時間毎に更新されます。</p>
    </div>

    <!-- Warning message area -->
    <div id="warning-message" style="display: none; background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 10px 0; border-radius: 5px;">
      <strong>⚠️ 警告:</strong>
      <span id="warning-text"></span>
    </div>

    <div class="mainblock">
      <div class="iplist">
        <h>Down nodes</h>
        <p class="down" id="down-nodes">Loading...</p>
      </div>

      <div class="iplist">
        <h>Alive nodes</h>
        <p class="alive" id="alive-nodes">Loading...</p>
      </div>

      <div id="barchart" class="mainchart">
        <div class="loading">Loading chart...</div>
      </div>
    </div>
  </div>

  <script>
    // API client
    class ClusterAPI {
      constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
      }

      async fetchMetrics(type = 'current') {
        try {
          const response = await fetch(`${this.baseUrl}/metrics.php?type=${type}`);
          if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            // Return empty data structure instead of throwing
            return this.getEmptyResponse(type);
          }
          const data = await response.json();
          return data;
        } catch (error) {
          console.error('Fetch error:', error);
          return this.getEmptyResponse(type);
        }
      }

      getEmptyResponse(type) {
        switch(type) {
          case 'nodes':
            return { alive: [], down: [], total: 0, has_data: false, message: 'データ取得エラー' };
          case 'current':
            return { load_average: [], pbs_usage: [], cpu_usage: [], has_data: false };
          default:
            return [];
        }
      }

      async fetchNodes() {
        return await this.fetchMetrics('nodes');
      }
    }

    // Visualization class
    class ClusterVisualization {
      constructor(containerId) {
        this.containerId = containerId;
        this.margin = { top: 20, right: 20, bottom: 60, left: 100 };
        this.width = 680 - this.margin.left - this.margin.right;
        this.height = 450 - this.margin.top - this.margin.bottom;
      }

      clear() {
        d3.select(`#${this.containerId}`).selectAll("svg").remove();
      }

      render(data, isDummy = false) {
        this.clear();

        if (!data || data.length === 0) {
          d3.select(`#${this.containerId}`)
            .html('<div class="error-message">データが見つかりません</div>');
          return;
        }

        // Add warning if dummy data
        if (isDummy) {
          this.showWarning('実データが取得できていません。ダミー値を表示しています。');
        }

        const dataset = data.map(d => ({
          name: d.cluster,
          load: parseFloat(d.load_average) || 0,
          pbs: parseFloat(d.pbs_usage) || 0,
          cpu: parseFloat(d.cpu_usage) || 0,
          isDummy: d.is_dummy || false
        }));

        const y = d3.scaleBand()
          .rangeRound([this.height, 0])
          .padding(0.3)
          .domain(dataset.map(d => d.name));

        const x = d3.scaleLinear()
          .rangeRound([0, this.width])
          .nice()
          .domain([0, Math.max(100, d3.max(dataset, d => Math.max(d.load, d.pbs)))]);

        const svg = d3.select(`#${this.containerId}`)
          .append("svg")
          .attr("width", this.width + this.margin.left + this.margin.right)
          .attr("height", this.height + this.margin.top + this.margin.bottom)
          .append("g")
          .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        const tooltip = d3.select("body").append("div").attr("class", "tooltip");

        // Grid lines
        svg.append("g")
          .call(d3.axisBottom(x).ticks(10).tickSize(this.height))
          .style("font-size", "0px");

        // X-axis
        svg.append("g")
          .attr("transform", `translate(0,${this.height})`)
          .call(d3.axisBottom(x))
          .style("font-size", "20px")
          .append("text")
          .attr("fill", "black")
          .attr("x", this.width / 2)
          .attr("y", this.margin.bottom - 5)
          .attr("text-anchor", "middle")
          .attr("font-size", "20pt")
          .text("各クラスタの稼働率 (%)")
          .style("fill", "#0A0017");

        // Load average bars
        svg.selectAll(".bar-load")
          .data(dataset)
          .enter()
          .append("rect")
          .attr("class", "bar-load")
          .attr("y", d => y(d.name))
          .attr("width", d => x(d.load))
          .attr("height", y.bandwidth() / 2)
          .attr("fill", "steelblue")
          .on("mouseover", function(d) {
            tooltip
              .style("visibility", "visible")
              .html(`Cluster: ${d.name}<br>Load average: ${d.load.toFixed(2)}%`);
          })
          .on("mousemove", function() {
            tooltip
              .style("top", `${d3.event.pageY + 20}px`)
              .style("left", `${d3.event.pageX + 10}px`);
          })
          .on("mouseout", function() {
            tooltip.style("visibility", "hidden");
          });

        // PBS usage bars
        svg.selectAll(".bar-pbs")
          .data(dataset)
          .enter()
          .append("rect")
          .attr("class", "bar-pbs")
          .attr("y", d => y(d.name) + y.bandwidth() / 2)
          .attr("width", d => x(d.pbs))
          .attr("height", y.bandwidth() / 2)
          .attr("fill", "lightgreen")
          .on("mouseover", function(d) {
            tooltip
              .style("visibility", "visible")
              .html(`Cluster: ${d.name}<br>PBS use rate: ${d.pbs.toFixed(2)}%<br>CPU use rate: ${d.cpu}`);
          })
          .on("mousemove", function() {
            tooltip
              .style("top", `${d3.event.pageY + 20}px`)
              .style("left", `${d3.event.pageX + 10}px`);
          })
          .on("mouseout", function() {
            tooltip.style("visibility", "hidden");
          });

        // Y-axis
        svg.append("g")
          .call(d3.axisLeft(y))
          .style("font-size", "20px");
      }

      showWarning(message) {
        const warningEl = document.getElementById('warning-message');
        const textEl = document.getElementById('warning-text');
        if (warningEl && textEl) {
          textEl.textContent = message;
          warningEl.style.display = 'block';
        }
      }

      hideWarning() {
        const warningEl = document.getElementById('warning-message');
        if (warningEl) {
          warningEl.style.display = 'none';
        }
      }
    }

    // Application controller
    class ClusterDashboard {
      constructor() {
        this.api = new ClusterAPI();
        this.viz = new ClusterVisualization('barchart');
      }

      async updateNodes() {
        const nodes = await this.api.fetchNodes();

        const downEl = document.getElementById('down-nodes');
        const aliveEl = document.getElementById('alive-nodes');

        // Show warning if no data
        if (nodes.message && nodes.message !== 'OK') {
          this.viz.showWarning(nodes.message);
        }

        downEl.innerHTML = nodes.down && nodes.down.length > 0 ? nodes.down.join('<br>') : 'なし';
        aliveEl.innerHTML = nodes.alive && nodes.alive.length > 0 ? nodes.alive.join('<br>') : 'なし';
      }

      async updateMetrics() {
        const metrics = await this.api.fetchMetrics('current');

        // Check if we have real data
        const hasData = metrics.has_data !== false;

        if (!hasData) {
          this.viz.showWarning('メトリクスデータが取得できていません。ダミー値を表示しています。');
        } else {
          this.viz.hideWarning();
        }

        // Transform data for visualization
        const clusters = {};

        // Merge all metric types by cluster
        (metrics.load_average || []).forEach(item => {
          if (!clusters[item.cluster]) {
            clusters[item.cluster] = {
              cluster: item.cluster,
              is_dummy: item.is_dummy || false
            };
          }
          clusters[item.cluster].load_average = item.value;
        });

        (metrics.pbs_usage || []).forEach(item => {
          if (!clusters[item.cluster]) {
            clusters[item.cluster] = {
              cluster: item.cluster,
              is_dummy: item.is_dummy || false
            };
          }
          clusters[item.cluster].pbs_usage = item.value;
        });

        (metrics.cpu_usage || []).forEach(item => {
          if (!clusters[item.cluster]) {
            clusters[item.cluster] = {
              cluster: item.cluster,
              is_dummy: item.is_dummy || false
            };
          }
          clusters[item.cluster].cpu_usage = item.value;
        });

        const chartData = Object.values(clusters);

        if (chartData.length === 0) {
          d3.select('#barchart')
            .html('<div class="error-message">データが見つかりません</div>');
          return;
        }

        const isDummy = chartData.some(d => d.is_dummy);
        this.viz.render(chartData, isDummy);
      }

      async initialize() {
        await Promise.all([
          this.updateNodes(),
          this.updateMetrics()
        ]);
      }

      startAutoRefresh(interval = 3600000) { // 1 hour default
        setInterval(() => {
          this.updateNodes();
          this.updateMetrics();
        }, interval);
      }
    }

    // Initialize dashboard
    const dashboard = new ClusterDashboard();
    dashboard.initialize();
    // dashboard.startAutoRefresh(); // Uncomment to enable auto-refresh

    // Handle window resize
    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      if (resizeTimer > 0) {
        window.clearTimeout(resizeTimer);
      }
      resizeTimer = setTimeout(() => {
        dashboard.updateMetrics();
      }, 200);
    });
  </script>
</body>

</html>

render();

function render() {
  var dataset = new Array();
  for (i = 0; i < data.length; i++) {
    dataset[i] = { "date": data[i][0], "value": data[i][1] };
  }
  var dataset1 = new Array();
  for (i = 0; i < data1.length; i++) {
    dataset1[i] = { "date": data1[i][0], "value": data1[i][1] };
  }
  var margin = { top: 20, right: 20, bottom: 60, left: 100 }
  var width = 780 - margin.left - margin.right;
  var height = 450 - margin.top - margin.bottom;
  var padding = 30;

  var timeparser = d3.timeParse("%Y-%m-%d %H:%M:%S");
  dataset = dataset.map(function (d) {
    return { "date": timeparser(d.date), "value": d.value };
  });
  dataset1 = dataset1.map(function (d) {
    return { "date": timeparser(d.date), "value": d.value };
  });

  var svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

  var xScale = d3.scaleTime()
    .domain([d3.min(dataset1, function (d) { return d.date; }),
    d3.max(dataset1, function (d) { return d.date; })])
    .range([padding, width - padding]);

  m = [
    d3.max(dataset, function (d) { return d.value; }),
    d3.max(dataset1, function (d) { return d.value; }),
  ]

  var yScale = d3.scaleLinear()
    //.domain([0,d3.max(dataset, function(d){return d.value;})])
    .domain([0, d3.max(m)])
    .range([height - padding, padding]);

  var line = d3.line()
    .x(function (d) { return xScale(d.date); })
    .y(function (d) { return yScale(d.value); });

  const tooltip = d3.select("body").append("div").attr("class", "tooltip");
  const bisectDate = d3.bisector(function (d) { return d.date; }).left;

  focus = svg.append("g")
    .attr("class", "focus")
    .style("visibility", "hidden");

  focusLine = focus.append("line");

  focusPoint = focus.append("circle")
    .attr("r", 4)
    .attr("fill", "#fff")
    .attr("stroke", d3.rgb("#85a7cc"))
    .attr("stroke-width", 2);

  focusPoint1 = focus.append("circle")
    .attr("r", 4)
    .attr("fill", "#fff")
    .attr("stroke", d3.rgb("#85a7cc"))
    .attr("stroke-width", 2);

  focusLine
    .style("stroke", "#ccc")
    .style("stroke-width", "2px")
    .style("stroke-dasharray", "7")
    .attr("class", "x-hover-line hover-line")
    .attr("y1", padding)
    .attr("y2", height - padding);

  overlay = svg.append("rect")
    .style("fill", "none")
    .style("pointer-events", "all")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height);

  overlay
    .on("mousemove", function (d, i) {
      x0 = xScale.invert(d3.mouse(this)[0]);
      i = bisectDate(dataset, x0, 1);
      d0 = dataset[i - 1];
      d1 = dataset[i];
      d = x0 - d0.date > d1.date - x0 ? d1 : d0;
      i = bisectDate(dataset1, x0, 1);
      d0 = dataset1[i - 1];
      d1 = dataset1[i];
      d11 = x0 - d0.date > d1.date - x0 ? d1 : d0;
      format = d3.timeFormat("%Y/%m/%d %H:%M");
      tooltipX = (d3.event.pageX + 30);
      tooltipY = (d3.event.pageY + 10);

      tooltip
        .style("visibility", "visible")
        .style("top", tooltipY + "px")
        .style("left", tooltipX + "px")
        .html("Date : " + format(d.date) + "<br><span style='color:steelblue'>Load average </span>: " + d.value + " %"
          + "<br><span style='color:red'>PBS use rate </span>: " + d11.value + " %");
      focus
        .style("visibility", "visible")
        .attr("transform", "translate(" + xScale(d11.date) + "," + 0 + ")");

      focusPoint
        .attr("transform", "translate(" + 0 + "," + yScale(d.value) + ")");
      focusPoint1
        .attr("transform", "translate(" + 0 + "," + yScale(d11.value) + ")");

    })
    .on("mouseout", function (d) {
      tooltip
        .style("visibility", "hidden");
      focus
        .style("visibility", "hidden");
    });

  svg.append("path")
    .datum(dataset)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("stroke-width", 1.5)
    .attr("d", line);

  svg.append("path")
    .datum(dataset1)
    .attr("fill", "none")
    .attr("stroke", "red")
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("stroke-width", 1.5)
    .attr("d", line);

  svg.append("g")
    .attr("transform", "translate(" + 0 + "," + (height - padding) + ")")
    .call(d3.axisBottom(xScale)
      .ticks(4)
      .tickFormat(d3.timeFormat("%y/%m/%d"))
    )
    .style("font-size", "15px")
    .append("text")
    .attr("fill", "black")
    .attr("x", (width - margin.left - margin.right) / 2 + margin.left)
    .attr("y", 55);

  svg.append("g")
    .attr("transform", "translate(" + padding + "," + 0 + ")")
    .call(d3.axisLeft(yScale)
      .ticks(5)
    )
    .style("font-size", "15px");

}

function remove() {
  d3.select("#chart").selectAll("svg").remove();
  d3.select("#chart").selectAll("div").remove();
}

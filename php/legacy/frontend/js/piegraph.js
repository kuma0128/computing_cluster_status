// var data = <?php echo json_encode($ary); ?>;
// var disk = <?php echo json_encode($tot); ?>;
var width = 550;
var height = 550;
var margin = 60;
var radius = Math.min(width, height) / 2 - margin;
var dataset = new Array(data.length);
for (i = 0; i < data.length; i++) {
  dataset[i] = { name: data[i][0], value: data[i][1] };
}
dataset[i] = { name: "Avail", value: disk[0][2] };
var color = d3.scale.category20();

function render() {
  var pie = d3.layout.pie()
    .value(function (d) { return d.value; })
    .sort(null);
  var arc = d3.svg.arc()
    .outerRadius(radius * 0.8)
    .innerRadius(radius * 0.0);
  var outerArc = d3.svg.arc()
    .outerRadius(radius * 0.9)
    .innerRadius(radius * 0.9);
  var svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
  var tooltip = d3.select("body").append("div").attr("class", "tooltip");

  var pieG = svg.selectAll(".pie")
    .data(pie(dataset))
    .enter()
    .append("g")
    .attr("class", "pie")
    .on("mouseover", function (d) {
      tooltip
        .style("visibility", "visible")
        .html("User : " + d.data.name + "<br>Use Disk : " + d.value + " GB");
    })
    .on("mousemove", function (d) {
      tooltip
        .style("top", (d3.event.pageY - 20) + "px")
        .style("left", (d3.event.pageX + 10) + "px");
    })
    .on("mouseout", function (d) {
      tooltip.style("visibility", "hidden");
    });

  pieG.append("path")
    .attr("d", arc)
    .attr("opacity", 0.75)
    .attr("stroke", "white")
    .style("fill", function (d) {
      return color(d.value);
    });

  var PolG = svg.selectAll('allPolylines')
    .data(pie(dataset))
    .enter()
    .append('polyline')
    .attr("stroke", "black")
    .style("fill", "none")
    .attr("stroke-width", 1)
    .attr('points', function (d) {
      var posA = arc.centroid(d) // line insertion in the slice
      var posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
      var posC = outerArc.centroid(d); // Label position = almost the same as posB
      var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
      posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
      return [posA, posB, posC]
    });

  var PolG = svg.selectAll('allPolylabel')
    .data(pie(dataset))
    .enter()
    .append('text')
    .attr("fill", "black")
    .text(function (d) { return d.data.name; })
    .style("font-size", "15px")
    .attr("dy", "3px")
    .attr('transform', function (d) {
      var pos = outerArc.centroid(d);
      var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
      pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
      return 'translate(' + pos + ')';
    })
    .style('text-anchor', function (d) {
      var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
      return (midangle < Math.PI ? 'start' : 'end')
    })
    .on("mouseover", function (d) {
      tooltip
        .style("visibility", "visible")
        .html("User : " + d.data.name + "<br>Use Disk : " + d.value + " GB");
    })
    .on("mousemove", function (d) {
      tooltip
        .style("top", (d3.event.pageY - 20) + "px")
        .style("left", (d3.event.pageX + 10) + "px");
    })
    .on("mouseout", function (d) {
      tooltip.style("visibility", "hidden");
    });
}
render();

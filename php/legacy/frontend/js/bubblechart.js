var dataset = { children: [] }
for (i = 0; i < data.length; i++) {
  dataset.children[i] = { name: data[i][0], value: data[i][1] };
}
//var margin = {top:0,right:20,bottom:10,left:10}
var margin = { top: -30, right: 0, bottom: 20, left: 0 }
var width = 300 - margin.left - margin.right;
var height = 350 - margin.top - margin.bottom;

var svg = d3.select("#bubblechart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",
    "translate(" + margin.left + "," + margin.top + ")");

var bubble = d3.pack()
  .size([width, height])
  .padding(1.5);

var nodes = d3.hierarchy(dataset)
  .sum(function (d) { return d.value; });

var bubbledata = bubble(nodes).descendants();

var norootbubble = bubbledata.filter(function (d) { return d.parent != null; });

var tooltip = d3.select("body").append("div").attr("class", "tooltip");

svg.append("g")
  .append("text")
  .attr("fill", "black")
  .attr("x", width / 2 + margin.left * 2)
  .attr("y", height)
  .attr("text-anchor", "middle")
  .attr("font-size", "15pt")
  //    .attr("font-weight", "bold")
  .text("ユーザー毎の使用率（%）")
  .style("fill", "#0A0017");

minval = d3.min(norootbubble, function (d) { return d.r; });
maxval = d3.max(norootbubble, function (d) { return d.r; });

fontscale = d3.scaleLinear()
  .domain([minval, maxval])
  .range([0, 25]);
var color_scale = d3.scaleLinear()
  .domain([minval, maxval])
  .range(d3.schemeCategory10);


tot = norootbubble.reduce((a, x) => a += x.r, 0);

svg = svg.selectAll(".bubble")
  .data(norootbubble)
  .enter()
  .append("g")
  .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
// .on("mouseover", function(d) {
//   tooltip
//     .style("visibility", "visible")
//     .html("User : " + d.data.name + "<br> Use rate : " + Math.round(d.r/tot*10000)/100 + " %" );
// })
// .on("mousemove", function(d) {
//   tooltip
//     .style("top", (d3.event.pageY + 20) + "px")
//     .style("left", (d3.event.pageX + 10) + "px");
// })
// .on("mouseout", function(d) {
//   tooltip.style("visibility", "hidden");
// });

svg.append("circle")
  .attr("r", function (d) { return d.r; })
  .style("fill", function (d, i) {
    if (i >= 12) {
      i = i - 12;
    }
    //taisei append
    //return d3.schemeSet2[i];
    //return color_scale(d,r);
    return d3.schemeSet3[i];
  });

svg.append("text")
  .attr("text-anchor", "middle")
  .attr("dominant-baseline", "central")
  .text(function (d) { return d.data.name; })
  .style("font-size", function (d) { return fontscale(d.r) + "px"; });


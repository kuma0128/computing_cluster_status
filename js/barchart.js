function render() {
  var dataset1 = new Array();
  var dataset2 = new Array();
  for (i = 0; i < clus.length - 1; i++) {
    j = i + 1;
    dataset1[i] = { "name": clus[j][0], "value": data1[j], "link": "cluster/" + clus[j][0] + "/" + clus[j][0] + "_week.php" };
    dataset2[i] = { "name": clus[j][0], "value": data2[j], "value2": data3[j], "link": "cluster/" + clus[j][0] + "/" + clus[j][0] + "_week.php" };
  }

  console.log(dataset2);

  var margin = { top: 20, right: 20, bottom: 60, left: 100 }
  var width = 680 - margin.left - margin.right;
  var height = 450 - margin.top - margin.bottom;

  const y = d3.scaleBand()
    .rangeRound([height, 0])
    .padding(0.3);

  const x = d3.scaleLinear()
    .rangeRound([0, width])
    .nice();

  var svg = d3.select("#barchart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    //            .attr("viewBox", "0 0 "+ width +" " + height +"")
    //            .attr("preserveAspectRatio", "xMidYMid") 
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

  var tooltip = d3.select("body").append("div").attr("class", "tooltip");

  var xmax = Math.round(Math.max.apply(null, dataset1.map(function (d) { return d.value; })) / 10) * 10;
  if (xmax > 100) {
    x.domain([0, xmax]);
  } else {
    x.domain([0, 100]);
  }
  y.domain(dataset1.map(function (d) { return d.name; }));

  svg.append("g")
    .call(d3.axisBottom(x)
      .ticks(10)
      .tickSize(height)
    )
    .style("font-size", "0px");

  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .style("font-size", "20px")
    .append("text")
    .attr("fill", "black")
    .attr("x", (width - margin.left - margin.right) / 2 + margin.left)
    .attr("y", margin.bottom - 5)
    .attr("text-anchor", "middle")
    .attr("font-size", "20pt")
    .text("各クラスタの稼働率 (%)")
    .style("fill", "#0A0017");

  svg.selectAll(".bar")
    .data(dataset1)
    .enter()
    .append("rect")
    .attr("y", function (d) { return y(d.name); })
    .attr("width", function (d) { return x(d.value); })
    .attr("height", y.bandwidth() / 2)
    .attr("fill", "steelblue")
    .attr("class", "bar")
    .on("mouseover", function (d) {
      tooltip
        .style("visibility", "visible")
        .html("Cluster : " + d.name + "<br>Load average : " + d.value + " %");
    })
    .on("mousemove", function (d) {
      tooltip
        .style("top", (d3.event.pageY + 20) + "px")
        .style("left", (d3.event.pageX + 10) + "px");
    })
    .on("mouseout", function (d) {
      tooltip.style("visibility", "hidden");
    })
    .on("click", function (d) {
      window.location = d.link;
    });

  svg.selectAll(".bar2")
    .data(dataset2)
    .enter()
    .append("rect")
    .attr("y", function (d) { return y(d.name) + y.bandwidth() / 2; })
    .attr("width", function (d) { return x(d.value); })
    .attr("height", y.bandwidth() / 2)
    .attr("fill", "lightgreen")
    .attr("class", "bar")
    .on("mouseover", function (d) {
      tooltip
        .style("visibility", "visible")
        .html("Cluster : " + d.name + "<br>PBS use rate : " + d.value + " %" + "<br>CPU use rate : " + d.value2);
    })
    .on("mousemove", function (d) {
      tooltip
        .style("top", (d3.event.pageY + 20) + "px")
        .style("left", (d3.event.pageX + 10) + "px");
    })
    .on("mouseout", function (d) {
      tooltip.style("visibility", "hidden");
    })
    .on("click", function (d) {
      window.location = d.link;
    });

  svg.append("g")
    .attr("height", y.bandwidth())
    .call(d3.axisLeft(y))
    .style("font-size", "20px");
} //render
render();

/* -----------------------------------
  responsive with window size
----------------------------------- */
//var chart = $("#chart"),
//    container = chart.parent();
//
//$(window).on("resize", function() {
//
//    var targetWidth = container.width();
//    chart.attr("width", targetWidth);
//    chart.attr("height", Math.round(targetWidth / aspect));
//
//}).trigger("resize");

var timer = 0;
window.onresize = function () {
  if (timer > 0) {
    window.clearTimeout(timer);
  }
  timer = setTimeout(function () {
    remove();
    render();
  }, 200);
};

function remove() {
  d3.select("#barchart").selectAll("svg").remove();
}

<!DOCTYPE html>
<html lang="ja">

<head>
  <title>ディスク使用率</title>
  <link href="./../css/index.css" rel="stylesheet" type="text/css">
  <script src="./../js/d3.v3.min.js"></script>
  <style>
    svg {
      width: 33.3333333%;
    }
  </style>
</head>

<body>
  <div id="main">
    <?php include("./nav.php"); ?>
    <div class="explain">
      <p>各サーバのディスク使用率</p>
    </div>
    <?php
    $dsn = "mysql:dbname=XXXX;host=localhost";
    $user = "XXXX";
    $password = "";
    try {
      $dbh = new PDO($dsn, $user, $password);
    } catch (PDOException $e) {
      print("Error:" . $e->getMessage());
      die();
    }
    $table = "XXXX";
    $db = "XXXX";
    $sql = "SELECT update_time FROM information_schema.tables WHERE table_schema = '$db' AND table_name = '$table'";
    foreach ($dbh->query($sql) as $up) {
    }
    ?>
    <?php
    //printf("%10s %10s","最終更新日時 : ","$up[0]");
    $table = "XXXX";
    $sql = "SELECT * FROM $table";
    $sql = $dbh->query($sql);
    $tot = $sql->fetchAll();

    $sql = "SELECT cluster FROM $table";
    $sql = $dbh->query($sql);
    $clus = $sql->fetchAll();


    $dbh = null;
    $sql = null;
    ?>
    <div class="explain">
      <p>
        <?php echo "最終更新日時 : ", "$up[0]"; ?>
      </p>
      <form onsubmit="return disk()" target="getlist" style="display:inline;">
        <input id="chkdisk" type="submit" value="更新">
        <iframe name="getlist" style="display:none;"></iframe>
        <form>
    </div>

    <script>
      function disk() {
        var target = document.getElementById("chkdisk");
        target.value = "更新中"
        target.disabled = true;
        work = <?php echo json_encode($clus); ?>;
        clus = new Array();
        for (i = 0; i < work.length; i++) {
          clus[i] = work[i].cluster
        }

        $.ajax({
          type: "POST",
          url: "reload_disk.php",
          dataType: "json",
          data: {
            clus: <?php echo json_encode($clus); ?>
          },
        }).done(function(data) {
          remove();
          input();
          target.value = "更新"
          target.disabled = false;
        });
      }
    </script>


    <div id="chart">
      <script>
        var data = <?php echo json_encode($tot); ?>;

        var width = 300;
        var height = 200;
        var radius = Math.min(width, height) / 2 - 10;

        input();

        function input() {
          for (i = 0; i < data.length; i++) {
            clus = data[i].cluster
            link = "cluster/" + clus + "/" + clus + ".php"
            dataset = [{
              name: "Used",
              value: data[i][1],
              "link": link
            }, {
              name: "Avail",
              value: data[i][2],
              "link": link
            }]
            render();
          }
        }

        function render() { //{{{
          var color = d3.scale.category20();
          var pie = d3.layout.pie()
            .value(function(d) {
              return d.value;
            })
            .sort(null);
          var arc = d3.svg.arc()
            .outerRadius(radius)
            .innerRadius(30);
          var svg = d3.select("#chart").append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
          svg.append("text")
            .attr("text-anchor", "middle")
            .text(clus)
            .data(pie(dataset))
            .attr("transform", "translate( 0,5)");

          var tooltip = d3.select("#chart").append("div").attr("class", "tooltip");


          var pieG = svg.selectAll(".pie")
            .data(pie(dataset))
            .enter()
            .append("g")
            .attr("class", "pie")
            .on("click", function(d) {
              window.location = d.data.link;
            })
            .on("mouseover", function(d) {
              tooltip
                .style("visibility", "visible")
                .html("" + d.data.name + "<br>Size : " + d.value + " GB");
            })
            .on("mousemove", function(d) {
              tooltip
                .style("top", (d3.event.pageY - 20) + "px")
                .style("left", (d3.event.pageX + 10) + "px");
            })
            .on("mouseout", function(d) {
              tooltip.style("visibility", "hidden");
            });

          pieG.append("path")
            .attr("d", arc)
            .attr("opacity", 0.75)
            .attr("stroke", "white")
            .style("fill", function(d) {
              return color(d.value);
            });

          var text = d3.svg.arc()
            .outerRadius(radius - 30)
            .innerRadius(radius - 30);

          pieG.append("text")
            .attr("fill", "black")
            .attr("transform", function(d) {
              return "translate(" + text.centroid(d) + ")";
            })
            .attr("dy", "5px")
            .style("font-size", "20px")
            .attr("text-anchor", "middle")
            .text(function(d) {
              return d.data.name;
            })

        } //}}}

        function remove() {
          d3.select("#chart").selectAll("svg").remove();
          d3.select("#chart").selectAll("div").remove();
        }
      </script>
    </div>
    <footer><?php include("footer.html"); ?></footer>
  </div>
  <!--main-->
</body>

</html>
<!DOCTYPE html>
<html lang="ja">

<head>
  <title>過去の稼働状況</title>
  <link href="/index.css" rel="stylesheet" type="text/css">
  <script src="/js/d3.v5.min.js"></script>
  <style>
  </style>
</head>

<body>
  <div id="main">
    <?php include("nav.php"); ?>
    <div class="explain">
      <p>全クラスタの稼働状況</p>
    </div>
    <?php
    $cluster = "total";
    include("rate.php");
    include("presets.php");
    ?>

    <div id="chart"></div>
    <script>
      var data = <?php echo json_encode($ary); ?>;
    </script>
    <script>
      var data1 = <?php echo json_encode($ary1); ?>;
    </script>
    <script src="/js/linegraph.js"></script>

  </div>
</body>

</html>
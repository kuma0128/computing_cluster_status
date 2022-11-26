<!DOCTYPE html>
<html lang="ja">

<head>
  <title>asuka（稼働率）</title>
  <link href="/index.css" rel="stylesheet" type="text/css">
  <script src="/js/d3.v5.min.js"></script>
  <style>
  </style>
</head>

<body>
  <div id="main">
    <?php include("/home/web/html/nav.php"); ?>
    <?php
    $cluster = "asuka";
    ?>
    <div class="explain">
      <p><?php echo $cluster . "クラスタの稼働状況"; ?></p>
    </div>
    <?php
    include("/home/web/html/rate.php");
    include("/home/web/html/presets.php");
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
<!DOCTYPE html>
<html lang="ja">

<head>
  <title>asuka（ディスク使用率）</title>
  <link href="/index.css" rel="stylesheet" type="text/css">
  <script src="/js/d3.v3.min.js"></script>
  <style>
  </style>
</head>

<body>
  <div id="main">
    <?php
    include("/home/web/html/nav.php");
    $cluster = basename(__FILE__, ".php");
    include("/home/web/html/pie.php");
    ?>
    <div id="chart"></div>
    <script>
      var data = <?php echo json_encode($ary); ?>;
      var disk = <?php echo json_encode($tot); ?>;
    </script>
    <script src="/js/piegraph.js"> </script>
    <img src="./duc.png">
  </div>
</body>

</html>
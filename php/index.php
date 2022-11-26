<!DOCTYPE html>
<html lang="ja">

<head>
  <title>計算機稼働状況</title>
  <!-- <meta http&#45;equiv="refresh" content="3600" > -->
  <meta name="author" content="伊藤大晟 佐藤大和">
  <link href="./../css/index.css" rel="stylesheet" type="text/css">
  <script src="./../js/d3.v5.min.js"></script>
  <style>
  </style>
</head>

<body>
  <div id="main">
    <div align="right">
      <a href="login.php" class="btn btn-border-shadow btn-border-shadow--color">Login</a>
    </div>
    <?php include("nav.php"); ?>
    <div class="explain">
      <p>現在の各クラスタの稼働状況</p>
      <p>1時間毎に更新されます。</p>
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
    $sql = $dbh->query("describe $table");
    $name = $sql->fetchAll();
    $sql = "SELECT * FROM $table ORDER BY time DESC LIMIT 1";
    foreach ($dbh->query($sql) as $load) {
    }

    $table = "XXXX";
    $sql = "SELECT * FROM $table ORDER BY TIME DESC LIMIT 1";
    foreach ($dbh->query($sql) as $pbs) {
    }

    $table = "XXXX";
    $sql = "SELECT * FROM $table ORDER BY time DESC LIMIT 1";
    foreach ($dbh->query($sql) as $cpu) {
    }

    $table = "XXXX";
    $sql = $dbh->prepare("SELECT * FROM $table WHERE time > 100 ORDER BY time");
    $sql->execute();
    $ary = array();

    while ($row = $sql->fetch(PDO::FETCH_ASSOC)) {
      $ary[] = array(
        0  => $row['User'],
        1  => (int)$row['time']
      );
    }

    ?>

    <div class="mainblock">
      <!-- <div class ="node"> -->
      <div class="iplist">
        <h>Down nodes</h>
        <p class="down">
          <?php
          $table = "XXXX";
          $sql = "SELECT cluster FROM $table";
          foreach ($dbh->query($sql) as $row) {
            print($row[0]);
            print("<br />");
          }
          ?>
        </p>
      </div>
      <!-- <input id="chkping" type="submit" value="更新" style="position: absolute;" > -->

      <div class="iplist">
        <h>Alive nodes</h>
        <form onsubmit="return ping()" target="getlist" style="display:inline;">
          <form>
            <iframe name="getlist" style="display:none;"></iframe>
            <p class="alive">
              <?php
              $table = "XXXX";
              $sql = "SELECT cluster FROM $table";
              foreach ($dbh->query($sql) as $row) {
                print($row[0]);
                print("<br />");
              }
              $dbh = null;
              $sql = null;
              ?>
            </p>
      </div>
      <!-- </div> -->
      <!--  <input id="chkping" type="submit" value="更新" style="position: relative; bottom: 10px;" > -->

      <script>
        function ping() {
          var target = document.getElementById("chkping");
          target.value = "更新中"
          target.disabled = true;

          $.ajax({
            type: "POST",
            url: "ping.php",
            dataType: "json",
          }).done(function(data) {
            $(".down").html('<p1>' + data.down + '</p1>');
            $(".alive").html('<p1>' + data.alive + '</p1>');
            target.value = "更新"
            target.disabled = false;
          }).fail(function() {
            $(".down").html('<p1>' + "error" + '</p1>');
            $(".alive").html('<p1>' + "error" + '</p1>');
            target.value = "更新"
            target.disabled = false;
          });
        }
      </script>

      <div id="barchart" class="mainchart">
        <script>
          var data1 = <?php echo json_encode($load); ?>;
          var data2 = <?php echo json_encode($pbs); ?>;
          var data3 = <?php echo json_encode($cpu); ?>;
          var clus = <?php echo json_encode($name); ?>;
          console.log(cpu);
        </script>
        <script src="./../js/barchart.js"></script>
      </div>

      <div id="bubblechart" class="subchart">
        <script>
          var data = <?php echo json_encode($ary); ?>;
        </script>
        <script src="./../js/bubblechart.js"></script>
      </div>
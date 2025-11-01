<?php
  $fst = $_POST['fst'];
  $last = $_POST['last'];
  $cluster = $_POST['clus'];
  $dsn = "mysql:dbname=XXXX;host=localhost";
  $user = "XXXX";
  $password = "";
  try{
  $dbh = new PDO($dsn, $user, $password);
  } catch (PDOException $e) {
      print("Error:".$e->getMessage());
      die();
  }
  $table = "XXXX";
  $sql = $dbh->prepare("SELECT time,$cluster FROM $table WHERE time BETWEEN '$fst' AND '$last'");
  $sql->execute();
  $ary = array();
  while($row = $sql->fetch(PDO::FETCH_ASSOC)){
    $ary[] = array(
      0  => $row['time'],
      1  => (float)$row[$cluster]
    );
  }

  echo json_encode($ary);
  $dbh = null;
  $sql = null;

<?php
if (!isset($_GET['interval']) || $_GET['interval'] === '') {
  $interval = "1 week";
} else {
  $interval = $_GET["interval"];
}
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
$sql = $dbh->prepare("SELECT time,$cluster FROM $table WHERE time > (now() - interval $interval)");
$sql->execute();
$ary = array();
while ($row = $sql->fetch(PDO::FETCH_ASSOC)) {
  $ary[] = array(
    0  => $row['time'],
    1  => (float)$row[$cluster]
  );
}

$table = "XXXX";
$sql = $dbh->prepare("SELECT time,$cluster FROM $table WHERE time > (now() - interval $interval)");
$sql->execute();
$ary1 = array();
while ($row = $sql->fetch(PDO::FETCH_ASSOC)) {
  $ary1[] = array(
    0  => $row['time'],
    1  => (float)$row[$cluster]
  );
}

$dbh = null;
$sql = null;

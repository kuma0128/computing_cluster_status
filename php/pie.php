  <div class="explain">
    <p><?php echo $cluster . "クラスタのディスク使用率"; ?></p>
    <p><?php echo "1時間に1度更新されます。"; ?></p>
  </div>
  <br />
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
  // $table = $cluster."disk";
  $table = "XXXX";

  $sql = $dbh->prepare("SELECT User,$cluster FROM $table WHERE $cluster > 50 ORDER BY $cluster DESC");
  $sql->execute();
  $ary = array();

  while ($row = $sql->fetch(PDO::FETCH_ASSOC)) {
    $ary[] = array(
      0  => $row['User'],
      1  => $row[$cluster]
    );
  }

  $table = "XXXX";

  $disk = "SELECT * FROM $table WHERE cluster = '$cluster'";
  $sql = $dbh->query($disk);
  $tot = $sql->fetchAll();

  $dbh = null;
  $sql = null;
  ?>
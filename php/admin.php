<?php
session_start();

if (!session_start()) {
  echo 'セッション開始失敗！';
}

#phpinfo();

require_once('config.php');

function h($s)
{
  return htmlspecialchars($s, ENT_QUOTES, 'utf-8');
}

#$_SESSION['USERNAME']="admin";

//ログイン済みかを確認
if (!isset($_SESSION['USERNAME'])) {
  #header('Location: index.php');
  #header('Location: login.php');
  #exit;
}

//ログアウト機能
if (isset($_POST['logout'])) {
  $_SESSION = [];
  //セッションクッキーも削除
  if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
      session_name(),
      '',
      time() - 42000,
      $params["path"],
      $params["domain"],
      $params["secure"],
      $params["httponly"]
    );
  }
  session_destroy(); // セッションを完全に破棄
  header('Location: index.php'); // ログインしていない人向け画面に遷移
  exit;
}

$user = h($_POST['inputName']);
$cluster = h($_POST['inputcluster']);
$duser = h($_POST['deleteName']);
$dcluster = h($_POST['deletecluster']);
$time = 0;
/* データベースへ登録 */
if (!empty($_POST['inputName'])) {
  try {
    $pdo = new PDO(DSN, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $sql = "INSERT INTO XXXX (User, time) VALUES (:user,:time)";
    $stmt = $pdo->prepare($sql);
    $param = array(':user' => $user, ':time' => $time);
    $stmt->execute($param);
  } catch (\Exception $e) {
    echo 'データベースにアクセスできません！';
    die($e->getMessage());
  }
}
if (!empty($_POST['inputcluster'])) {
  try {
    $pdo = new PDO(DSN, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $sql = "ALTER TABLE XXXX.XXXX ADD $cluster FLOAT DEFAULT 0";
    //echo "$sql"
    $stmt = $pdo->prepare($sql);
    $stmt->execute($param);
  } catch (\Exception $e) {
    echo 'データベースにアクセスできません！';
    die($e->getMessage());
  }
}
$pdo = null;
$stmt = null;

/* データベースから削除 */
if (!empty($_POST['deleteName'])) {
  try {
    $pdo = new PDO(DSN, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $sql = "DELETE FROM XXXX WHERE User='$duser'";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
  } catch (\Exception $e) {
    echo 'データベースにアクセスできません！';
    die($e->getMessage());
  }
}
if (!empty($_POST['deletecluster'])) {
  try {
    $pdo = new PDO(DSN, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $sql = "ALTER TABLE XXXX.XXXX DROP $dcluster";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
  } catch (\Exception $e) {
    echo 'データベースにアクセスできません！';
    die($e->getMessage());
  }
}

?>
<!doctype html>
<html>

<head lang="ja">
  <title>ユーザーの追加</title>
  <link href="./../css/index.css" rel="stylesheet" type="text/css">
  <div id="header"><IMG src="/img/Tohoku_logo.gif"></div>
</head>

<body>

  <script>
    function submitChk() {
      if (window.confirm('この内容で送信しますがよろしいでしょうか？')) {
        return true;
      } else {
        return false;
      }
    }
  </script>

  <div id="main">
    <div id="wrapper" class="flex">
      <div>
        <p style="margin-top: 10px;margin-right:10px;">
          <font size="3">データベースにユーザーを追加・削除できます。
        </p>
        <div id="input_form">
          <form action="admin.php" method="post" onsubmit="return submitChk()">
            <input type="text" name="inputName" placeholder="username">
            <input type="submit" value="登録" id="btn">
          </form>

          <form action="admin.php" method="post" onsubmit="return submitChk()">
            <input type="text" name="deleteName" placeholder="username">
            <input type="submit" value="削除" id="btn">
          </form>
        </div>
      </div>

      <div>
        <p style="margin-top: 10px;margin-right:10px;">
          <font size="3">データベースにdisknodeを追加・削除できます。
        </p>
        <div id="input_form">
          <form action="admin.php" method="post" onsubmit="return submitChk()">
            <input type="text" name="inputcluster" placeholder="cluster">
            <input type="submit" value="登録" id="btn">
          </form>

          <form action="admin.php" method="post" onsubmit="return submitChk()">
            <input type="text" name="deletecluster" placeholder="cluster">
            <input type="submit" value="削除" id="btn">
          </form>
        </div>
      </div>
    </div>

    <div class="list">
      <div>
        <h>User list</h>
        <p>
          <?php
          $pdo = new PDO(DSN, DB_USER, DB_PASS);
          $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
          $sql = "SELECT User FROM XXXX";
          foreach ($pdo->query($sql) as $row) {
            print($row[0]);
            print("<br />");
          }
          ?>
        </p>
      </div>
      <div>
        <h>disk list</h>
        <p>
          <?php
          $pdo = new PDO(DSN, DB_USER, DB_PASS);
          $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
          $sql = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='XXXX' AND TABLE_NAME='XXXX'";
          foreach ($pdo->query($sql) as $row2) {
            if ($row2[0] == "User") {
              continue;
            }
            print($row2[0]);
            print("<br />");
          }
          ?>
        </p>
      </div>
    </div>
    <div align="right">
      <a href="index.php" class="btn btn-border-shadow btn-border-shadow--color">Logout</a>
    </div>
  </div>
</body>

</html>
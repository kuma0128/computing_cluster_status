<?php
session_start();

require_once('config.php');
function h($s)
{
  return htmlspecialchars($s, ENT_QUOTES, 'utf-8');
}

$message = '';
$username = '';
$password = '';
$username = h($_POST['user']);
$password = h($_POST['password']);
//DB内でPOSTされたusernameを検索
try {
  $pdo = new PDO(DSN, DB_USER, DB_PASS);
  $stmt = $pdo->prepare('SELECT * FROM login WHERE username = ?');
  $stmt->execute([$username]);
  $row = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (\Exception $e) {
  echo $e->getMessage() . PHP_EOL;
}

//usernameがDB内に存在しているか確認
if (strlen($username) > 255) {
  $message = "255文字以内で入力してください";
  return false;
} else if (!isset($row['username'])) {
  $message = "ユーザー又はパスワードが間違っています。";
  return false;
}
//パスワード確認後sessionにusernameを渡す
if (strlen($password) > 255 || strlen($password) < 5) {
  $message = "６文字以上２５５文字以内で入力してください";
} else if (password_verify($password, $row['password'])) {
  session_regenerate_id(true); //session_idを新しく生成し、置き換える
  $_SESSION['USERNAME'] = $row['username'];
  session_write_close();
  header("Location:admin.php");
  exit();
} else {
  $message = "ユーザー又はパスワードが間違っています。";
  return false;
}

$message = h($message);

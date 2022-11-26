<?php
require_once('config.php');

function h($s)
{
  return htmlspecialchars($s, ENT_QUOTES, 'utf-8');
}
//データベースへ接続、テーブルがない場合は作成
try {
  $pdo = new PDO(DSN, DB_USER, DB_PASS);
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  //   $pdo->exec("create table if not exists login(
  //       id int not null auto_increment primary key,
  //       username varchar(255) unique,
  //       password varchar(255) ,
  //       created timestamp not null default current_timestamp
  //     )");
} catch (Exception $e) {
  echo $e->getMessage() . PHP_EOL;
}

//パスワードの正規表現
if (preg_match('/\A(?=.*?[a-z])(?=.*?\d)[a-z\d]{8,100}+\z/i', $_POST['password'])) {
  $password = password_hash(h($_POST['password']), PASSWORD_DEFAULT);
} else {
  echo 'パスワードは半角英数字をそれぞれ1文字以上含んだ8文字以上で設定してください。';
  return false;
}
$user = h($_POST['user']);
//登録処理
try {
  $stmt = $pdo->prepare("INSERT INTO login(username, password) VALUES(?, ?)");
  $stmt->execute([$user, $password]);
  echo '登録完了';
} catch (\Exception $e) {
  echo '登録済みのユーザーです。';
}

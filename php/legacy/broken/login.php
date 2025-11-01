<?php
session_start();
if (!session_start()) {
  echo 'セッション開始失敗！';
}
#session_regenerate_id();
// ログイン済みかを確認
if (isset($_SESSION['USERNAME'])) {
  header('Location: admin.php');
  exit;
}
?>
<!DOCTYPE html>
<html lang="ja">

<head>
  <meta charset="UTF-8">
  <link href="./../css/login.css?387923" rel="stylesheet">
  <title>Sign In</title>
</head>

<body>
  <div id="dots">
    <div class="wrapper">
      <div class="container">
        <h1>Welcome</h1>

        <form class="form" action="Signin.php" method="post">
          <input type="text" name="user" placeholder="Username" autocomplete="off" required>
          <input type="password" name="password" placeholder="Password" autocomplete="off" required>
          <button type="submit" id="login-button">Sign In!</button>
        </form>

  <!-- <form class="form" action="Signup.php" method="post">
          <input type="text" name="user" placeholder="Username">
          <input type="password" name="password" placeholder="Password">
          <button type="submit" id="login-button">Sign Up!</button>
          <p>※パスワードは半角英数字をそれぞれ１文字以上含んだ、８文字以上で設定してください。</p>
        </form> -->

      </div>

      <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.dots.min.js"></script>
      <script>
        VANTA.DOTS({
          el: "#dots",
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 700.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          color: 0x203aff,
          color2: 0x20caff,
          backgroundColor: 0x0,
          spacing: 10.0
        })
      </script>
    </div>
</body>

</html>
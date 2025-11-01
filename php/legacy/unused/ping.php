<?php
  header("Content-type: application/json; charset=UTF-8");
  $stat = filter_input(INPUT_POST,"stat");
  $ary_ping = [];
  $alive = exec("/home/web/html/sh/aliveping"); 
  $down = exec("/home/web/html/sh/downping"); 
  $ary_ping = [ 
               "alive" => $alive,
               "down"  => $down
              ];
  echo json_encode($ary_ping);
  exit;

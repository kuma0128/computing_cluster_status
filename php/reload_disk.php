<?php
  header("Content-type: application/json; charset=UTF-8");
  $clus = $_POST['clus'];
  $ary_disk=[];
  foreach ($clus as $work) {
    $result = exec("/home/web/html/sh/chkdisk $work[0]");
    $disk = explode(",",$result);
    array_push($ary_disk , [
                "cluster" => $work[0],
                "1" => (int)$disk[0],
                "2" => (int)$disk[1]
               // "2" => 1241412
                ]);
  }
  echo json_encode($ary_disk);
  exit;

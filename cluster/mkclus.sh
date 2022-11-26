#!/bin/sh

master="asuka"
cd /home/web/html/cluster
nodearray=($(/opt/pbs/bin/qstat -Q | grep work | awk '{print $1}' | cut -c 6-))
for i in "${nodearray[@]}"; do
  if [ $i == $master ]; then
    continue
  fi
  mkdir -p $i
  sed "s/$master/$i/g" ./$master/$master.php >./$i/$i.php
  sed "s/$master/$i/g" ./$master/$master"_week.php" >./$i/$i"_week.php"
done

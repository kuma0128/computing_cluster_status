#!/bin/sh
#各マスターノードのHDD使用率を取得。
#1時間に1度実行される。
#HDDの使用率が90,95,98,99%を超えた場合、各ユーザーの使用率とともにメールで通知する。

user="XXXX"
pass=$(openssl XXXX)
db="XXXX"
table="XXXX"

Insert="INSERT INTO $db.$table (cluster,used,avail) VALUES "
nodearray=($(/opt/pbs/bin/qstat -Q | grep work | awk '{print $1}' | cut -c 6-))
nodearray=("${nodearray[@]}" "nagara")
nodearray=("${nodearray[@]}" "asuka_data")
nodearray=("${nodearray[@]}" "naruko_data")
for i in "${nodearray[@]}"; do
  j=$i"00"
  if [ $i == "nagara" -o $i == "asuka_data" -o $i == "naruko_data" ]; then
    j=$i
  fi
  if [ $i == "asuka_data" ]; then
    line=$(sudo -u guest /usr/bin/rsh asuka00 "df -BG 2>/dev/null|grep -w \/data")
  elif [ $i == "naruko_data" ]; then
    line=$(sudo -u guest /usr/bin/rsh naruko00 "df -BG 2>/dev/null|grep -w \/data")
  else
    line=$(sudo -u guest /usr/bin/rsh $j "df -BG 2>/dev/null|grep -w \/home")
  fi
  if [ -z "$line" ]; then
    continue
  fi
  used=$(echo $line | awk '{print $3}' | rev | cut -c 2- | rev)
  avail=$(echo $line | awk '{print $4}' | rev | cut -c 2- | rev)
  if [ -z $used ]; then
    used="1"
    avail="1"
  fi
  Insert+="(\"$i\",$used,$avail),"
done
Insert=$(echo $Insert | rev | cut -c 2- | rev)
Insert+=" ON DUPLICATE KEY UPDATE cluster = VALUES(cluster), used = VALUES(used),
         avail = VALUES(avail);"
result=$(mysql -u $user --password=$pass $db -N -e "$Insert")
for i in "${nodearray[@]}"; do
  query="SELECT * FROM $table WHERE cluster = '$i'"
  result=$(mysql -u $user --password=$pass $db -N -e "$query")
  declare -a columns=()
  declare -a columns=($result)
  tot=$(expr ${columns[1]} \+ ${columns[2]})
  rate=$(echo "scale=5; ${columns[2]} / $tot * 100" | bc)
  mailflag=0
  for j in 90 95 98 99; do
    thres=$(expr 100 - $j)
    flag=0
    if [ $(echo "$rate <= $thres" | bc) == 1 ]; then
      flag=1
    fi
    query="SELECT mail$j+0 FROM $table WHERE cluster = '$i'"
    result=$(mysql -u $user --password=$pass $db -N -e "$query")
    if [ "$flag" -ne "$result" ]; then
      #HDD使用率がしきい値が下回った場合
      if [ "$flag" == "0" ]; then
        query="UPDATE $db.$table SET mail$j=$flag WHERE cluster = '$i'"
        result=$(mysql -u $user --password=$pass $db -N -e "$query")
      fi
      #HDD使用率がしきい値を上回った場合
      if [ "$flag" == "1" ]; then
        query="UPDATE $db.$table SET mail$j=$flag WHERE cluster = '$i'"
        result=$(mysql -u $user --password=$pass $db -N -e "$query")
        mailflag=1
      fi
    fi
    echo "$i"
  done
  if [ "$mailflag" == "1" ]; then
    /home/web/html/sh/maildisk/mail.sh $i
  fi
done

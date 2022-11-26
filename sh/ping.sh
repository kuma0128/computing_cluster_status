#!/bin/sh
#192.168.100.*の計算機についてpingを確認。
#1時間に1度実行される。
#pingが2回連続で通らなかった場合、計算機がダウンした旨をメールで通知する。

tail -n +11 /home/web/html/tmp/cms.net.zone | grep "192.168.100" >/home/web/html/tmp/ping.dat
tail -n +11 /home/web/html/tmp/cms.net.zone | grep "192.168.100" | awk '{print $1" "$4}' >/home/web/html/tmp/id.dat
sed -i '1s/^/\n/' /home/web/html/tmp/id.dat
filedown=$(mktemp)
filealive=$(mktemp)
trap "rm $filedown $filealive" 0 1 2 3 15
user="XXXX"
pass=$(openssl XXXX)
db="XXXX"
table="XXXX"
date=$(date "+%Y-%m-%d %H:%M")

/usr/sbin/fping -admq -t 50 -i 10 -r 1 -f /home/web/html/tmp/ping.dat >$filealive
reset="TRUNCATE TABLE $db.$table"
result=$(mysql -u $user --password=$pass $db -N -e "$reset")
Insert="INSERT INTO $db.$table (cluster) VALUES"
for i in $(cat $filealive); do
  Insert+="(\""$i"\"),"
done
Insert=$(echo $Insert | rev | cut -c 2- | rev)
Insert+=" ON DUPLICATE KEY UPDATE cluster = VALUES(cluster);"
result=$(mysql -u $user --password=$pass $db -N -e "$Insert")

table="XXXX"
/usr/sbin/fping -qum -t 50 -i 10 -r 1 -f /home/web/html/tmp/ping.dat >$filedown
sql="SELECT cluster FROM $db.$table;"
result=$(mysql -u $user --password=$pass $db -N -e "$sql")

declare -a ary0=()
declare -a ary0=($result)
sql="SELECT mail+0 FROM $db.$table;"
result=$(mysql -u $user --password=$pass $db -N -e "$sql")

declare -a ary1=()
declare -a ary1=($result)
n=$((${#ary0[*]} - 1))

mailflag=false
for i in $(seq 0 $n); do
  cluster=$(grep ${ary0[$i]} $filedown)
  if [ -n "$cluster" ]; then
    if [ ${ary1[$i]} == 0 ]; then
      sql="UPDATE $db.$table SET mail=true WHERE cluster='${ary0[$i]}' "
      result=$(mysql -u $user --password=$pass $db -N -e "$sql")
      list+=$(echo "${ary0[$i]} \n")
      mailflag=true
    else
      #echo ${ary1[$i]}
      :
    fi
  else
    sql="DELETE FROM $db.$table WHERE cluster='${ary0[$i]}'"
    result=$(mysql -u $user --password=$pass $db -N -e "$sql")
  fi
done
if "${mailflag}"; then
  echo -e -n "$list" | column -x >/home/web/html/sh/mailping/list
  /home/web/html/sh/mailping/mail.sh
fi

Insert="INSERT INTO $db.$table (cluster,time) VALUES"
Inflag=false
for i in $(cat $filedown); do
  if ! $(echo ${ary0[@]} | grep -q $i); then
    Insert+="(\"$i\",\"$date\"),"
    Inflag=true
  fi
done
Insert=$(echo $Insert | rev | cut -c 2- | rev)
Insert+=";"
if "${Inflag}"; then
  result=$(mysql -u $user --password=$pass $db -N -e "$Insert")
fi

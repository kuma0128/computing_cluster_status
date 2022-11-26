#!/bin/sh
# 各ユーザーの使用率を取得
# 毎日3時に1度実行される。使用率の統計量は月初めにリセットされる。

# downノードを取得
db="XXXX"
table="XXXX"
user="XXXX"
DOWN=$(mysql -u $user $db -N -e "${sql}")

stat=`mktemp`
trap "rm $stat" 0 1 2 3 15 
#/usr/local/bin/statuserのユーザー
#declare -a users=(`ls -l /home/|grep users|awk '$1 ~ /d/ {print $3}'`)
db="XXXX"
table="XXXX"
user="root"
pass=`openssl XXXX`
sql="select User from $table"
users=$(mysql -u $user --password=$pass $db -N -e "${sql}")
users=(`echo $users`)

for i in `cat /etc/hosts.equiv`
do
  for downnode in ${DOWN}
  do
    [ "$i" == "$downnode" ] && continue 2
  done
  sudo -u guest /usr/bin/rsh $i "/sbin/sa -m" 1>>$stat 2>/dev/null
done
wait


Insert="INSERT INTO $db.$table (User,time) VALUES"
n=$(( ${#users[*]} - 1 ))
for i in `seq 0 $n`
do
  tot=`grep -w ${users[$i]} $stat|awk '{total+=$4} END {printf "%4.2f\n", total}'`
  Insert+="(\"${users[$i]}\",$tot),"
done

Insert=`echo $Insert|rev|cut -c 2- |rev`
Insert+=" ON DUPLICATE KEY UPDATE user = VALUES(user), time = VALUES(time);"
result=$(mysql -u $user --password=$pass $db -N -e "$Insert")

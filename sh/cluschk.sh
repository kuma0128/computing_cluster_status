#!/bin/sh
# PBS Proに追加されたクラスタをデータベースに追加
# 1日に1度実行される。
# htmlページやグラフについても更新される。

pass=`openssl XXXX`
db="XXXX"
table1="XXXX"
table2="XXXX"
table3="XXXX"
table4="XXXX"

# PBSに追加されたクラスタを追加
sql="SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'XXXX' AND TABLE_NAME = 'XXXX'"
result=$(mysql -u root --password=$pass $db -N -e "$sql")
declare -a ary=($result)
clus=`echo ${ary[*]} |awk '{print $(NF-1)}'`
nodearray=(`/opt/pbs/bin/qstat -Q |grep work|awk '{print $1}'|cut -c 6-`)
# file server
nodearray=("${nodearray[@]}" "nagara")
nodearray=("${nodearray[@]}" "asuka_data")
nodearray=("${nodearray[@]}" "naruko_data")
for i in "${nodearray[@]}"
do 
  if ! `echo ${ary[*]}|grep -q "$i"` ; then
  #*_data and nagara is file servers. 
    if [ $i == "asuka_data" ]; then
      alter="ALTER TABLE $db.$table3 ADD $i FLOAT DEFAULT 0"
      result=$(mysql -u root --password=$pass $db -N -e "$alter")
    if [ $i == "naruko_data" ]; then
      alter="ALTER TABLE $db.$table3 ADD $i FLOAT DEFAULT 0"
      result=$(mysql -u root --password=$pass $db -N -e "$alter")
    elif [ $i != "nagara" ]; then
      alter="ALTER TABLE $db.$table1 ADD $i FLOAT DEFAULT 0 AFTER $clus"
      result=$(mysql -u root --password=$pass $db -N -e "$alter")
      alter="ALTER TABLE $db.$table2 ADD $i FLOAT DEFAULT 0 AFTER $clus"
      result=$(mysql -u root --password=$pass $db -N -e "$alter")
    fi
    if [ $i == "nagara" ]; then
      continue
    fi
    alter="ALTER TABLE $db.$table3 ADD $i FLOAT DEFAULT 0"
    result=$(mysql -u root --password=$pass $db -N -e "$alter")
    /home/web/html/cluster/mkclus.sh
  fi
done

# PBSから外されたクラスタを削除
file=`mktemp`
trap "rm $file" 0 1 2 3 15
/opt/pbs/bin/qstat -Q|grep work|awk '{print $1}'|cut -c 6- >$file
sql="SELECT cluster FROM XXXX"
result=$(mysql -u root --password=$pass $db -N -e "$sql")
declare -a ary=($result)
n=`expr ${#ary[@]} - 1`
for i in `seq 0 $n`
do 
  if ! `cat $file|grep -q "${ary[$i]}"` ; then
    if [ ${ary[$i]} == "nagara" ];then
      continue
    fi
    echo ${ary[$i]}
    alter="ALTER TABLE $db.$table1 DROP  ${ary[$i]}"
    result=$(mysql -u root --password=$pass $db -N -e "$alter")
    alter="ALTER TABLE $db.$table2 DROP  ${ary[$i]}"
    result=$(mysql -u root --password=$pass $db -N -e "$alter")
    alter="ALTER TABLE $db.$table3 DROP  ${ary[$i]}"
    result=$(mysql -u root --password=$pass $db -N -e "$alter")
    alter="DELETE FROM $db.$table4 WHERE cluster = '${ary[$i]}'"
    result=$(mysql -u root --password=$pass $db -N -e "$alter")
  fi
done



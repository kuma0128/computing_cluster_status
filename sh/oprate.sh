#!/bin/bash
#各計算機のCPU使用率とPBSの使用率を取得。
#1時間に1度実行される。

time=$(date +%y-%m-%d\ %R:%S)
cluster=$(/opt/pbs/bin/qstat -Q | grep work | awk '{print $1}' | cut -c 6- | sed -z 's/\n/,/g')
#一時ファイルの設定
file=$(mktemp)
trap "rm $file" 0 1 2 3 15
sudo /opt/pbs/bin/pbsnodes -a >$file
# データベース引数
user="XXXX"
pass=$(openssl XXXX)
table=XXXX
tablep=XXXX
tablec=XXXX
Insert="INSERT INTO XXXX."$table" (time,"$cluster"total) VALUES('"$time"',"
Insertp="INSERT INTO XXXX."$tablep" (time,"$cluster"total) VALUES('"$time"',"
Insertc="INSERT INTO XXXX."$tablec" (time,"$cluster"total) VALUES('"$time"',"

# 各クラスターについてループ
tot=0
totp=0
clus=0
availcpu=0
totcpu=0
master=($(/opt/pbs/bin/qstat -Q | grep work | awk '{print $1}' | cut -c 6-))
for i in "${master[@]}"; do
  clus=$(expr $clus \+ 1)
  node=$(cat $file | grep "partition = $i" -A 2 -B 21 | grep "Mom =" | awk '{print $3}')
  state=$(cat $file | grep "partition = $i" -A 2 -B 21 | grep "state =" | awk '{print $3}')
  avail=$(cat $file | grep "partition = $i" -A 2 -B 21 | grep resources_available.ncpus | awk '{print $3}')
  assign=$(cat $file | grep "partition = $i" -A 2 -B 21 | grep resources_assigned.ncpus | awk '{print $3}')
  declare -a ary0=()
  declare -a ary0=($node)
  declare -a ary1=()
  declare -a ary1=($state)
  declare -a ary2=()
  declare -a ary2=($avail)
  declare -a ary3=()
  declare -a ary3=($assign)
  nodes=${#ary0[*]}
  nodes=$(expr $nodes \- 1)
  # 各スレーブノードについてループ
  avrg=0
  pbs=0
  nnode=1
  availsum=0
  pbst=0
  for j in $(seq 0 $nodes); do
  
    # TCPポート枯渇対策   1m
    sleep 1m

    II=${i}00
    chk2=$(/usr/sbin/fping -admq -t 50 -i 10 -r 1 $II)
    if [ -z "$chk2" ]; then
      # 親ノードがダウンしているとき
      echo "${j} down"
      break
    fi
    chk=$(/usr/sbin/fping -admq -t 50 -i 10 -r 1 ${ary0[$j]})
    if [ -z "$chk" ]; then
      # ダウンしているとき
      echo "${j} down"
      continue
    fi
    # loadavrgの計算。直近15分以内の平均負荷。
    nnode=$(expr $nnode \+ 1)
    load=$(sudo -u guest /usr/bin/rsh ${ary0[$j]} uptime 2>/dev/null | awk '{print $NF}')
    if [ -z "$load" ]; then
      echo "${j} error"
      continue
    fi
    avrg=$(echo "sacle=3; $avrg + $load" | bc)
    pbs=$(expr $pbs \+ ${ary3[$j]})
    availsum=$(expr $availsum \+ ${ary2[$j]})
    # ypbindが切れている時にbindする
    yp=$(sudo -u guest /usr/bin/rsh ${ary0[$j]} /usr/bin/ypwhich 2>/dev/null | grep ns1)
    if [ -z "$yp" ]; then
      /usr/bin/sshpass -p $(openssl rsautl -decrypt -inkey ~/.ssh/id_rsa -in ~/.ssh/password.rsa) ssh root@${ary0[$j]} "/usr/sbin/ypbind 2>/dev/null"
    fi
    wait
  done
  #統計処理
  pbst=$pbs
  totcpu=$(expr $totcpu \+ $pbs)
  if [ $nnode -ne 0 -a ${ary2[$j]} -ne 0 -a $availsum -ne 0 ]; then
    avrg=$(echo "scale=3; $avrg/$availsum*100" | bc)
    pbs=$(echo "scale=3; $pbs/$availsum*100" | bc)
  fi
  if [ -z "$avrg" ]; then
    avrg=0
  fi
  avrg=$(echo "scale=3;if($avrg > 100)100.000 else $avrg" | bc)
  pbs=$(echo "scale=3;if($pbs > 100)100.000 else $pbs" | bc)
  pbst=$(echo "scale=3;if($pbst > $availsum)$availsum else $pbst" | bc)

  tot=$(echo "scale=3; $tot + $avrg" | bc)
  totp=$(echo "scale=3; $totp + $pbs" | bc)
  if [ "$pbst" -eq 0 ]; then
    pbs=0
  fi
  Insert+="$avrg,"
  Insertp+="$pbs,"
  Insertc+="'"$pbst/$availsum"',"
  availcpu=$(expr $availcpu \+ $availsum)
done
# 全計算機の平均値
if [ "$clus" -ne 0 ]; then
  tot=$(echo "scale=3; $tot/$clus" | bc)
  totp=$(echo "scale=3; $totp/$clus" | bc)
else
  tot=0
  totp=0
fi

Insert+="$tot);"
Insertp+="$totp);"
Insertc+="'"$totcpu/$availcpu"');"
result=$(mysql -u $user --password=$pass $db -N -e "$Insert")
result=$(mysql -u $user --password=$pass $db -N -e "$Insertp")
result=$(mysql -u $user --password=$pass $db -N -e "$Insertc")

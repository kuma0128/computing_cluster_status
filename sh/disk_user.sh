#!/bin/sh
#各ユーザーのHDD使用率を取得。
#1時間に1度実行される。
#ducコマンドを用いている。

file=$(mktemp)
trap 'rm $file' 0 1 2 3 15
pass=$(openssl XXXX)
db="XXXX"
table="XXXX"

nodearray=($(/opt/pbs/bin/qstat -Q | grep work | awk '{print $1}' | cut -c 6-))

#file server
nodearray+=("nagara")
nodearray+=("asuka_data")
nodearray+=("naruko_data")

for i in "${nodearray[@]}"; do
  j=$i"00"
  if [ $i == "yoyogi" ]; then
    j=$i
  elif [ $i == "nagara" ]; then
    j=$i
  elif [ $i == "asuka_data" ]; then
    j=$i
  elif [ $i == "naruko_data" ]; then
    j=$i
  else
    chk=$(sudo -u guest /usr/bin/rsh $j "/usr/local/bin/duc --version 2>/dev/null|grep kyotocabinet")
    if [ -z "$chk" ]; then
      continue
    fi
    if [ -z "$chk" ]; then
      /usr/bin/sshpass -p $pass ssh root@$j &>/dev/null <<EOF
      if [ -f /root/duc-1.4.4.tar.gz ]; then
        exit
      fi
      yum install -y epel-release
      yum install -y kyotocabinet-devel
      yum install -y cairo-devel
      yum install -y pango-devel
      wget https://github.com/zevv/duc/releases/download/1.4.4/duc-1.4.4.tar.gz
      tar -xf duc-1.4.4.tar.gz
      cd /root/duc-1.4.4
      ./configure --with-db-backend=kyotocabinet
      make
      make install
EOF
    fi
  fi
  chk=$(/usr/bin/sshpass -p $pass ssh root@$j "ps x|grep duc|grep -v grep|grep -w /home" 2>/dev/null)
  if [ -n "$chk" ]; then
    continue
  fi
  if [ $j == "asuka_data" ]; then
    /usr/bin/sshpass -p $pass ssh root@$asuka00 2>/dev/null <<EOF
     ionice -c 3 /usr/local/bin/duc index -q /data
     cp -rf /root/.duc.db* /data/guest/
EOF
  elif [ $j == "naruko_data" ]; then
    /usr/bin/sshpass -p $pass ssh root@$naruko00 2>/dev/null <<EOF
     ionice -c 3 /usr/local/bin/duc index -q /data
     cp -rf /root/.duc.db* /data/guest/
EOF
  else
    /usr/bin/sshpass -p $pass ssh root@$j 2>/dev/null <<EOF
  #ionice -c 3 /usr/local/bin/duc index -q --max-depth=5 /home
  ionice -c 3 /usr/local/bin/duc index -q /home
  cp -rf /root/.duc.db* /home/guest/
EOF
  fi
  if [ $j == "asuka_data" ]; then
    sudo -u guest /usr/bin/rsh asuka00 "ionice -c 3 /usr/local/bin/duc ls -b /data" >$file
    sudo -u guest /usr/bin/rsh asuka00 "ionice -c 3 /usr/local/bin/duc graph /data; rcp /home/guest/duc.png fep:/home/guest/"
  elif [ $j == "naruko_data" ]; then
    sudo -u guest /usr/bin/rsh naruko00 "ionice -c 3 /usr/local/bin/duc ls -b /data" >$file
    sudo -u guest /usr/bin/rsh naruko00 "ionice -c 3 /usr/local/bin/duc graph /data; rcp /home/guest/duc.png fep:/home/guest/"
  else
    sudo -u guest /usr/bin/rsh $j "ionice -c 3 /usr/local/bin/duc ls -b /home" >$file
    sudo -u guest /usr/bin/rsh $j "ionice -c 3 /usr/local/bin/duc graph /home; rcp /home/guest/duc.png fep:/home/guest/"
  fi
  cp /home/guest/duc.png /home/web/html/cluster/$i
  Insert="INSERT INTO $db.$table ($i,User) VALUES"
  for j in $(cat $file); do
    if [[ "$j" =~ ^[0-9]+$ ]]; then
      k=$(expr $j \/ 1024 \/ 1024 \/ 1024)
      Insert+="($k,"
    else
      Insert+="\"$j\"),"
    fi
  done
  Insert=$(echo $Insert | rev | cut -c 2- | rev)
  Insert+=" ON DUPLICATE KEY UPDATE User = VALUES(User), $i = VALUES($i);"
  result=$(mysql -u root --password=$pass $db -N -e "$Insert")
done

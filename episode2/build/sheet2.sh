#!/bin/bash
# usage: sheet2.sh out.png t1 t2 ... (до 8 кадров)
out=$1; shift
ins=""; fc=""; i=0; names=""
for t in "$@"; do ins="$ins -i still_$t.png"; fc="$fc[$i]scale=300:533[v$i];"; names="$names[v$i]"; i=$((i+1)); done
n=$i; cols=4; while [ $((n % cols)) -ne 0 ]; do n=$((n+1)); done
ffmpeg -y -v error $ins -filter_complex "${fc}${names}xstack=inputs=$i:layout=$(python3 -c "
c=4;i=$i
print('|'.join(f'{(k%c)*300}_{(k//c)*533}' for k in range(i)))")[o]" -map "[o]" -frames:v 1 -update 1 $out

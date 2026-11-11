#!/system/bin/sh
# termux-docker(aarch64, 안드로이드 bionic) 안에서: 앱이 하는 것과 같은 방식으로 Node를 띄움
export PATH=/system/bin:$PATH
cd /t
mkdir -p links data tmp
while IFS='=' read -r old new; do [ -n "$old" ] && ln -sf /t/lib/"$new" /t/links/"$old"; done < nodelibs.txt
# 실제 휴대폰에는 Termux 폴더가 없습니다 → 그쪽 라이브러리에 기대지 않는지 확인하려고 숨깁니다
if mv /data/data/com.termux/files/usr/lib /data/data/com.termux/files/usr/lib.off 2>/dev/null; then echo "== Termux 라이브러리 숨김 (휴대폰과 같은 조건)"; else echo "== Termux 라이브러리 숨기지 못함"; fi
export LD_LIBRARY_PATH=/t/links:/t/lib
echo "== node --version"; ./lib/libnode.so --version; echo "exit=$?"
echo "== sidecar"; ./lib/libxlsxsidecar.so --version 2>&1 | head -5; echo "exit=$?"
export IEUM_TOKEN=tok123 IEUM_DATA=/t/data IEUM_RESOURCES=/t/app/resources IEUM_SIDECAR=/t/lib/libxlsxsidecar.so HOME=/t/data TMPDIR=/t/tmp LANG=ko_KR.UTF-8
cd /t/app
RC=0
wait_ready() { i=0; while [ $i -lt 40 ] && ! grep -q IEUM_READY "$1"; do sleep 1; i=$((i+1)); done; grep -q IEUM_READY "$1"; }
alive() { kill -0 "$1" 2>/dev/null; }

echo "== 1) 앱과 같은 조건(부모 감시)으로 시작, 문서 열기"
mkfifo /t/tmp/in
sleep 100000 > /t/tmp/in &
HOLD=$!
IEUM_PORT=38211 IEUM_PARENT_WATCH=1 /t/lib/libnode.so --max-old-space-size=1024 host.js < /t/tmp/in > /t/host.log 2>&1 &
HP=$!
if ! wait_ready /t/host.log; then echo "HOST FAIL: 준비 안 됨"; cat /t/host.log; exit 1; fi
/t/lib/libnode.so /t/client.js /t/app 38211 tok123 /t/samples || RC=1
echo "== 2) 부모(앱)가 사라지면 엔진도 끝나는지"
kill $HOLD; sleep 3
if alive $HP; then echo "PARENT-WATCH FAIL: 엔진이 남아 있음"; RC=1; kill -9 $HP; else echo "PARENT-WATCH PASS"; fi

echo "== 3) 편집기를 연 뒤 끝내기 신호(SIGTERM)로 꺼지는지"
IEUM_PORT=38212 /t/lib/libnode.so --max-old-space-size=1024 host.js < /dev/null > /t/host2.log 2>&1 &
HP=$!
if ! wait_ready /t/host2.log; then echo "HOST2 FAIL: 준비 안 됨"; cat /t/host2.log; exit 1; fi
/t/lib/libnode.so /t/client.js /t/app 38212 tok123 /t/samples > /t/client2.log 2>&1 || { RC=1; cat /t/client2.log; }
kill -TERM $HP; sleep 3
if alive $HP; then echo "SIGTERM FAIL: 엔진이 꺼지지 않음"; RC=1; kill -9 $HP; else echo "SIGTERM PASS"; fi

echo "== host log"; cut -c1-300 /t/host.log | tail -40
mv /data/data/com.termux/files/usr/lib.off /data/data/com.termux/files/usr/lib 2>/dev/null
exit $RC

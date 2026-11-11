#!/system/bin/sh
# termux-docker(aarch64, 안드로이드 bionic) 안에서: 앱이 하는 것과 같은 방식으로 Node를 띄움
cd /t
mkdir -p links data tmp
while IFS='=' read -r old new; do [ -n "$old" ] && ln -sf /t/lib/"$new" /t/links/"$old"; done < nodelibs.txt
export LD_LIBRARY_PATH=/t/links:/t/lib
echo "== node --version"; ./lib/libnode.so --version; echo "exit=$?"
echo "== sidecar"; ./lib/libxlsxsidecar.so --version 2>&1 | head -5; echo "exit=$?"
export IEUM_PORT=38211 IEUM_TOKEN=tok123 IEUM_DATA=/t/data IEUM_RESOURCES=/t/app/resources IEUM_SIDECAR=/t/lib/libxlsxsidecar.so HOME=/t/data TMPDIR=/t/tmp LANG=ko_KR.UTF-8
cd /t/app
/t/lib/libnode.so --max-old-space-size=1024 host.js > /t/host.log 2>&1 &
HP=$!
i=0; while [ $i -lt 40 ] && ! grep -q IEUM_READY /t/host.log; do sleep 1; i=$((i+1)); done
if ! grep -q IEUM_READY /t/host.log; then echo "HOST FAIL: 준비 안 됨"; cat /t/host.log; exit 1; fi
/t/lib/libnode.so /t/client.js /t/app 38211 tok123 /t/samples; RC=$?
sleep 2; kill $HP 2>/dev/null
echo "== host log"; cat /t/host.log | cut -c1-400
exit $RC

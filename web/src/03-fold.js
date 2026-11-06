// 폴드8 전용판: 앱 색을 보라색으로 — 스타일시트의 황동·호박·파랑 계열 색을 한 번만 보라 계열로 바꿈(사진·지도·글자색 아이보리는 그대로)
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
function foldHue(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;if(!d)return null;
  const s=d/(1-Math.abs(2*l-1));let h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h=(h*60+360)%360;
  const warm=h>=18&&h<=58&&s>=.22&&l<=.86,blue=h>=195&&h<=245&&s>=.35;if(!warm&&!blue)return null;
  const H=warm?272:262,S=Math.min(1,s*(warm?.9:1)),c=(1-Math.abs(2*l-1))*S,x=c*(1-Math.abs((H/60)%2-1)),m=l-c/2;
  let R,G,B;[R,G,B]=H<300?[x,0,c]:[c,0,x];return [Math.round((R+m)*255),Math.round((G+m)*255),Math.round((B+m)*255)]}
function foldColor(txt){return txt.replace(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(\s*,\s*[\d.]+)?\s*\)/g,(all,r,g,b,a)=>{const c=foldHue(+r,+g,+b);return c?`rgba(${c[0]}, ${c[1]}, ${c[2]}${a||', 1'})`:all})}
const foldDone=new WeakSet();
function foldSheets(){if(!IS_FOLD)return;for(const sh of document.styleSheets){if(foldDone.has(sh))continue;let rules;try{rules=sh.cssRules}catch(e){continue}if(!rules)continue;foldDone.add(sh);foldRules(rules)}}
function foldRules(rules){for(const r of rules){if(r.cssRules&&!r.style){foldRules(r.cssRules);continue}const st=r.style;if(!st)continue;
  for(let i=0;i<st.length;i++){const k=st[i],v=st.getPropertyValue(k);if(!/rgb|#/.test(v))continue;const nv=foldColor(v.replace(/#([0-9a-f]{3,8})\b/gi,hex=>{let h=hex.slice(1);if(h.length<=4)h=h.split('').map(c=>c+c).join('');const n=parseInt(h.slice(0,6),16),a=h.length===8?(parseInt(h.slice(6),16)/255).toFixed(3):null;return `rgba(${n>>16&255}, ${n>>8&255}, ${n&255}${a?', '+a:''})`}));
    if(nv!==v)try{st.setProperty(k,nv,st.getPropertyPriority(k))}catch(e){}}}}
if(IS_FOLD){foldSheets();addEventListener('load',foldSheets);setTimeout(foldSheets,1500)}

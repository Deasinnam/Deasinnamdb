// 콕핏 스킨 조종 패널
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- boot ---------- */
/* ---------- 콕핏 스킨: 조종 패널 · 관제탑 ---------- */
let fxc=null;
function fx(){try{if(!fxc)fxc=new (window.AudioContext||window.webkitAudioContext)();if(fxc.state==='suspended')fxc.resume();return fxc}catch(e){return null}}
function fxNoise(a,dur){const b=a.createBuffer(1,Math.ceil(a.sampleRate*dur),a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const s=a.createBufferSource();s.buffer=b;return s}
function fxEnv(a,t,peak,att,dec){const g=a.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+att);g.gain.exponentialRampToValueAtTime(.0001,t+att+dec);return g}
// 버튼: 켜면 묵직하게 "철컥", 끄면 가볍게 "팅"
function sndPress(on){const a=fx();if(!a)return;const t=a.currentTime;
  const o=a.createOscillator();o.type='sine';o.frequency.setValueAtTime(on?110:220,t);o.frequency.exponentialRampToValueAtTime(on?42:130,t+.12);
  const g=fxEnv(a,t,on?.55:.3,.003,on?.16:.08);o.connect(g).connect(a.destination);o.start(t);o.stop(t+.25);
  const n=fxNoise(a,.05),hp=a.createBiquadFilter();hp.type='highpass';hp.frequency.value=on?1800:3200;const gn=fxEnv(a,t,on?.35:.25,.001,.03);n.connect(hp).connect(gn).connect(a.destination);n.start(t)}
// 무전 스퀠치("치익")
function sndSquelch(at=0,len=.14){if(!atcOn())return;const a=fx();if(!a)return;const t=a.currentTime+at,n=fxNoise(a,len+.05),bp=a.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1700;bp.Q.value=.8;
  const g=a.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.16,t+.01);g.gain.setValueAtTime(.16,t+len*.7);g.gain.exponentialRampToValueAtTime(.0001,t+len);n.connect(bp).connect(g).connect(a.destination);n.start(t)}
function sndRoger(at=0){if(!atcOn())return;const a=fx();if(!a)return;const t=a.currentTime+at,o=a.createOscillator();o.type='square';o.frequency.value=1050;const bp=a.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1200;
  const g=fxEnv(a,t,.06,.005,.07);o.connect(bp).connect(g).connect(a.destination);o.start(t);o.stop(t+.1)}
// 이륙 허가: 무전 → 두 음 차임 → 엔진 스풀업
function sndTakeoff(){if(!atcOn())return;const a=fx();if(!a)return;const t=a.currentTime;sndSquelch(0,.22);
  [[784,.25],[659,.75]].forEach(([f,dt])=>{const o=a.createOscillator(),o2=a.createOscillator();o.frequency.value=f;o2.frequency.value=f*2;const g=fxEnv(a,t+dt,.22,.01,1.2),g2=fxEnv(a,t+dt,.05,.01,.6);o.connect(g).connect(a.destination);o2.connect(g2).connect(a.destination);o.start(t+dt);o2.start(t+dt);o.stop(t+dt+1.4);o2.stop(t+dt+1.4)});
  const s=t+1.6,L=6.5,n=fxNoise(a,L),lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(180,s);lp.frequency.exponentialRampToValueAtTime(3200,s+4);lp.frequency.exponentialRampToValueAtTime(900,s+L);
  const gn=a.createGain();gn.gain.setValueAtTime(.0001,s);gn.gain.exponentialRampToValueAtTime(.32,s+3.6);gn.gain.exponentialRampToValueAtTime(.0001,s+L);n.connect(lp).connect(gn).connect(a.destination);n.start(s);
  const w=a.createOscillator();w.type='sawtooth';w.frequency.setValueAtTime(160,s);w.frequency.exponentialRampToValueAtTime(2100,s+4.2);const bp=a.createBiquadFilter();bp.type='bandpass';bp.Q.value=6;bp.frequency.setValueAtTime(320,s);bp.frequency.exponentialRampToValueAtTime(4200,s+4.2);
  const gw=a.createGain();gw.gain.setValueAtTime(.0001,s);gw.gain.exponentialRampToValueAtTime(.05,s+3.4);gw.gain.exponentialRampToValueAtTime(.0001,s+L);w.connect(bp).connect(gw).connect(a.destination);w.start(s);w.stop(s+L)}
function atcOn(){return store.get('atcSound',true)!==false}

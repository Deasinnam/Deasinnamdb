/* 1.39 비행 단계 효과음(Web Audio 합성, 녹음 파일 없음) — pfd-flight.js가 단계가 바뀔 때 AmpHost.sfx(종류, 값)로 부름
 *  - 출발·가속(이륙 활주): 제트 엔진 스풀업(낮은 '우웅'이 점점 높아짐) + 활주로 이음매를 지날 때마다 '덜컹', 속도에 맞춰 커지고 빨라짐
 *  - 이륙 순간: 기수가 들리며 '후우웅' 바람 + 1.2초 뒤 랜딩 기어 접히는 유압음과 '철컥'
 *  - 착륙 접근: 랜딩 기어 내려오는 유압음 + '철컥' 잠금 + 객실 안전벨트 차임 '딩동'
 *  - 접지: 타이어 '끽!' 두 번 + '쾅' + 역추진 '쏴아—' 분사음이 잦아듦
 * 관제탑 소리 설정(atcOn)을 따르고, 앱이 화면에서 사라지면 이어지는 소리는 멈춤 */
const AmpSfx=(()=>{
  let roll=null; // 활주 중 계속 나는 소리 묶음 {src, gEng, lpEng, whine, gWhine, gRum, bumpT, v}
  const now=()=>{const a=fx();return a?a.currentTime:0};
  const out=a=>{const g=a.createGain();g.gain.value=.9;g.connect(a.destination);return g};
  function loopNoise(a,sec=2){const n=fxNoise(a,sec);n.loop=true;return n}
  function thud(a,t,f0,f1,amp,dur){const o=a.createOscillator();o.type='sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);const g=fxEnv(a,t,amp,.004,dur);o.connect(g).connect(a.destination);o.start(t);o.stop(t+dur+.05)}
  function click(a,t,f,amp){const o=a.createOscillator();o.type='square';o.frequency.value=f;const bp=a.createBiquadFilter();bp.type='bandpass';bp.frequency.value=f*1.5;bp.Q.value=3;const g=fxEnv(a,t,amp,.002,.06);o.connect(bp).connect(g).connect(a.destination);o.start(t);o.stop(t+.1)}
  function hyd(a,t,dur,f0,f1,amp){const o=a.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(f0,t);o.frequency.linearRampToValueAtTime(f1,t+dur);const lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=900;
    const g=a.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(amp,t+.15);g.gain.setValueAtTime(amp,t+dur-.2);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(lp).connect(g).connect(a.destination);o.start(t);o.stop(t+dur+.05)}
  function sweepNoise(a,t,dur,f0,f1,amp,q=1.2,type='bandpass'){const n=fxNoise(a,dur+.1),f=a.createBiquadFilter();f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+dur*.6);
    const g=a.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(amp,t+dur*.35);g.gain.exponentialRampToValueAtTime(.0001,t+dur);n.connect(f).connect(g).connect(a.destination);n.start(t);n.stop(t+dur+.1)}
  function chime(a,t){[[880,0],[660,.42]].forEach(([fq,dt])=>{[1,2.76,5.4].forEach((m,i)=>{const o=a.createOscillator();o.type='sine';o.frequency.value=fq*m;const g=fxEnv(a,t+dt,[.16,.05,.02][i],.006,1.3-i*.3);o.connect(g).connect(a.destination);o.start(t+dt);o.stop(t+dt+1.5)})})}

  /* 출발·가속: 엔진(저역 잡음 + 터빈 음) + 활주 진동. roll(v)로 속도를 알려 주면 소리가 따라감 */
  function rollStart(){if(!atcOn()||roll)return;const a=fx();if(!a)return;const t=a.currentTime,o=out(a);
    const src=loopNoise(a),lpEng=a.createBiquadFilter();lpEng.type='lowpass';lpEng.frequency.value=220;const gEng=a.createGain();gEng.gain.setValueAtTime(.0001,t);gEng.gain.exponentialRampToValueAtTime(.12,t+1.2);src.connect(lpEng).connect(gEng).connect(o);
    const whine=a.createOscillator();whine.type='sawtooth';whine.frequency.setValueAtTime(140,t);whine.frequency.exponentialRampToValueAtTime(700,t+3);const bpW=a.createBiquadFilter();bpW.type='bandpass';bpW.Q.value=8;bpW.frequency.value=1400;
    const gWhine=a.createGain();gWhine.gain.setValueAtTime(.0001,t);gWhine.gain.exponentialRampToValueAtTime(.025,t+2);whine.connect(bpW).connect(gWhine).connect(o);
    const rs=loopNoise(a,1.5),lpR=a.createBiquadFilter();lpR.type='lowpass';lpR.frequency.value=110;const gRum=a.createGain();gRum.gain.value=.0001;rs.connect(lpR).connect(gRum).connect(o);
    src.start(t);whine.start(t);rs.start(t);roll={src,rs,whine,gEng,lpEng,gWhine,bpW,gRum,o,v:0,bumpT:0};bump()}
  function bump(){if(!roll)return;const a=fx();if(a&&roll.v>4){const t=a.currentTime,k=Math.min(1,roll.v/120);thud(a,t,70,38,.08+k*.1,.12);thud(a,t+.07,66,36,.06+k*.08,.1)}
    const gap=roll.v>4?Math.max(.18,Math.min(1.6,25/(roll.v/3.6)*.5)):.5;roll.bumpT=setTimeout(bump,gap*1000)}  // 활주로 이음매(25m)마다 앞·뒷바퀴
  function rollSpeed(v){if(!roll)return;const a=fx();if(!a)return;const t=a.currentTime,k=Math.max(0,Math.min(1,v/150));roll.v=v;
    roll.gEng.gain.setTargetAtTime(.1+k*.22,t,.3);roll.lpEng.frequency.setTargetAtTime(220+k*2600,t,.4);
    roll.whine.frequency.setTargetAtTime(700+k*1700,t,.5);roll.bpW.frequency.setTargetAtTime(1400+k*2800,t,.5);roll.gWhine.gain.setTargetAtTime(.025+k*.04,t,.4);
    roll.gRum.gain.setTargetAtTime(v>3?.05+k*.18:.0001,t,.15)}
  function rollStop(fade=1.2){if(!roll)return;const r=roll;roll=null;clearTimeout(r.bumpT);const a=fx();if(!a)return;const t=a.currentTime;
    r.o.gain.setTargetAtTime(.0001,t,fade/4);setTimeout(()=>{try{r.src.stop();r.rs.stop();r.whine.stop()}catch(e){}},fade*1000+200)}

  /* 이륙 순간: 바퀴가 떨어지며 '끽' 짧게 → 바람 '후우웅' → 1.2초 뒤 기어 접힘(유압 + 철컥) */
  function liftoff(){if(!atcOn())return;const a=fx();if(!a)return;const t=a.currentTime;
    try{sndTire(false)}catch(e){}
    sweepNoise(a,t+.1,2.6,300,1500,.22,1.4);sweepNoise(a,t+.3,3.2,120,420,.18,.7,'lowpass');
    hyd(a,t+1.2,1.1,260,190,.035);click(a,t+2.25,700,.12);thud(a,t+2.25,120,60,.16,.16);
    rollStop(4.5)}
  /* 착륙 접근: 기어 내림(유압 → 철컥 잠금 두 번) + 안전벨트 차임 '딩동' */
  function approach(){if(!atcOn())return;const a=fx();if(!a)return;const t=a.currentTime;
    sweepNoise(a,t,2.2,500,260,.08,1.1);hyd(a,t+.2,1.6,180,250,.04);thud(a,t+1.85,110,50,.24,.2);click(a,t+1.85,620,.14);thud(a,t+2.05,100,48,.18,.18);click(a,t+2.05,560,.1);
    chime(a,t+2.7)}
  /* 접지: '끽! 끽' + '쾅' → 역추진 분사음이 커졌다가 잦아듦 */
  function touchdown(){if(!atcOn())return;const a=fx();if(!a)return;const t=a.currentTime;
    try{sndTire(true)}catch(e){}
    thud(a,t,80,34,.45,.32);sweepNoise(a,t,.25,900,300,.2,.8,'lowpass');
    const n=fxNoise(a,4.2),lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(300,t+.5);lp.frequency.exponentialRampToValueAtTime(1800,t+1.3);lp.frequency.exponentialRampToValueAtTime(400,t+4);
    const g=a.createGain();g.gain.setValueAtTime(.0001,t+.5);g.gain.exponentialRampToValueAtTime(.3,t+1.2);g.gain.setValueAtTime(.3,t+2);g.gain.exponentialRampToValueAtTime(.0001,t+4.1);n.connect(lp).connect(g).connect(a.destination);n.start(t+.5);
    rollStop(.6)}
  /* 복행: 엔진을 다시 최대로 올림 */
  function goAround(){if(!atcOn())return;const a=fx();if(!a)return;const t=a.currentTime;sweepNoise(a,t,3.5,200,2600,.26,1.2);sweepNoise(a,t,3.5,90,400,.16,.7,'lowpass')}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)rollStop(.2)});
  return {rollStart,rollSpeed,rollStop,liftoff,approach,touchdown,goAround,get rolling(){return !!roll}};
})();

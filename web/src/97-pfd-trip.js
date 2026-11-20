// 1.78 착륙하면 이번 비행(이륙 활주~착륙)의 평균 속도와 운전 평점을 PFD에 글자로만(노래 제목처럼 상자·효과 없이)
//  다음 출발(바퀴가 굴러가면)이나 40초 뒤 사라짐
const PfdTrip=(()=>{let el=null,shown=0,until=0;
  function tick(){const w=document.querySelector('#pfdHost .pfd-canvas-wrap');if(!w||!window.AmpFlight)return;
    if(!el||!w.contains(el)){el=document.createElement('div');el.className='pfd-trip';el.setAttribute('aria-live','polite');el.hidden=true;w.appendChild(el)}
    const st=AmpFlight.state||{},tr=st.trip;
    if(tr&&tr.at>shown&&st.phase==='landed'){shown=tr.at;until=Date.now()+40000;
      el.innerHTML='<b>평균 속도 '+tr.avg+' km/h</b><span>운전 평점 '+tr.score+'점 · '+tr.grade+'</span><small>'+tr.km+' km · '+tr.min+'분 · 급가속 '+tr.acc+' · 급감속 '+tr.brk+'</small>'}
    el.hidden=!(until>Date.now()&&st.phase==='landed')}
  setInterval(()=>{if(!document.hidden)tick()},500);
  return {tick,get text(){return el?el.textContent:''}}})();
window.PfdTrip=PfdTrip;

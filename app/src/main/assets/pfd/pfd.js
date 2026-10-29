/* DAESINNAM ONE PFD. Framework-independent, local assets only. */
(function(global){
'use strict';
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const bearing=v=>((v%360)+360)%360;
const angleDelta=(a,b)=>((b-a+540)%360)-180;
const formatTime=s=>{s=Math.max(0,Math.floor(s||0));return [Math.floor(s/3600),Math.floor(s/60)%60,s%60].map(v=>String(v).padStart(2,'0')).join(':');};
const cardinal=d=>['N','NE','E','SE','S','SW','W','NW'][Math.round(bearing(d)/45)%8];
const haversine=(a,b)=>{const r=Math.PI/180,p=(b.latitude-a.latitude)*r,l=(b.longitude-a.longitude)*r;const q=Math.sin(p/2)**2+Math.cos(a.latitude*r)*Math.cos(b.latitude*r)*Math.sin(l/2)**2;return 6371000*2*Math.atan2(Math.sqrt(q),Math.sqrt(Math.max(0,1-q)));};
const initial=()=>({source:'none',speedKmh:null,altitudeM:null,headingDeg:null,accuracyM:null,pitchDeg:null,rollDeg:null,satellitesUsed:null,satellitesVisible:null,maxSpeedKmh:0,avgSpeedKmh:0,distanceKm:0,durationSeconds:0,timestampMs:0,fixValid:false});
const sample=()=>({source:'demo',speedKmh:72,altitudeM:10,headingDeg:0,accuracyM:3,pitchDeg:0,rollDeg:0,satellitesUsed:9,satellitesVisible:12,maxSpeedKmh:86,avgSpeedKmh:54,distanceKm:12.6,durationSeconds:840,timestampMs:Date.now(),fixValid:true});
const numericKeys=['speedKmh','altitudeM','headingDeg','accuracyM','pitchDeg','rollDeg','satellitesUsed','satellitesVisible','maxSpeedKmh','avgSpeedKmh','distanceKm','durationSeconds','timestampMs'];
const nonNegative=new Set(['speedKmh','accuracyM','satellitesUsed','satellitesVisible','maxSpeedKmh','avgSpeedKmh','distanceKm','durationSeconds']);
const icon=(path)=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+path+'</svg>';
const icons={power:icon('<path d="M12 2v9m-5-6a9 9 0 1 0 10 0"/>'),reset:icon('<path d="M3 11a9 9 0 0 1 15-6l3 3M21 3v5h-5M21 13A9 9 0 0 1 6 19l-3-3M3 21v-5h5"/>'),hud:icon('<rect x="2" y="4" width="20" height="16" rx="1"/>'),level:icon('<circle cx="12" cy="12" r="7"/><path d="M12 1v7m0 8v7M1 12h7m8 0h7"/>'),theme:icon('<path d="M12 3a9 9 0 1 0 0 18h2a3 3 0 0 0 2-5c-1-1-1-2 1-2h1a3 3 0 0 0 3-3c0-5-4-8-9-8Z"/><circle cx="7" cy="11" r=".8"/><circle cx="10" cy="7" r=".8"/><circle cx="15" cy="7" r=".8"/>')};

class TripTracker{
 constructor(){this.reset();}
 reset(){this.started=null;this.last=null;this.distanceM=0;this.max=0;this.duration=0;}
 feed(point,speedKmh){
  if(!finite(point.timestamp)||!finite(point.latitude)||!finite(point.longitude)||!finite(point.accuracy))return this.metrics();
  if(this.started===null)this.started=point.timestamp;
  this.duration=Math.max(this.duration,(point.timestamp-this.started)/1000);
  if(finite(speedKmh))this.max=Math.max(this.max,speedKmh);
  if(this.last){const dt=(point.timestamp-this.last.timestamp)/1000,dist=haversine(this.last,point);const noise=Math.max(3,(point.accuracy+this.last.accuracy)/2);if(dt>0&&dt<=15&&point.accuracy<=50&&this.last.accuracy<=50&&finite(speedKmh)&&speedKmh>=1&&dist>noise&&dist<dt*(220/3.6)+noise)this.distanceM+=dist;}
  this.last=point;return this.metrics();
 }
 metrics(){return {maxSpeedKmh:this.max,avgSpeedKmh:this.duration>0?this.distanceM/this.duration*3.6:0,distanceKm:this.distanceM/1000,durationSeconds:this.duration};}
}

/* Cached volumetric cloud sprites and a deterministic, speed-driven night city. */
const sceneAssets={clouds:null,moon:null,glows:null};
const fract=v=>v-Math.floor(v),wrap=(v,n)=>((v%n)+n)%n;
const randomAt=(i,seed=0)=>{let n=Math.imul(i+seed*7919,374761393);n=(n^(n>>>13));return ((Math.imul(n,1274126177)^(n>>>16))>>>0)/4294967295;};
const noise2=(x,y,seed)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=fract(x),fy=fract(y),u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);const a=randomAt(ix+iy*4099,seed),b=randomAt(ix+1+iy*4099,seed),d=randomAt(ix+(iy+1)*4099,seed),e=randomAt(ix+1+(iy+1)*4099,seed);return (a+(b-a)*u)*(1-v)+(d+(e-d)*u)*v;};
const fbm=(x,y,seed)=>noise2(x,y,seed)*.57+noise2(x*2.13+7,y*2.13,seed+17)*.29+noise2(x*4.47,y*4.47+13,seed+39)*.14;
function cloudSprites(){
 if(sceneAssets.clouds)return sceneAssets.clouds;
 const shapes=[];
 for(let seed=1;seed<=5;seed++){
  const width=576,height=216,day=document.createElement('canvas'),night=document.createElement('canvas');day.width=night.width=width;day.height=night.height=height;
  const dc=day.getContext('2d'),nc=night.getContext('2d'),di=dc.createImageData(width,height),ni=nc.createImageData(width,height),lobes=[];
  for(let j=0;j<7;j++)lobes.push({x:-.73+j*.24+(randomAt(j,seed)-.5)*.12,y:.09-Math.sin(j/6*Math.PI)*(.28+randomAt(j+8,seed)*.15),rx:.23+randomAt(j+19,seed)*.11,ry:.32+randomAt(j+32,seed)*.27});
  for(let yy=0;yy<height;yy++)for(let xx=0;xx<width;xx++){
   const x=xx/(width-1)*2-1,y=yy/(height-1)*2-1;let density=-10,normalX=0,normalY=0,normalWeight=0;
   for(const l of lobes){const dx=(x-l.x)/l.rx,dy=(y-l.y)/l.ry,value=1-dx*dx-dy*dy,weight=Math.max(0,value+.25)**2;density=Math.max(density,value);normalX+=dx*weight;normalY+=dy*weight;normalWeight+=weight;}
   if(normalWeight>0){normalX/=normalWeight;normalY/=normalWeight;}
   if(density<-.42||y>.65)continue;
   const n=fbm(x*8+13,y*5+9,seed),f=fbm(x*20+80,y*13+20,seed+5);density+=(n-.51)*.51+(f-.5)*.12;
   const edge=clamp(density/.19,0,1),wisps=clamp((.65-y)/.24,0,1),alpha=edge*edge*(3-2*edge)*wisps*clamp((1-Math.abs(x))/.16,0,1)*clamp((1+y)/.14,0,1);
   if(alpha<.005)continue;
   const illumination=clamp(-normalX*.24-normalY*.55+Math.sqrt(clamp(density,0,1))*.7+.12,0,1),light=clamp(.59+illumination*.40+(n-.5)*.065+(f-.5)*.035,.54,1),k=(yy*width+xx)*4;
   di.data[k]=Math.round(249*light);di.data[k+1]=Math.round(252*light);di.data[k+2]=Math.round(255*light);di.data[k+3]=Math.round(alpha*248);
   const rim=clamp((.32-density)*1.2,0,.22);
   ni.data[k]=Math.round(33+light*46+rim*22);ni.data[k+1]=Math.round(47+light*53+rim*29);ni.data[k+2]=Math.round(68+light*65+rim*39);ni.data[k+3]=Math.round(alpha*245);
  }
  dc.putImageData(di,0,0);nc.putImageData(ni,0,0);shapes.push({day,night});
 }
 sceneAssets.clouds=shapes;return shapes;
}
function moonSprite(){
 if(sceneAssets.moon)return sceneAssets.moon;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=144;const c=canvas.getContext('2d'),im=c.createImageData(144,144),craters=[];
 for(let i=0;i<28;i++)craters.push({x:(randomAt(i,90)-.5)*1.6,y:(randomAt(i,91)-.5)*1.6,r:.04+randomAt(i,92)*.17});
 for(let y=0;y<144;y++)for(let x=0;x<144;x++){
  const nx=(x-71.5)/65,ny=(y-71.5)/65,r2=nx*nx+ny*ny;if(r2>1)continue;
  const nz=Math.sqrt(Math.max(0,1-r2));let light=clamp(nx*.42-ny*.24+nz*.82+.09,.03,1);
  let crater=0;for(const p of craters){const d=Math.hypot(nx-p.x,ny-p.y)/p.r;if(d<1)crater+=Math.sin((1-d)*Math.PI)*.065;}
  light=clamp(light-crater+(noise2(nx*16+30,ny*16+30,42)-.5)*.045,.025,1);
  const k=(y*144+x)*4;im.data[k]=44+light*195;im.data[k+1]=57+light*190;im.data[k+2]=78+light*176;im.data[k+3]=Math.round(clamp((1-r2)*75,0,1)*255);
 }
 c.putImageData(im,0,0);sceneAssets.moon=canvas;return canvas;
}
function lightSprites(){
 if(sceneAssets.glows)return sceneAssets.glows;
 sceneAssets.glows=['255,197,105','173,210,255','255,117,78'].map(rgb=>{const t=document.createElement('canvas');t.width=t.height=48;const c=t.getContext('2d'),g=c.createRadialGradient(24,24,0,24,24,24);g.addColorStop(0,'rgba('+rgb+',.95)');g.addColorStop(.09,'rgba('+rgb+',.85)');g.addColorStop(.25,'rgba('+rgb+',.29)');g.addColorStop(1,'rgba('+rgb+',0)');c.fillStyle=g;c.fillRect(0,0,48,48);return t;});return sceneAssets.glows;
}
class PfdScene{
 constructor(){
  this.distanceMeters=0;this.drawCount=0;this.sprites=cloudSprites();this.moon=moonSprite();this.glows=lightSprites();this.clouds=[];this.stars=[];this.city=[];this.lightDraw=[];
  for(let i=0;i<21;i++)this.clouds.push({id:i,z:160+randomAt(i,3)*1520,x:(randomAt(i,4)-.5)*1400,height:30+randomAt(i,5)*140,width:125+randomAt(i,6)*150,layer:.74+randomAt(i,7)*.45,shape:i%5});
  // The moon and stars are a visual sky, never an astronomical navigation source.
  for(let i=0;i<180;i++)this.stars.push({x:(randomAt(i,11)-.5)*2.7,y:.025+randomAt(i,12)*1.65,size:.45+randomAt(i,13)*1.05,alpha:.25+randomAt(i,14)*.65});
  for(let i=0;i<330;i++)this.city.push({x:(randomAt(i,17)-.5)*980,z:35+randomAt(i,18)*1065,color:randomAt(i,19)>.83?1:0,size:.7+randomAt(i,20),lamp:false});
  for(const lane of [-310,-180,-85,-29,29,85,180,310])for(let j=0;j<22;j++)this.city.push({x:lane,z:35+j*48+randomAt(j,21)*9,color:0,size:1.1,lamp:true});
 }
 advance(seconds,speedKmh){if(finite(seconds)&&finite(speedKmh)&&seconds>0&&speedKmh>0)this.distanceMeters+=speedKmh/3.6*2.2*clamp(seconds,0,.1);}
 drawSky(c,w,h,night,quality){
  this.drawCount++;c.save();c.beginPath();c.rect(-w*2,-h*3,w*4,h*3);c.clip();
  if(night){
   const count=quality==='balanced'?105:180;c.fillStyle='#c8dcff';
   for(let i=0;i<count;i++){const s=this.stars[i];c.globalAlpha=s.alpha;c.beginPath();c.arc(s.x*w,-s.y*h,s.size,0,Math.PI*2);c.fill();if(s.size>1.38){c.globalAlpha=s.alpha*.28;c.fillRect(s.x*w-3,-s.y*h-.3,6,.6);c.fillRect(s.x*w-.3,-s.y*h-3,.6,6);}}
   c.globalAlpha=1;const mx=w*.31,my=-h*.355,r=clamp(w*.019,14,24),glow=c.createRadialGradient(mx,my,r*.8,mx,my,r*5);glow.addColorStop(0,'#7d9fc51d');glow.addColorStop(1,'#7d9fc500');c.fillStyle=glow;c.fillRect(mx-r*5,my-r*5,r*10,r*10);c.drawImage(this.moon,mx-r,my-r,r*2,r*2);
  }
  const focal=w*.79;for(const o of this.clouds)o.depth=160+wrap(o.z-160-this.distanceMeters*o.layer,1520);const clouds=this.clouds.sort((a,b)=>b.depth-a.depth);
  for(const cl of clouds){if(quality==='balanced'&&cl.id%3===0)continue;const fade=clamp((1680-cl.depth)/150,0,1)*clamp((cl.depth-160)/95,0,1);if(fade<.01)continue;const scale=focal/cl.depth,cx=cl.x*scale,cy=-cl.height*scale,cw=cl.width*scale,ch=cw*.375;
   if(cx+cw*.55< -w*.85||cx-cw*.55>w*.85||cy+ch*.6< -h*1.5)continue;
   c.globalAlpha=fade*(.43+.47*(1-cl.depth/1680));c.drawImage(night?this.sprites[cl.shape].night:this.sprites[cl.shape].day,cx-cw/2,cy-ch*.42,cw,ch);
  }
  c.restore();
 }
 drawGround(c,w,h,night,speed,quality){
  if(!night)return;c.save();c.beginPath();c.rect(-w*2,0,w*4,h*3);c.clip();const focal=w*.79;
  // Faint silhouettes and window clusters at the distant city edge.
  const shift=wrap(this.distanceMeters*.028,52);
  for(let i=-22;i<23;i++){const bw=22+randomAt(i,41)*32,bh=5+randomAt(i,42)*27,bx=i*52-shift;c.fillStyle='#030a12';c.fillRect(bx,0,bw,bh);for(let col=0;col<4;col++)for(let row=0;row<3;row++){if(randomAt(i*31+col*7+row,43)<.45)continue;c.globalAlpha=.18+randomAt(i+row,44)*.4;c.fillStyle=col===2?'#a9c4da':'#edc18b';c.fillRect(bx+4+col*5,3+row*5,1.4,1.2);}}c.globalAlpha=1;
  const points=this.lightDraw;points.length=0;for(let i=0;i<this.city.length;i++){if(quality==='balanced'&&!this.city[i].lamp&&i%2===0)continue;const p=this.city[i],z=35+wrap(p.z-35-this.distanceMeters,1065),scale=focal/z,xx=p.x*scale,yy=11*scale;if(Math.abs(xx)>w*.9||yy>h*1.6)continue;p.depth=z;p.scale=scale;p.xx=xx;p.yy=yy;points.push(p);}points.sort((a,b)=>b.depth-a.depth);
  for(const p of points){const fade=clamp((1100-p.depth)/160,0,1)*clamp((p.depth-35)/22,0,1),size=clamp(p.scale*p.size*.32,.75,3.5);if(fade<.01)continue;
   if(p.lamp&&p.scale>1.8){const poleHeight=clamp(p.scale*2.6,0,h*.26);c.globalAlpha=fade*.9;c.strokeStyle='#2b3d50';c.lineWidth=clamp(p.scale*.07,.7,1.6);c.beginPath();c.moveTo(p.xx,p.yy);c.lineTo(p.xx,p.yy-poleHeight);c.lineTo(p.xx+(p.x<0?1:-1)*Math.min(p.scale*.6,9),p.yy-poleHeight);c.stroke();const headX=p.xx+(p.x<0?1:-1)*Math.min(p.scale*.6,9),headY=p.yy-poleHeight,gsize=size*12;c.globalAlpha=fade*.75;c.drawImage(this.glows[0],headX-gsize/2,headY-gsize/2,gsize,gsize);c.fillStyle='#ffe2ae';c.fillRect(headX-size*.35,headY-size*.28,size*.7,size*.56);c.globalAlpha=fade*.12;c.drawImage(this.glows[0],p.xx-size*8,p.yy-size*1.9,size*16,size*3.8);
   }else{const s=size*7;c.globalAlpha=fade*(p.lamp ? .8 : .48);c.drawImage(this.glows[p.color],p.xx-s/2,p.yy-s/2,s,s);}
   if(speed>12&&p.depth<230){const len=clamp(speed/100*p.scale*.65,0,11),dx=p.xx/(Math.hypot(p.xx,p.yy)||1),dy=p.yy/(Math.hypot(p.xx,p.yy)||1);c.strokeStyle=p.color?'#a5cdf9':'#f7c381';c.globalAlpha=fade*.26;c.lineWidth=.7;c.beginPath();c.moveTo(p.xx,p.yy);c.lineTo(p.xx+dx*len,p.yy+dy*len);c.stroke();}
  }
  c.restore();
 }
}

class PfdPanel{
 constructor(container,options={}){
  if(!container||typeof container.appendChild!=='function')throw new TypeError('A container element is required');
  this.options=options;this.data=initial();this.settings={skin:'cockpit',theme:'auto',limitKmh:0,mirrorHud:false,sceneMotion:true,sceneQuality:'high'};this.calibration={pitch:0,roll:0};this.hud=false;this.playing=false;this.disposed=false;this.watchId=null;this.demoTimer=null;this.toastTimer=null;this.events=[];this.frame=null;this.display={speedKmh:0,altitudeM:0,headingDeg:0,pitchDeg:0,rollDeg:0};this.trip=new TripTracker();this.native=options.nativeBridge||global.PfdNative||null;
  this.root=document.createElement('section');this.root.className='dsn-pfd';this.root.setAttribute('aria-label','대신남 원 GPS 스피드미터');
  this.root.innerHTML=`<i class="pfd-bolt one" aria-hidden="true"></i><i class="pfd-bolt two" aria-hidden="true"></i>
   <span class="pfd-af-hardware" data-role="afHardware" hidden aria-hidden="true"><i></i><i></i></span><header class="pfd-header"><h2 data-role="title">SPEEDOMETER</h2><span class="pfd-skin-badge" data-role="skinBadge" hidden>AIRFORCE</span><span class="pfd-signal" data-role="signal"><i></i><span data-role="signalText">GPS OFF</span></span><button class="pfd-collapse" data-role="collapse" aria-label="스피드미터 접기" aria-expanded="true">−</button></header>
   <div data-role="content">
   <div class="pfd-metrics">
    <div class="pfd-metric"><span class="pfd-metric-label">최고 속도</span><span class="pfd-metric-value"><span data-role="max">0</span><span class="pfd-unit">km/h</span></span></div>
    <div class="pfd-metric"><span class="pfd-metric-label">평균 속도</span><span class="pfd-metric-value"><span data-role="avg">0</span><span class="pfd-unit">km/h</span></span></div>
    <div class="pfd-metric"><span class="pfd-metric-label">주행 거리</span><span class="pfd-metric-value"><span data-role="distance">0.0</span><span class="pfd-unit">km</span></span></div>
    <div class="pfd-metric"><span class="pfd-metric-label">주행 시간</span><span class="pfd-metric-value" data-role="duration">00:00:00</span></div>
    <div class="pfd-metric"><span class="pfd-metric-label">고도</span><span class="pfd-metric-value"><span data-role="altitude">—</span><span class="pfd-unit">m</span></span></div>
    <div class="pfd-metric"><span class="pfd-metric-label">GPS 정확도</span><span class="pfd-metric-value"><span data-role="accuracy">—</span><span class="pfd-unit">m</span></span><span class="pfd-sat" data-role="satellites">위성 —</span></div>
   </div>
   <div class="pfd-glass"><div class="pfd-flight-meta"><span data-role="source">GPS</span><span data-role="track">TRK —</span><button data-role="limit" aria-label="속도 경고 설정">LIM OFF</button></div>
   <div class="pfd-canvas-wrap" data-role="canvasWrap"><canvas data-role="canvas" role="img" aria-label="속도 및 자세 표시"></canvas><div class="pfd-hud-layer" data-role="hudLayer" hidden><span class="pfd-hud-digits" data-role="hudSpeed">—</span><span class="pfd-hud-unit">km/h</span><span class="pfd-hud-heading" data-role="hudHeading">—</span><span class="pfd-hud-caption" data-role="hudCaption">GPS OFF</span></div></div></div>
   <div class="pfd-tools">
    <button class="pfd-tool" data-role="gps" aria-pressed="false">${icons.power}<span data-role="gpsText">GPS 켜기</span></button>
    <button class="pfd-tool" data-role="reset">${icons.reset}<span>기록 초기화</span></button>
    <button class="pfd-tool" data-role="hud" aria-pressed="false">${icons.hud}<span>HUD</span></button>
    <select class="pfd-tool pfd-mode" data-role="mode" aria-label="디자인 테마 및 표시 방식"><option value="pfd">콕핏 PFD</option><option value="airforce">에어포스</option><option value="hud">심플 HUD</option></select>
    <button class="pfd-tool" data-role="level">${icons.level}<span>수평 맞춤</span></button>
    <button class="pfd-tool" data-role="settings">${icons.theme}<span data-role="themeText">테마 자동</span></button>
   </div><div class="pfd-status-line"><span data-role="status" role="status">GPS 또는 앱 데이터 연결을 기다립니다.</span><span class="pfd-status-code">DSN-PFD / SVG-CANVAS UI</span></div></div>
   <div class="pfd-toast" data-role="toast" role="status" aria-live="polite"></div>
   <dialog data-role="dialog"><form data-role="form"><div class="pfd-dialog-head">계기판 설정<button class="pfd-close" type="button" data-role="close" aria-label="설정 닫기">×</button></div><label class="pfd-field">디자인 테마<select data-role="skin"><option value="cockpit">콕핏</option><option value="airforce">에어포스</option></select></label><label class="pfd-field">주간·야간<select data-role="theme"><option value="auto">자동</option><option value="night">야간</option><option value="day">주간</option></select></label><label class="pfd-field">속도 경고 기준 (0 = 끄기)<input data-role="limitInput" type="number" inputmode="numeric" min="0" max="300" step="1" value="0"></label><label class="pfd-field"><input type="checkbox" data-role="mirror">HUD 좌우 반전</label><label class="pfd-field"><input type="checkbox" data-role="sceneMotion" checked>구름·도심 이동 효과</label><label class="pfd-field">배경 품질<select data-role="sceneQuality"><option value="high">고화질 · 부드럽게</option><option value="balanced">가볍게 · 전력 절약</option></select></label><p class="pfd-dialog-note">자세 표시는 앱에서 받은 기울기 값에 연결됩니다. 하늘·도심 배경은 시각 효과이며 실제 지도·기상 정보가 아닙니다.</p><p class="pfd-field-error" data-role="formError" role="alert" hidden></p><button class="pfd-save" type="submit">설정 적용</button></form></dialog>`;
  container.appendChild(this.root);this.els={};this.root.querySelectorAll('[data-role]').forEach(e=>{this.els[e.dataset.role]=e;});this.canvas=this.els.canvas;this.ctx=this.canvas.getContext('2d');
  if(!this.ctx)throw new Error('Canvas 2D is not supported');
  this.scene=new PfdScene();this.transition=null;this.lastSceneTime=null;this.onScreen=true;this.viewportVisible=true;
  this.on(this.els.collapse,'click',()=>{const open=this.els.content.hidden;this.els.content.hidden=!open;this.els.collapse.textContent=open?'−':'+';this.els.collapse.setAttribute('aria-expanded',String(open));this.els.collapse.setAttribute('aria-label',open?'스피드미터 접기':'스피드미터 펼치기');if(open)this.resize();this.syncAnimation();});
  this.on(this.els.gps,'click',()=>{if(this.watchId!==null||this.nativeGpsRequested)this.stopGps();else this.startGps();});
  this.on(this.els.reset,'click',()=>{this.trip.reset();this.updateTelemetry({maxSpeedKmh:finite(this.data.speedKmh)?this.data.speedKmh:0,avgSpeedKmh:0,distanceKm:0,durationSeconds:0},{touchTimestamp:false});this.command('trip:reset');this.notify('주행 기록을 초기화했습니다.');});
  this.on(this.els.hud,'click',()=>this.setHud(!this.hud));this.on(this.els.mode,'change',()=>{const mode=this.els.mode.value;if(mode==='hud'){this.setHud(true);}else{this.setSettings({skin:mode==='airforce'?'airforce':'cockpit'});this.setHud(false);this.command('settings:change',{...this.settings});}});
  this.on(this.els.level,'click',()=>this.calibrate());this.on(this.els.settings,'click',()=>this.openSettings());this.on(this.els.limit,'click',()=>this.openSettings());this.on(this.els.close,'click',()=>this.els.dialog.close());
  this.on(this.els.form,'submit',e=>{e.preventDefault();const limit=Number(this.els.limitInput.value);if(!Number.isInteger(limit)||limit<0||limit>300){this.els.formError.textContent='속도 기준은 0~300의 정수로 입력하세요.';this.els.formError.hidden=false;return;}this.setSettings({skin:this.els.skin.value,theme:this.els.theme.value,limitKmh:limit,mirrorHud:this.els.mirror.checked,sceneMotion:this.els.sceneMotion.checked,sceneQuality:this.els.sceneQuality.value});this.els.dialog.close();this.command('settings:change',{...this.settings});});
  this.media=global.matchMedia('(prefers-color-scheme: light)');this.reduced=global.matchMedia('(prefers-reduced-motion: reduce)');this.on(this.media,'change',()=>{this.applyTheme();this.draw();this.syncAnimation();});this.on(this.reduced,'change',()=>{this.syncAnimation();this.draw();});
  this.resizeObserver=global.ResizeObserver?new ResizeObserver(()=>this.resize()):null;if(this.resizeObserver)this.resizeObserver.observe(this.els.canvasWrap);else this.on(global,'resize',()=>this.resize());
  this.on(document,'visibilitychange',()=>{if(document.hidden)this.stopDemo();else{this.renderText();this.draw();}this.syncAnimation();});
  this.intersectionObserver=global.IntersectionObserver?new IntersectionObserver(entries=>{this.onScreen=entries[0].isIntersecting;this.syncAnimation();}):null;if(this.intersectionObserver)this.intersectionObserver.observe(this.root);
  this.healthTimer=setInterval(()=>{if(!this.disposed&&!document.hidden){this.renderText();this.draw();this.syncAnimation();}},1000);
  this.applyTheme();this.resize();if(options.demo)this.useDemo();else this.renderText();
 }
 on(target,event,fn){target.addEventListener(event,fn);this.events.push([target,event,fn]);}
 command(type,detail={}){const event={type,...detail};this.root.dispatchEvent(new CustomEvent('pfd:command',{detail:event,bubbles:true}));if(typeof this.options.onCommand==='function')this.options.onCommand(event);}
 notify(text){this.els.toast.textContent=String(text);this.els.toast.classList.add('visible');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>this.els.toast.classList.remove('visible'),3600);}
 updateTelemetry(patch,opts={}){
  if(this.disposed)throw new Error('PFD has been destroyed');if(!patch||typeof patch!=='object')throw new TypeError('Telemetry must be an object');
  if('source'in patch&&!['none','demo','gps','external'].includes(patch.source))throw new TypeError('Invalid source');
  const source='source'in patch?patch.source:this.data.source;
  const sourceChanged=source!==this.data.source;
  const next=sourceChanged?{...initial(),source}:{...this.data};
  for(const key of numericKeys){if(!(key in patch))continue;const v=patch[key];if(v!==null&&!finite(v))throw new TypeError(key+' must be a finite number or null');if(v!==null&&nonNegative.has(key)&&v<0)throw new RangeError(key+' cannot be negative');next[key]=key==='headingDeg'&&v!==null?bearing(v):v;}
  if(next.pitchDeg!==null)next.pitchDeg=clamp(next.pitchDeg,-90,90);if(next.rollDeg!==null)next.rollDeg=clamp(next.rollDeg,-180,180);
  if('fixValid'in patch){if(typeof patch.fixValid!=='boolean')throw new TypeError('fixValid must be boolean');next.fixValid=patch.fixValid;}else if('speedKmh'in patch||'accuracyM'in patch)next.fixValid=finite(next.speedKmh)||finite(next.accuracyM);
  if(opts.touchTimestamp!==false&&!('timestampMs'in patch))next.timestampMs=Date.now();
  if(sourceChanged){this.calibration={pitch:0,roll:0};if(source!=='demo')this.stopDemo();}
  this.data=next;this.renderText();this.animate();return this.getState();
 }
 effective(){const stale=this.data.source!=='demo'&&this.data.source!=='none'&&Date.now()-this.data.timestampMs>15000;const valid=this.data.source!=='none'&&this.data.fixValid&&!stale;return {valid,stale};}
 getState(){return {telemetry:{...this.data},settings:{...this.settings},hud:this.hud,playing:this.playing,...this.effective()};}
 setSettings(patch={}){
  const next={...this.settings};
  if(patch.skin!==undefined){if(!['cockpit','airforce'].includes(patch.skin))throw new RangeError('Invalid skin');next.skin=patch.skin;}
  if(patch.theme!==undefined){if(!['auto','day','night'].includes(patch.theme))throw new RangeError('Invalid theme');next.theme=patch.theme;}
  if(patch.limitKmh!==undefined){if(!finite(patch.limitKmh)||patch.limitKmh<0||patch.limitKmh>300)throw new RangeError('Invalid limit');next.limitKmh=Math.round(patch.limitKmh);}
  if(patch.mirrorHud!==undefined)next.mirrorHud=!!patch.mirrorHud;
  if(patch.sceneMotion!==undefined){if(typeof patch.sceneMotion!=='boolean')throw new TypeError('sceneMotion must be boolean');next.sceneMotion=patch.sceneMotion;}
  if(patch.sceneQuality!==undefined){if(!['high','balanced'].includes(patch.sceneQuality))throw new RangeError('Invalid sceneQuality');next.sceneQuality=patch.sceneQuality;}
  this.settings=next;this.applyTheme();this.renderText();this.draw();this.syncAnimation();
 }
 applyTheme(){this.day=this.settings.theme==='day'||(this.settings.theme==='auto'&&this.media.matches);this.root.classList.toggle('pfd-day',this.day);const af=this.settings.skin==='airforce';this.root.classList.toggle('pfd-airforce',af);this.root.dataset.skin=this.settings.skin;this.els.title.textContent=af?'DAESINNAM ONE':'SPEEDOMETER';this.els.skinBadge.hidden=!af;this.els.afHardware.hidden=!af;this.els.mode.value=this.hud?'hud':af?'airforce':'pfd';}
 openSettings(){this.els.skin.value=this.settings.skin;this.els.theme.value=this.settings.theme;this.els.limitInput.value=String(this.settings.limitKmh);this.els.mirror.checked=this.settings.mirrorHud;this.els.sceneMotion.checked=this.settings.sceneMotion;this.els.sceneQuality.value=this.settings.sceneQuality;this.els.formError.hidden=true;this.els.dialog.showModal();}
 setHud(enabled){this.hud=!!enabled;this.els.hudLayer.hidden=!this.hud;this.els.hud.setAttribute('aria-pressed',String(this.hud));this.els.mode.value=this.hud?'hud':this.settings.skin==='airforce'?'airforce':'pfd';this.renderText();this.command('display:change',{mode:this.hud?'hud':'pfd'});this.syncAnimation();}
 calibrate(){if(!finite(this.data.pitchDeg)||!finite(this.data.rollDeg)){this.notify('기울기 센서 입력이 없습니다. 앱의 자세 데이터에 연결하세요.');this.command('attitude:request');return false;}this.calibration={pitch:this.data.pitchDeg,roll:this.data.rollDeg};this.animate();this.command('attitude:calibrate',{...this.calibration});this.notify('현재 기기 자세를 수평 기준으로 맞췄습니다.');return true;}
 useDemo(){this.stopGps(false);this.stopDemo();this.updateTelemetry(sample());}
 toggleDemo(){if(this.playing){this.stopDemo();return false;}this.useDemo();this.playing=true;this.demoStart=performance.now();this.demoPrevious=this.demoStart;this.demoTimer=setInterval(()=>{if(document.hidden)return;const now=performance.now(),t=(now-this.demoStart)/1000,dt=(now-this.demoPrevious)/1000;this.demoPrevious=now;const speed=72+Math.sin(t*.4)*13+Math.sin(t*.14)*8;this.updateTelemetry({source:'demo',speedKmh:speed,altitudeM:10+Math.sin(t*.14)*6,headingDeg:t*3,pitchDeg:Math.sin(t*.32)*3,rollDeg:Math.sin(t*.22)*11,distanceKm:this.data.distanceKm+speed/3.6*dt/1000,durationSeconds:this.data.durationSeconds+dt,maxSpeedKmh:Math.max(this.data.maxSpeedKmh,speed),fixValid:true});},250);return true;}
 stopDemo(){if(this.demoTimer!==null)clearInterval(this.demoTimer);this.demoTimer=null;this.playing=false;}
 startGps(){
  this.stopDemo();this.trip.reset();this.updateTelemetry({...initial(),source:'gps',timestampMs:Date.now()});
  if(this.native&&typeof this.native.startGps==='function'){this.nativeGpsRequested=true;try{this.native.startGps();this.command('gps:start');}catch(_){this.reportGpsError('앱의 GPS 연결을 확인하세요.');}this.renderText();return;}
  if(!global.isSecureContext||!navigator.geolocation){this.reportGpsError('실제 GPS는 HTTPS 또는 localhost에서 사용하세요. 기존 앱에서는 위치 데이터 함수를 연결하면 됩니다.');return;}
  try{this.watchId=navigator.geolocation.watchPosition(pos=>{const c=pos.coords,speed=finite(c.speed)?Math.max(0,c.speed*3.6):null;const metrics=this.trip.feed({latitude:c.latitude,longitude:c.longitude,accuracy:c.accuracy,timestamp:pos.timestamp},speed);this.updateTelemetry({source:'gps',speedKmh:speed,altitudeM:finite(c.altitude)?c.altitude:null,headingDeg:finite(c.heading)?c.heading:null,accuracyM:finite(c.accuracy)?c.accuracy:null,pitchDeg:null,rollDeg:null,satellitesUsed:null,satellitesVisible:null,timestampMs:pos.timestamp,fixValid:true,...metrics});},error=>this.reportGpsError(error.code===1?'위치 권한이 허용되지 않았습니다.':error.code===3?'GPS 응답 시간이 초과되었습니다.':'위치 정보를 읽을 수 없습니다.'),{enableHighAccuracy:true,maximumAge:0,timeout:15000});this.command('gps:start');this.renderText();}catch(_){this.reportGpsError('이 환경에서는 위치 정보를 시작할 수 없습니다.');}
 }
 stopGps(clear=true){if(this.watchId!==null&&navigator.geolocation)navigator.geolocation.clearWatch(this.watchId);this.watchId=null;if(this.nativeGpsRequested&&this.native&&typeof this.native.stopGps==='function'){try{this.native.stopGps();}catch(_){}}this.nativeGpsRequested=false;if(clear&&!this.disposed){this.updateTelemetry({...initial()});this.command('gps:stop');}}
 reportGpsError(text){this.stopGps(false);if(this.data.source==='gps')this.updateTelemetry({fixValid:false,speedKmh:null,altitudeM:null,headingDeg:null,accuracyM:null},{touchTimestamp:false});this.notify(text);this.els.status.textContent=text;this.command('gps:error',{message:text});}
 renderText(){
  const d=this.data,e=this.effective(),v=e.valid;let signal=d.source==='demo'?'DEMO':d.source==='none'?'GPS OFF':e.stale?'DATA LOST':v?(d.source==='gps'?'GPS LIVE':'APP DATA'):'GPS WAIT';
  this.els.signalText.textContent=signal;this.els.signal.dataset.live=String(v&&d.source!=='demo');this.els.source.textContent=d.source==='demo'?'GPS / DEMO':d.source==='external'?'APP / GPS':'GPS';
  const h=v&&finite(d.headingDeg)?String(Math.round(bearing(d.headingDeg))%360).padStart(3,'0'):null;
  this.els.track.textContent='TRK '+(h?h+'°':'—');
  this.els.max.textContent=finite(d.maxSpeedKmh)?String(Math.round(d.maxSpeedKmh)):'—';this.els.avg.textContent=finite(d.avgSpeedKmh)?String(Math.round(d.avgSpeedKmh)):'—';this.els.distance.textContent=finite(d.distanceKm)?d.distanceKm.toFixed(1):'—';this.els.duration.textContent=finite(d.durationSeconds)?formatTime(d.durationSeconds):'—';
  this.els.altitude.textContent=v&&finite(d.altitudeM)?String(Math.round(d.altitudeM)):'—';this.els.accuracy.textContent=v&&finite(d.accuracyM)?'±'+Math.round(d.accuracyM):'—';this.els.satellites.textContent=v&&finite(d.satellitesUsed)?'위성 '+Math.round(d.satellitesUsed)+(finite(d.satellitesVisible)?'/'+Math.round(d.satellitesVisible):''):'위성 —';
  this.els.hudSpeed.textContent=v&&finite(d.speedKmh)?String(Math.round(d.speedKmh)):'—';this.els.hudHeading.textContent=h?h+'° '+cardinal(d.headingDeg):'—';this.els.hudCaption.textContent=signal;this.els.hudLayer.classList.toggle('mirrored',this.settings.mirrorHud);
  this.els.limit.textContent=this.settings.limitKmh?'LIM '+this.settings.limitKmh:'LIM OFF';this.els.limit.dataset.active=String(this.settings.limitKmh>0);
  const requested=this.watchId!==null||!!this.nativeGpsRequested;this.els.gps.setAttribute('aria-pressed',String(requested));this.els.gpsText.textContent=requested?'GPS 끄기':'GPS 켜기';this.els.themeText.textContent='테마 '+({auto:'자동',day:'주간',night:'야간'}[this.settings.theme]);
  this.els.status.textContent=d.source==='demo'?'시연 모드 · 표시된 주행 값과 자세는 예시입니다.':e.stale?'데이터가 15초 이상 갱신되지 않았습니다. 연결을 확인하세요.':v?(finite(d.pitchDeg)&&finite(d.rollDeg)?'GPS / 앱 데이터 수신 중':'GPS 수신 중 · 자세 센서 입력 없음'):'GPS 또는 앱 데이터 연결을 기다립니다.';
  this.canvas.setAttribute('aria-label','속도 '+this.els.hudSpeed.textContent+' km/h, 고도 '+this.els.altitude.textContent+' m, 방위 '+(h||'미확인')+', '+signal);
 }
 resize(){const r=this.els.canvasWrap.getBoundingClientRect();this.viewportVisible=r.width>=1&&r.height>=1;if(!this.viewportVisible){this.syncAnimation();return;}this.width=r.width;this.height=r.height;const ratio=Math.min(global.devicePixelRatio||1,2);this.canvas.width=Math.round(r.width*ratio);this.canvas.height=Math.round(r.height*ratio);this.ctx.setTransform(ratio,0,0,ratio,0,0);this.draw();this.syncAnimation();}
 animate(){
  const start={...this.display},target={};for(const key of Object.keys(start))target[key]=finite(this.data[key])?this.data[key]:0;
  this.transition={start,target,begin:performance.now(),duration:this.reduced.matches?0:300};this.syncAnimation();
 }
 sceneSpeed(){return this.effective().valid&&finite(this.data.speedKmh)?clamp(this.display.speedKmh,0,320):0;}
 canRender(){return !this.disposed&&!document.hidden&&!this.els.content.hidden&&!this.hud&&this.onScreen&&this.viewportVisible;}
 sceneMoving(){return this.settings.sceneMotion&&!this.reduced.matches&&this.sceneSpeed()>.05;}
 syncAnimation(){
  if(!this.canRender()||(!this.transition&&!this.sceneMoving())){if(this.frame!==null)cancelAnimationFrame(this.frame);this.frame=null;this.lastSceneTime=null;return;}
  if(this.frame===null)this.frame=requestAnimationFrame(now=>this.renderFrame(now));
 }
 renderFrame(now){
  this.frame=null;if(!this.canRender()){this.lastSceneTime=null;return;}
  const fps=this.settings.sceneQuality==='balanced'?30:60,minInterval=1000/fps;
  if(this.lastSceneTime!==null&&now-this.lastSceneTime<minInterval-.75){this.syncAnimation();return;}
  const dt=this.lastSceneTime===null?0:Math.min((now-this.lastSceneTime)/1000,.1);this.lastSceneTime=now;
  if(this.transition){const {start,target,begin,duration}=this.transition,p=duration?clamp((now-begin)/duration,0,1):1,q=1-(1-p)**3;for(const key of Object.keys(start))this.display[key]=key==='headingDeg'?bearing(start[key]+angleDelta(start[key],target[key])*q):start[key]+(target[key]-start[key])*q;if(p>=1)this.transition=null;}
  if(this.sceneMoving())this.scene.advance(dt,this.sceneSpeed());this.draw();this.syncAnimation();
 }
 getVisualState(){return {distanceMeters:this.scene.distanceMeters,speedKmh:this.sceneSpeed(),moving:this.canRender()&&this.sceneMoving(),theme:this.day?'day':'night',quality:this.settings.sceneQuality,frameCount:this.scene.drawCount,pendingFrame:this.frame!==null};}

 draw(){
  if(!this.width||this.disposed||this.els.content.hidden)return;const c=this.ctx,w=this.width,h=this.height;const compassH=clamp(h*.145,43,66),fh=h-compassH;const tape=clamp(w*.12,67,175),left=tape,right=w-tape,center=w/2,cy=fh*.53;const valid=this.effective().valid;
  c.clearRect(0,0,w,h);c.fillStyle='#030805';c.fillRect(0,0,w,h);this.drawHorizon(c,left,0,right-left,fh,valid);this.drawTape(c,0,0,tape,fh,'speed',valid?this.display.speedKmh:null,valid&&finite(this.data.speedKmh));this.drawTape(c,right,0,tape,fh,'altitude',valid?this.display.altitudeM:null,valid&&finite(this.data.altitudeM));this.drawCompass(c,0,fh,w,compassH,valid&&finite(this.data.headingDeg)?this.display.headingDeg:null);
  c.strokeStyle='#526746';c.lineWidth=1;c.beginPath();c.moveTo(left+.5,0);c.lineTo(left+.5,fh);c.moveTo(right-.5,0);c.lineTo(right-.5,fh);c.stroke();
 }
 drawHorizon(c,x,y,w,h,valid){
  const af=this.settings.skin==='airforce',cx=x+w/2,cy=h*.53,attitude=finite(this.data.pitchDeg)&&finite(this.data.rollDeg),pitch=attitude?this.display.pitchDeg-this.calibration.pitch:0,roll=attitude?this.display.rollDeg-this.calibration.roll:0;const ppd=h/58;
  c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.translate(cx,cy);c.rotate(-roll*Math.PI/180);c.translate(0,pitch*ppd);
  let g=c.createLinearGradient(0,-h,0,0);g.addColorStop(0,this.day?'#15548d':'#020615');g.addColorStop(1,this.day?'#75bae0':'#14273f');c.fillStyle=g;c.fillRect(-w*2,-h*3,w*4,h*3);
  g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,this.day?'#62613b':'#08121e');g.addColorStop(1,this.day?'#29351d':'#02060b');c.fillStyle=g;c.fillRect(-w*2,0,w*4,h*3);
  this.scene.drawSky(c,w,h,!this.day,this.settings.sceneQuality);
  c.strokeStyle=this.day?'#a9bd7c34':'#6586aa15';c.lineWidth=.7;
  for(let n=-12;n<=12;n++){c.beginPath();c.moveTo(n*13,0);c.lineTo(n*w*.19,h*2);c.stroke();}
  const groundPhase=wrap(this.scene.distanceMeters*.008,1);
  for(let i=0;i<=13;i++){const gy=((i+groundPhase)/13)**2*h*1.8;c.beginPath();c.moveTo(-w*2,gy);c.lineTo(w*2,gy);c.stroke();}
  // Fixed synthetic terrain decoration; never represented as measured terrain.
  for(let layer=0;layer<3;layer++){c.strokeStyle=this.day?(layer===0?'#8bb5b344':'#a9bd7e1a'):'#7286b01c';c.beginPath();for(let i=0;i<=70;i++){const gx=-w/2+i*w/70,noise=Math.sin(i*.67+layer*2)*Math.sin(i*.21+layer)+Math.sin(i*.36+layer);const gy=layer===0?-Math.abs(noise)*h*.035:30+layer*34+Math.abs(noise)*h*.06;if(i===0)c.moveTo(gx,gy);else c.lineTo(gx,gy);}c.stroke();}
  this.scene.drawGround(c,w,h,!this.day,this.sceneMoving()?this.sceneSpeed():0,this.settings.sceneQuality);
  c.strokeStyle=af?'#9ff39b':this.day?'#f4f0d9':'#a4b4c7';c.lineWidth=1.5;c.beginPath();c.moveTo(-w*2,0);c.lineTo(w*2,0);c.stroke();
  c.font='600 '+clamp(w*.024,11,20)+'px Arial';c.textBaseline='middle';c.fillStyle=af?'#adffa4':'#edf2e6';c.strokeStyle=af?'#9ef69af0':'#edf2e6dc';c.lineWidth=1.4;
  for(let a=-25;a<=25;a+=5){if(a===0)continue;const py=-a*ppd,len=a%10===0?w*.24:w*.115;c.beginPath();c.moveTo(-len/2,py);c.lineTo(len/2,py);c.stroke();if(a%10===0){c.textAlign='right';c.fillText(String(Math.abs(a)),-len/2-12,py);c.textAlign='left';c.fillText(String(Math.abs(a)),len/2+12,py);}}
  c.restore();
  // Bank scale and fixed aircraft datum stay stationary.
  const radius=Math.min(w*.35,h*.74),arcY=radius+18;c.save();c.beginPath();c.rect(x,0,w,h);c.clip();c.strokeStyle=af?'#a3fa9e':'#e6f0e5';c.lineWidth=1.5;c.beginPath();c.arc(cx,arcY,radius,-Math.PI*2/3,-Math.PI/3);c.stroke();for(const deg of [-60,-45,-30,-20,-10,0,10,20,30,45,60]){const a=(deg*.5-90)*Math.PI/180,l=deg%30===0?12:7;c.beginPath();c.moveTo(cx+Math.cos(a)*radius,arcY+Math.sin(a)*radius);c.lineTo(cx+Math.cos(a)*(radius+l),arcY+Math.sin(a)*(radius+l));c.stroke();}
  const bankAngle=clamp(roll,-60,60)*.5*Math.PI/180;
  this.triangle(c,cx+Math.sin(bankAngle)*radius,arcY-Math.cos(bankAngle)*radius-11,7,10,af?'#c2ffb5':'#f1f6e8',true);this.triangle(c,cx,35,7,10,af?'#a6ff99':'#ffd15a',false);
  const span=Math.min(w*.125,107),notch=Math.min(span*.46,39);c.lineCap='square';c.lineJoin='miter';c.strokeStyle=af?'#001306':'#12170b';c.lineWidth=8;c.beginPath();c.moveTo(cx-span,cy);c.lineTo(cx-notch,cy);c.lineTo(cx-notch,cy+27);c.moveTo(cx+span,cy);c.lineTo(cx+notch,cy);c.lineTo(cx+notch,cy+27);c.stroke();c.strokeStyle=af?'#acff9e':'#ffd76c';c.lineWidth=4;c.stroke();c.fillStyle='#10170a';c.fillRect(cx-6,cy-6,12,12);c.fillStyle=af?'#bdffaf':'#ffdb72';c.fillRect(cx-3.5,cy-3.5,7,7);
  c.fillStyle='#d0e2c09c';c.font='9px monospace';c.textAlign='left';c.fillText(attitude?(this.data.source==='demo'?'ATT DEMO':'ATT DATA'):'ATT —',x+13,h-16);c.textAlign='right';c.fillStyle='#c1cba07a';c.fillText('SYNTHETIC VIEW',x+w-12,h-16);c.restore();
 }
 triangle(c,x,y,w,h,color,down){c.fillStyle=color;c.beginPath();c.moveTo(x-w,y);c.lineTo(x+w,y);c.lineTo(x,y+(down?h:-h));c.closePath();c.fill();}
 drawTape(c,x,y,w,h,kind,value,known){
  const af=this.settings.skin==='airforce',isSpeed=kind==='speed',cy=h*.53;let g=c.createLinearGradient(x,0,x+w,0);g.addColorStop(0,af?'#03140d':'#111e14');g.addColorStop(1,af?'#061e13':'#1b2a1b');c.fillStyle=g;c.fillRect(x,y,w,h);c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
  const edge=isSpeed?x+w:x,dir=isSpeed?-1:1,numberX=isSpeed?x+w-33:x+33;const px=h/(isSpeed?160:360),step=isSpeed?5:10,major=isSpeed?20:50;const val=known?value:0;
  if(known){const range=h/px/2+major;for(let n=Math.floor((val-range)/step)*step;n<=val+range;n+=step){if(isSpeed&&n<0)continue;const ty=cy-(n-val)*px;if(ty<30||ty>h-5)continue;const big=n%major===0;c.strokeStyle=af?(big?'#a5f39a':'#65965e'):(big?'#e5eddf':'#9aad92');c.lineWidth=big?1.5:1;c.beginPath();c.moveTo(edge+dir*2,ty);c.lineTo(edge+dir*(big?25:12),ty);c.stroke();if(big&&Math.abs(ty-cy)>clamp(h*.19,60,87)/2+13){c.font='600 '+clamp(w*.2,12,24)+'px Arial';c.fillStyle=af?'#b8ffa9':'#e8efdf';c.textAlign=isSpeed?'right':'left';c.textBaseline='middle';c.fillText(String(n),numberX,ty);}}}
  c.fillStyle='#b4f49f';c.font='700 '+clamp(w*.15,11,17)+'px Arial';c.textAlign='center';c.textBaseline='top';c.fillText(isSpeed?'GS':'ALT m',x+w/2,9);
  const boxH=clamp(h*.19,60,87),inset=3,tip=14;c.beginPath();if(isSpeed){c.moveTo(x+inset,cy-boxH/2);c.lineTo(x+w-tip,cy-boxH/2);c.lineTo(x+w,cy);c.lineTo(x+w-tip,cy+boxH/2);c.lineTo(x+inset,cy+boxH/2);}else{c.moveTo(x+w-inset,cy-boxH/2);c.lineTo(x+tip,cy-boxH/2);c.lineTo(x,cy);c.lineTo(x+tip,cy+boxH/2);c.lineTo(x+w-inset,cy+boxH/2);}c.closePath();c.fillStyle='#000603';c.fill();c.strokeStyle=af?'#a7fa98':'#e1e8d7';c.lineWidth=1.5;c.stroke();
  const warn=isSpeed&&known&&this.settings.limitKmh>0&&value>this.settings.limitKmh;c.fillStyle=warn?'#ffd16a':af?'#c6ffb6':isSpeed?'#f7fbef':'#b8f3a7';c.textAlign='center';c.textBaseline='middle';c.font='700 '+clamp(w*.4,27,58)+'px Arial';c.fillText(known?String(Math.round(value)):'—',x+w/2+(isSpeed?-3:3),cy-8);c.font='700 '+clamp(w*.14,10,18)+'px Arial';c.fillStyle=af?'#c0ffad':'#e4eddd';c.fillText(isSpeed?'km/h':'m',x+w/2+(isSpeed?-3:3),cy+boxH*.29);
  c.fillStyle=af?'#a9ff99':'#ffd15a';c.beginPath();c.moveTo(edge,cy);c.lineTo(edge+dir*12,cy-10);c.lineTo(edge+dir*12,cy+10);c.closePath();c.fill();c.restore();
 }
 drawCompass(c,x,y,w,h,value){const af=this.settings.skin==='airforce';c.fillStyle='#010603';c.fillRect(x,y,w,h);c.save();c.beginPath();c.rect(x,y,w,h);c.clip();const mid=w/2,ppd=w/140;if(value!==null){for(let n=Math.floor((value-75)/5)*5;n<=value+75;n+=5){const tx=mid+(n-value)*ppd,major=n%15===0;c.strokeStyle=af?(major?'#a4f398':'#6eb463'):(major?'#dbe8d0':'#9bad8e');c.lineWidth=major?1.6:1;c.beginPath();c.moveTo(tx,y+8);c.lineTo(tx,y+(major?24:16));c.stroke();if(n%30===0||bearing(n)%45===0){let text=String(Math.round(bearing(n))).padStart(3,'0');if(bearing(n)%90===0)text=cardinal(n);else if(bearing(n)%45===0)text=cardinal(n);c.fillStyle=af?'#b4fba7':'#d9e5cd';c.font='600 '+clamp(w*.012,10,16)+'px Arial';c.textAlign='center';c.fillText(text,tx,y+h-10);}}}
  const bw=clamp(w*.09,93,140),bh=Math.min(39,h-17);c.fillStyle='#020804';c.fillRect(mid-bw/2,y+h-bh-3,bw,bh);c.strokeStyle=af?'#a4fa98':'#e0e9d2';c.lineWidth=1.4;c.strokeRect(mid-bw/2,y+h-bh-3,bw,bh);c.font='700 '+clamp(w*.02,16,27)+'px Arial';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#b6f6a4';const rounded=value===null?null:Math.round(bearing(value))%360;c.fillText(rounded===null?'—':String(rounded).padStart(3,'0')+'° '+cardinal(value),mid,y+h-bh/2-3);this.triangle(c,mid,y+3,10,11,af?'#a8ff9a':'#ffcf60',true);c.restore();}
 destroy(){if(this.disposed)return;this.stopDemo();this.stopGps(false);clearInterval(this.healthTimer);clearTimeout(this.toastTimer);if(this.frame!==null)cancelAnimationFrame(this.frame);if(this.resizeObserver)this.resizeObserver.disconnect();if(this.intersectionObserver)this.intersectionObserver.disconnect();for(const [t,e,f]of this.events)t.removeEventListener(e,f);if(this.els.dialog.open)this.els.dialog.close();this.root.remove();this.disposed=true;}
}
global.DaesinnamPFD={version:'1.2.0',mount:(container,options)=>new PfdPanel(container,options),utils:{bearing,angleDelta,formatTime,haversine},TripTracker};
})(window);

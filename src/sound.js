/* Звуковая атмосфера: всё синтезируется кодом (WebAudio), без файлов.
   Слои выбираются по миру и напряжению: ветер, дождь, вода, треск огня, гул/дрон,
   тревожный тон, сердцебиение, гром. Выходит и в динамик, и в запись видео. */
(function(root){
'use strict';
let ac=null,master=null,dest=null,nbuf=null,L={},timer=0,cfg={lvl:0,rain:0,wind:0,water:0,fire:0,drone:0,hum:0},cur={lvl:0},enabled=true,lastBeat=0,lastCrack=0,lastThunder=0;
function noise(){const b=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate),d=b.getChannelData(0);let l=0;for(let i=0;i<d.length;i++){const w=Math.random()*2-1;l=(l+.02*w)/1.02;d[i]=w*.5+l*3}return b}
function layer(type,freq,q,lfoRate,lfoDepth){
  const s=ac.createBufferSource();s.buffer=nbuf;s.loop=true;
  const f=ac.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q||.7;
  const g=ac.createGain();g.gain.value=0;s.connect(f);f.connect(g);g.connect(master);s.start();
  if(lfoRate){const o=ac.createOscillator(),og=ac.createGain();o.frequency.value=lfoRate;og.gain.value=lfoDepth;o.connect(og);og.connect(f.frequency);o.start()}
  return g;
}
function init(){
  if(ac){if(ac.state==='suspended')ac.resume();return true}
  const C=root.AudioContext||root.webkitAudioContext;if(!C)return false;
  try{ac=new C()}catch(e){return false}
  master=ac.createGain();master.gain.value=.55;master.connect(ac.destination);
  try{dest=ac.createMediaStreamDestination();master.connect(dest)}catch(e){dest=null}
  nbuf=noise();
  L.wind=layer('bandpass',420,.6,.13,180);L.rain=layer('highpass',2600,.5);L.water=layer('lowpass',520,.5,.11,160);L.fire=layer('bandpass',1800,.8);
  // дрон: две расстроенные пилы
  const dg=ac.createGain();dg.gain.value=0;const df=ac.createBiquadFilter();df.type='lowpass';df.frequency.value=240;
  [55,55.7,82.4].forEach(fr=>{const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=fr;o.connect(df);o.start()});
  df.connect(dg);dg.connect(master);L.drone=dg;
  // тревожный тон с тремоло
  const tg=ac.createGain();tg.gain.value=0;const to=ac.createOscillator();to.type='sine';to.frequency.value=233;const tt=ac.createOscillator(),ttg=ac.createGain();tt.frequency.value=5.5;ttg.gain.value=.5;tt.connect(ttg);const am=ac.createGain();am.gain.value=.5;ttg.connect(am.gain);to.connect(am);am.connect(tg);tg.connect(master);to.start();tt.start();L.tone=tg;L.toneOsc=to;
  timer=setInterval(tick,90);
  return true;
}
function set(g,v,tc){if(g)g.gain.setTargetAtTime(v,ac.currentTime,tc||.6)}
function thump(t0,f0,vol,len){const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(f0,t0);o.frequency.exponentialRampToValueAtTime(40,t0+len);g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(.001,t0+len);o.connect(g);g.connect(master);o.start(t0);o.stop(t0+len+.05)}
function burst(t0,fr,vol,len,type){const s=ac.createBufferSource();s.buffer=nbuf;const f=ac.createBiquadFilter();f.type=type||'bandpass';f.frequency.value=fr;const g=ac.createGain();g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(.001,t0+len);s.connect(f);f.connect(g);g.connect(master);s.start(t0,Math.random());s.stop(t0+len+.05)}
function tick(){
  if(!ac||!enabled)return;const now=ac.currentTime;
  cur.lvl+=(cfg.lvl-cur.lvl)*.15;
  // сердцебиение при напряжении
  if(cur.lvl>.35){const bpm=60+cur.lvl*85,gap=60/bpm;if(now-lastBeat>gap){lastBeat=now;const v=.18+cur.lvl*.3;thump(now,70,v,.22);thump(now+.17,60,v*.7,.2)}}
  // треск огня
  if(cfg.fire>0&&now-lastCrack>.08+Math.random()*.25){lastCrack=now;burst(now,1500+Math.random()*3000,cfg.fire*.7,.04+Math.random()*.05)}
  if(L.toneOsc)L.toneOsc.frequency.setTargetAtTime(200+cur.lvl*260,now,.5);
}
function scene(sc,info){
  if(!init())return;if(!enabled)return;
  const f=(info&&info.feats)||[],fx=(info&&info.fx)||'none',lvl=sc.level||0,dark=(info&&info.dark)||0;
  const has=k=>f.slice(0,3).includes(k);
  cfg.lvl=lvl;
  set(L.rain,fx==='rain'||/поток|ливень/.test(sc.threatName||'')?.2:0);
  set(L.wind,(has('hills')||has('ice')||has('water')?.13:.06)+(sc.level>.7?.05:0)+(has('interior')?-.04:0));
  set(L.water,has('water')?.14:0);
  cfg.fire=(fx==='embers'||has('fire')||sc.threatName&&/пожар|огон/.test(sc.threatName))?.16:0;set(L.fire,cfg.fire?.07:0);
  set(L.drone,(has('space')||has('interior')||dark>.5)?.075+lvl*.05:.025+lvl*.04,.8);
  set(L.tone,lvl>.3?(lvl-.3)*.09:0,.8);
  // «стингер» в начале сцены: низкий удар для важных событий
  if(['incite','twist','finale','chase'].includes(sc.kind)){thump(ac.currentTime+.05,95,.5,.7);burst(ac.currentTime+.05,300,.25,.5,'lowpass')}
}
function thunder(){if(!ac||!enabled)return;const n=ac.currentTime;if(n-lastThunder<2)return;lastThunder=n;burst(n+.05,160,.7,1.8,'lowpass');thump(n+.05,60,.5,1)}
function stop(){if(!ac)return;['wind','rain','water','fire','drone','tone'].forEach(k=>set(L[k],0,.2));cfg.lvl=0}
function setEnabled(v){enabled=!!v;if(!ac)return;if(!v)stop();master.gain.setTargetAtTime(v?.55:0,ac.currentTime,.1)}
root.Sound={init,scene,thunder,stop,setEnabled,get dest(){return dest},get on(){return !!ac}};
})(typeof window!=='undefined'?window:globalThis);

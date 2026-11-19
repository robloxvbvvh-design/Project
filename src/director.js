/* ============================================================
   Режиссёр-визуализатор: собственный видео-движок без шаблонных сцен.
   Из смысла сюжета (мир, место, угроза, предметы, напряжение, кто говорит)
   он СТРОИТ кадр процедурно:
   - среда: слои рельефа/зданий/леса/воды/тоннелей рождаются из слов онтологии мира;
   - предметы и угроза рисуются процедурными силуэтами по смыслу слова;
   - свет: источники света (фонарь, огонь), туман, вспышки, цветокоррекция от напряжения;
   - камера: сама выбирает план по тому, кто говорит, и подъезжает/отъезжает от напряжения.
   ============================================================ */
(function(root){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*(3-2*t);
function rng(seed){let a=seed>>>0||1;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const hexRgb=h=>{h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]};
const rgb=(c,a)=>a===undefined?`rgb(${c[0]|0},${c[1]|0},${c[2]|0})`:`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
const mix=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
const BLACK=[0,0,0],WHITE=[255,255,255];

/* ---------- смысл слов -> особенности среды ---------- */
const FEATS={
 city:/город|мегаполис|небоскр|район|улиц|банк|вокзал|площад|многоэтаж|переул|рынок|двор|подъезд|гараж|мост|городок|дом/,
 forest:/лес|роща|джунгл|бамбук|пальм|поляна|чащ|папоротник/,
 hills:/гор|холм|каньон|перевал|склон|овраг|бархан|скал|пустош|ферма|поле/,
 water:/остров|берег|море|фьорд|палуб|галеон|причал|поток|рек|болот|дно|подводн|глубоковод|прибой|бак|драккар/,
 space:/орбит|космич|шлюз|реактор|модул|станц/,
 interior:/бункер|особняк|холл|библиотек|коридор|лабиринт|тоннел|метро|подвал|каюта|зал|склад|гробниц|камер|подземел|отсек|трюм|академ|арена|генератор|контор|хранилищ|вестибюл/,
 ice:/поляр|снеж|ледян|лёд|льд|ледник|арктик/,
 fire:/пожар|горящ|огонь|метеор|пепел|вулкан/
};
function features(w,gn){
  const bag=[gn&&gn.n||'',w?[w.P.ph].concat(w.sp.map(x=>x.ph),w.hz.map(x=>x.ph),[w.G.ph,w.T.ph]).join(' '):''].join(' ').toLowerCase();
  const sc={};for(const k in FEATS){const m=bag.match(new RegExp(FEATS[k].source,'g'));sc[k]=m?m.length:0}
  if(gn&&gn.sk&&sc[gn.sk]!==undefined)sc[gn.sk]+=1.2;else if(gn&&gn.sk==='interior')sc.interior+=1.2;
  if(gn&&gn.fx==='snow')sc.ice+=1;if(gn&&gn.fx==='embers')sc.fire+=1;
  return Object.entries(sc).sort((a,b)=>b[1]-a[1]).filter(e=>e[1]>0).map(e=>e[0]);
}
/* предмет -> форма */
const SHAPES=[
 ['door',/дверь|ворота|замок|шлюз|люк/],['vehicle',/машин|джип|грузовик|автобус|вездеход|фургон|дрезин|гонщик/],['boat',/лодк|драккар|галеон|плот|корабл/],
 ['barrel',/бочк|канистр|баллон|контейнер|ящик|аккумулятор|батаре|запас|консерв|корзин|мешок/],['lamp',/фонар|свеч|факел|лампа|столб|маяк|прожектор|луч|светящ|сигнал/],
 ['tree',/дерев|пальм|дуб|куст|пень|роща|ствол/],['rock',/камен|обвал|завал|глыб|риф|плит|валун|осыпь|бархан|занос|надгробие|статуя|колонн/],
 ['bridge',/мост|лестниц/],['barrier',/стен|сетк|кордон|ограждени|пост|блок/],['blade',/меч|топор|кол|клинок|кирка|гарпун|копь|сабл|сюрикен|нож|ледоруб/],
 ['paper',/книг|дневник|карт|свиток|блокнот|фото|чертёж|паспорт|записн/],['key',/ключ|отмычк|монтировк|отвёртк|гаечн/],['mask',/маск|шлем|противогаз|скафандр|плащ|куртк|костюм|жилет/],
 ['screen',/терминал|компьютер|сервер|рация|приёмник|телефон|радио|камер/],['table',/стол|шкаф|стеллаж|автомат|киоск|ларёк|стог/]
];
function shapeOf(name,seed){const n=(name||'').toLowerCase();for(const [k,re] of SHAPES)if(re.test(n))return k;return['crate','rock','barrel'][seed%3]}
/* угроза -> облик */
function threatLook(name,kind){
  const n=(name||'').toLowerCase();
  if(kind==='f'){if(/буря|метеорит|шторм/.test(n))return 'storm';if(/поток|вод/.test(n))return 'wave';if(/пожар|огонь/.test(n))return 'fire';return 'knock'}
  if(/робот|компьютер|кибер|искусств/.test(n))return 'robot';
  if(/призрак|мумия|тень|вампир/.test(n))return 'ghost';
  if(/дракон/.test(n))return 'dragon';
  if(/чудовищ|тираннозавр|монстр/.test(n))return 'beast';
  if(/пришелец/.test(n))return 'alien';
  return 'human';
}

/* ---------- процедурные слои ---------- */
function ridge(r,n,rough,amp){ // смещение средней точки
  const a=new Array(n+1).fill(0);a[0]=r()*.5;a[n]=r()*.5;
  (function sub(l,h,d){if(h-l<2)return;const m=(l+h)>>1;a[m]=(a[l]+a[h])/2+(r()-.5)*d;sub(l,m,d*rough);sub(m,h,d*rough)})(0,n,amp);
  return a;
}
function buildLayer(type,r,depth){
  const L={type,depth};
  if(type==='skyline'){L.b=[];let x=-.4;while(x<1.8){const w=.03+r()*.07,h=(.08+r()*.24*(1+depth))*(depth>.7?.45:1);L.b.push({x,w,h,roof:r()<.25?1:r()<.15?2:0,win:Array.from({length:18},()=>r())});x+=w*(.85+r()*.2)}}
  else if(type==='forest'){L.t=[];let x=-.4;while(x<1.8){L.t.push({x,h:(.1+r()*.22)*(depth>.7?.5:1),w:.04+r()*.05,pine:r()<.6});x+=.025+r()*.04}}
  else if(type==='hills'||type==='dunes'||type==='ice'){L.a=ridge(r,64,type==='ice'?.78:.55,type==='ice'?.5:.35);L.sharp=type==='ice'}
  else if(type==='tunnel'){L.arc=[];let x=-.4;while(x<1.8){L.arc.push({x,w:.14+r()*.05,pipe:r()<.5?r():-1});x+=.2}}
  else if(type==='space'){L.pl=[{x:.2+r()*.2,y:.3+r()*.2,s:.06+r()*.08,c:r()},{x:.7+r()*.2,y:.2+r()*.2,s:.025+r()*.03,c:r()}]}
  else if(type==='water'){L.w=r()}
  else if(type==='fire'){L.a=ridge(r,64,.6,.3);L.f=Array.from({length:14},()=>({x:r(),h:.05+r()*.12,ph:r()*6}))}
  return L;
}
function drawLayer(x,L,cam,W,H,S,gY,col,t,dark){
  const off=-cam*L.depth,Wd=W*1.5;
  x.fillStyle=col;
  if(L.type==='skyline'){
    for(const b of L.b){const bx=b.x*W+off,bw=b.w*W,bh=b.h*H;if(bx>W*1.3||bx+bw<-W*.3)continue;
      x.fillRect(bx,gY-bh,bw,bh+2);
      if(b.roof===1){x.fillRect(bx+bw*.45,gY-bh-bh*.18,bw*.06,bh*.18)}else if(b.roof===2){x.beginPath();x.moveTo(bx,gY-bh);x.lineTo(bx+bw/2,gY-bh-bw*.35);x.lineTo(bx+bw,gY-bh);x.fill()}
      if(L.depth>.3&&dark>.1){x.fillStyle='rgba(255,215,120,.7)';const cols=Math.max(2,Math.floor(bw/(14*S))),rows=Math.max(2,Math.floor(bh/(22*S)));
        for(let j=0;j<Math.min(18,cols*rows);j++){if(b.win[j]>.5&&Math.sin(t*.6+j*2.7+b.x*30)>-.7)x.fillRect(bx+6*S+(j%cols)*(bw-12*S)/cols,gY-bh+10*S+((j/cols)|0)*22*S,Math.max(3,(bw-12*S)/cols*.55),9*S)}x.fillStyle=col}}
  }else if(L.type==='forest'){
    for(const tr of L.t){const bx=tr.x*W+off,bh=tr.h*H,bw=tr.w*W;if(bx>W*1.3||bx<-W*.3)continue;
      if(tr.pine){x.beginPath();for(let k=0;k<3;k++){const yy=gY-bh*(k*.28);x.moveTo(bx-bw*(1-k*.22),yy);x.lineTo(bx,yy-bh*.5);x.lineTo(bx+bw*(1-k*.22),yy)}x.fill();x.fillRect(bx-3*S,gY-bh*.1,6*S,bh*.1)}
      else{x.fillRect(bx-4*S,gY-bh*.5,8*S,bh*.5);x.beginPath();x.arc(bx,gY-bh*.6,bw*.9,0,7);x.arc(bx-bw*.5,gY-bh*.45,bw*.6,0,7);x.arc(bx+bw*.5,gY-bh*.45,bw*.6,0,7);x.fill()}}
  }else if(L.type==='hills'||L.type==='dunes'||L.type==='ice'||L.type==='fire'){
    const n=L.a.length-1,amp=(L.type==='dunes'?.12:.2)*H*(L.depth>.7?.28:1);x.beginPath();x.moveTo(-W*.3,gY+2);
    for(let i=0;i<=n;i++){const px=-W*.3+(i/n)*Wd*1.4+off;let v=L.a[i];if(L.sharp)v=Math.abs(v)*1.4;x.lineTo(px,gY-(.03*H+Math.abs(v)*amp*(L.depth<.3?1:1.4)))}
    x.lineTo(W*1.4,gY+2);x.fill();
    if(L.type==='fire'){for(const f of L.f){const fx=f.x*W*1.3+off,fh=f.h*H*(1+.4*Math.sin(t*6+f.ph));const g=x.createLinearGradient(0,gY-fh,0,gY);g.addColorStop(0,'rgba(255,200,60,0)');g.addColorStop(1,'rgba(255,90,20,.75)');x.fillStyle=g;x.beginPath();x.moveTo(fx-12*S,gY);x.quadraticCurveTo(fx,gY-fh*1.2,fx+12*S,gY);x.fill()}x.fillStyle=col}
  }else if(L.type==='tunnel'){
    for(const a of L.arc){const ax=a.x*W+off,aw=a.w*W;x.beginPath();x.moveTo(ax,gY);x.lineTo(ax,gY-H*.38);x.quadraticCurveTo(ax+aw/2,gY-H*.6,ax+aw,gY-H*.38);x.lineTo(ax+aw,gY);x.lineTo(ax+aw-aw*.12,gY);x.lineTo(ax+aw-aw*.12,gY-H*.36);x.quadraticCurveTo(ax+aw/2,gY-H*.54,ax+aw*.12,gY-H*.36);x.lineTo(ax+aw*.12,gY);x.fill();
      if(a.pipe>=0){x.fillRect(ax,gY-H*(.28+a.pipe*.08),aw,5*S)}}
    x.fillRect(-W*.3,0,Wd*1.6,H*.06)
  }else if(L.type==='space'){
    for(const p of L.pl){const px=p.x*W+off,py=p.y*gY;const g=x.createRadialGradient(px-p.s*W*.3,py-p.s*W*.3,p.s*W*.1,px,py,p.s*W);g.addColorStop(0,p.c>.5?'rgba(255,190,130,.85)':'rgba(140,180,255,.85)');g.addColorStop(1,'rgba(10,10,30,.9)');x.fillStyle=g;x.beginPath();x.arc(px,py,p.s*W,0,7);x.fill()}x.fillStyle=col;
    for(let k=0;k<5;k++){const bx=((k*.31)*W+off*1.6)%(W*1.4)-W*.2;x.fillRect(bx,gY-H*.22,10*S,H*.22);x.fillRect(bx-26*S,gY-H*.22,62*S,8*S)}
  }else if(L.type==='water'){
    x.fillRect(-W*.3,gY-3*S,Wd*1.4,4*S);
  }
}

/* ---------- процедурные предметы ---------- */
function drawProp(x,shape,px,py,sz,col,t,seed){
  x.save();x.translate(px,py);x.fillStyle=col;x.strokeStyle=col;x.lineCap='round';
  const s=sz;
  switch(shape){
   case 'door':x.fillRect(-s*.35,-s*1.5,s*.7,s*1.5);x.fillStyle='rgba(255,255,255,.12)';x.fillRect(-s*.3,-s*1.45,s*.6,s*.12);x.fillStyle='rgba(255,230,160,.8)';x.beginPath();x.arc(s*.2,-s*.7,s*.05,0,7);x.fill();break;
   case 'vehicle':x.fillRect(-s*1.1,-s*.55,s*2.2,s*.45);x.fillRect(-s*.6,-s*.95,s*1.15,s*.45);x.fillStyle='rgba(120,160,200,.35)';x.fillRect(-s*.5,-s*.88,s*.4,s*.3);x.fillRect(-s*.05,-s*.88,s*.4,s*.3);x.fillStyle='#050505';[-.65,.65].forEach(w=>{x.beginPath();x.arc(w*s,-s*.1,s*.22,0,7);x.fill()});break;
   case 'boat':x.beginPath();x.moveTo(-s*1.2,-s*.4);x.lineTo(s*1.2,-s*.4);x.lineTo(s*.8,0);x.lineTo(-s*.8,0);x.fill();x.fillRect(-s*.04,-s*1.5,s*.08,s*1.1);x.beginPath();x.moveTo(s*.05,-s*1.45);x.lineTo(s*.7,-s*.6);x.lineTo(s*.05,-s*.6);x.fill();break;
   case 'barrel':x.beginPath();x.moveTo(-s*.35,0);x.lineTo(-s*.4,-s*.55);x.lineTo(-s*.3,-s*1.0);x.lineTo(s*.3,-s*1.0);x.lineTo(s*.4,-s*.55);x.lineTo(s*.35,0);x.fill();x.fillStyle='rgba(255,255,255,.12)';x.fillRect(-s*.38,-s*.7,s*.76,s*.06);x.fillRect(-s*.38,-s*.3,s*.76,s*.06);break;
   case 'lamp':{x.fillRect(-s*.04,-s*1.8,s*.08,s*1.8);x.fillRect(-s*.2,-s*1.85,s*.4,s*.06);const fl=.75+.25*Math.sin(t*9+seed);const g=x.createRadialGradient(0,-s*1.75,0,0,-s*1.75,s*2.4);g.addColorStop(0,`rgba(255,220,140,${.6*fl})`);g.addColorStop(1,'rgba(255,200,100,0)');x.globalCompositeOperation='lighter';x.fillStyle=g;x.fillRect(-s*2.5,-s*4.2,s*5,s*5);x.globalCompositeOperation='source-over';x.fillStyle='rgba(255,240,200,.95)';x.beginPath();x.arc(0,-s*1.75,s*.09,0,7);x.fill();break}
   case 'tree':x.fillRect(-s*.07,-s*1.1,s*.14,s*1.1);x.beginPath();x.arc(0,-s*1.35,s*.55,0,7);x.arc(-s*.4,-s*1.1,s*.38,0,7);x.arc(s*.4,-s*1.1,s*.38,0,7);x.fill();break;
   case 'rock':x.beginPath();x.moveTo(-s*.7,0);x.lineTo(-s*.5,-s*.5);x.lineTo(-s*.1,-s*.8);x.lineTo(s*.3,-s*.6);x.lineTo(s*.7,0);x.fill();break;
   case 'bridge':x.fillRect(-s*1.2,-s*.5,s*2.4,s*.1);for(let k=-1;k<=1;k++)x.fillRect(k*s*.9-s*.04,-s*.5,s*.08,s*.5);break;
   case 'barrier':for(let k=-3;k<=3;k++){x.fillRect(k*s*.3-s*.03,-s*.9,s*.06,s*.9)}x.fillRect(-s*1,-s*.85,s*2,s*.08);x.fillRect(-s*1,-s*.45,s*2,s*.08);break;
   case 'blade':x.save();x.rotate(-.35);x.fillRect(-s*.04,-s*1.2,s*.08,s*1.2);x.fillRect(-s*.2,-s*.3,s*.4,s*.07);x.restore();break;
   case 'paper':x.save();x.rotate(-.15);x.fillStyle='rgba(235,225,190,.9)';x.fillRect(-s*.3,-s*.45,s*.6,s*.45);x.fillStyle='rgba(0,0,0,.35)';for(let k=0;k<4;k++)x.fillRect(-s*.24,-s*.4+k*s*.1,s*.48*(1-k*.1),s*.03);x.restore();break;
   case 'key':x.lineWidth=s*.07;x.beginPath();x.arc(-s*.2,-s*.4,s*.16,0,7);x.stroke();x.beginPath();x.moveTo(-s*.04,-s*.4);x.lineTo(s*.5,-s*.4);x.moveTo(s*.38,-s*.4);x.lineTo(s*.38,-s*.25);x.stroke();break;
   case 'mask':x.beginPath();x.ellipse(0,-s*.5,s*.3,s*.4,0,0,7);x.fill();x.fillStyle='rgba(0,0,0,.5)';x.fillRect(-s*.2,-s*.58,s*.14,s*.08);x.fillRect(s*.06,-s*.58,s*.14,s*.08);break;
   case 'screen':x.fillRect(-s*.5,-s*.75,s*1,s*.65);x.fillStyle='rgba(120,255,200,.55)';x.fillRect(-s*.42,-s*.68,s*.84,s*.5);x.fillStyle=col;x.fillRect(-s*.1,-s*.1,s*.2,s*.1);break;
   case 'table':x.fillRect(-s*.6,-s*.6,s*1.2,s*.08);x.fillRect(-s*.55,-s*.55,s*.07,s*.55);x.fillRect(s*.48,-s*.55,s*.07,s*.55);break;
   default:x.fillRect(-s*.45,-s*.8,s*.9,s*.8);x.fillStyle='rgba(255,255,255,.1)';x.fillRect(-s*.45,-s*.8,s*.9,s*.1);x.strokeStyle='rgba(0,0,0,.4)';x.lineWidth=s*.04;x.beginPath();x.moveTo(-s*.45,-s*.8);x.lineTo(s*.45,0);x.stroke();
  }
  x.restore();
}

/* ---------- процедурная угроза ---------- */
function drawThreat(x,look,tx,gy,S,t,i,eye,lvl){
  x.save();x.translate(tx,gy);const sz=S*(look==='dragon'||look==='beast'?1.5:1);
  const dark='rgba(8,6,12,.96)',glow=rgb(eye);
  const eyes=(ex,ey,sp)=>{x.globalCompositeOperation='lighter';const g=x.createRadialGradient(ex,ey,0,ex,ey,16*sz);g.addColorStop(0,glow);g.addColorStop(1,rgb(eye,0));x.fillStyle=g;x.fillRect(ex-16*sz,ey-16*sz,32*sz,32*sz);x.fillRect(ex+sp-16*sz,ey-16*sz,32*sz,32*sz);x.globalCompositeOperation='source-over';x.fillStyle='#fff';x.fillRect(ex-3*sz,ey-2*sz,6*sz,4*sz);x.fillRect(ex+sp-3*sz,ey-2*sz,6*sz,4*sz)};
  if(look==='human'||look==='alien'||look==='robot'||look==='ghost'){
    const sw=Math.sin(t*5+i*2)*14*sz,bob=Math.abs(Math.sin(t*5+i*2))*5*sz;
    if(look==='ghost'){x.globalAlpha=.75;x.fillStyle='rgba(190,200,230,.55)'}else x.fillStyle=dark;
    x.beginPath();x.moveTo(-26*sz,-bob);x.quadraticCurveTo(-30*sz,-120*sz,-14*sz,-150*sz);x.lineTo(14*sz,-150*sz);x.quadraticCurveTo(30*sz,-120*sz,26*sz,-bob);
    if(look==='ghost'){for(let k=0;k<5;k++)x.lineTo(26*sz-k*13*sz,-bob+(k%2?14:-6)*sz+Math.sin(t*4+k)*5*sz)}x.fill();
    if(look!=='ghost'){x.strokeStyle=dark;x.lineWidth=14*sz;x.lineCap='round';x.beginPath();x.moveTo(-8*sz,-80*sz);x.lineTo(-10*sz+sw,0);x.moveTo(8*sz,-80*sz);x.lineTo(10*sz-sw,0);x.stroke();x.lineWidth=11*sz;x.beginPath();x.moveTo(-22*sz,-130*sz);x.lineTo(-52*sz,-90*sz+sw);x.moveTo(22*sz,-130*sz);x.lineTo(-30*sz,-95*sz-sw);x.stroke()}
    x.fillStyle=look==='ghost'?'rgba(210,220,245,.7)':dark;x.beginPath();
    if(look==='alien'){x.ellipse(-4*sz,-176*sz,34*sz,42*sz,0,0,7)}else if(look==='robot'){x.fillRect(-26*sz,-196*sz,52*sz,44*sz)}else x.arc(-4*sz,-172*sz,28*sz,0,7);x.fill();
    eyes(-12*sz,-175*sz,16*sz);
    if(look==='robot'){x.fillStyle=dark;x.fillRect(-2*sz,-218*sz,4*sz,24*sz)}
    x.globalAlpha=1;
  }else if(look==='beast'||look==='dragon'){
    const m=Math.sin(t*3+i);x.fillStyle=dark;
    x.beginPath();x.ellipse(0,-90*sz,80*sz,46*sz,0,0,7);x.fill();
    x.beginPath();x.moveTo(-56*sz,-100*sz);x.lineTo(-140*sz,-120*sz+m*8*sz);x.lineTo(-56*sz,-70*sz);x.fill();
    x.beginPath();x.ellipse(-86*sz,-150*sz,36*sz,24*sz,-.3,0,7);x.fill();
    x.lineWidth=20*sz;x.lineCap='round';x.strokeStyle=dark;x.beginPath();x.moveTo(-30*sz,-60*sz);x.lineTo(-34*sz+m*18*sz,0);x.moveTo(36*sz,-60*sz);x.lineTo(40*sz-m*18*sz,0);x.stroke();
    if(look==='dragon'){x.beginPath();x.moveTo(10*sz,-120*sz);x.quadraticCurveTo(90*sz,-260*sz-m*20*sz,150*sz,-120*sz+m*10*sz);x.lineTo(60*sz,-110*sz);x.fill()}
    eyes(-98*sz,-152*sz,16*sz);
  }else if(look==='wave'){
    x.fillStyle='rgba(30,80,110,.78)';const h=(120+lvl*220)*sz;x.beginPath();x.moveTo(-260*sz,0);for(let k=-260;k<=140;k+=20)x.lineTo(k*sz,-h*(.55+.45*Math.sin(k*.03+t*3))+Math.sin(k*.1+t*5)*6*sz);x.lineTo(140*sz,0);x.fill();
  }else if(look==='fire'){
    for(let k=0;k<9;k++){const fh=(90+lvl*160+Math.sin(t*7+k)*30)*sz,fx=(k-4)*30*sz;const g=x.createLinearGradient(0,-fh,0,0);g.addColorStop(0,'rgba(255,230,120,0)');g.addColorStop(.5,'rgba(255,140,30,.8)');g.addColorStop(1,'rgba(200,40,10,.9)');x.fillStyle=g;x.beginPath();x.moveTo(fx-22*sz,0);x.quadraticCurveTo(fx+Math.sin(t*5+k)*10*sz,-fh,fx+22*sz,0);x.fill()}
  }else if(look==='storm'){
    for(let k=0;k<7;k++){x.fillStyle=`rgba(210,225,240,${.1+.07*k%.3})`;const a=t*(1.4+k*.2)+k;x.beginPath();x.ellipse(Math.cos(a)*40*sz-80*sz,-(60+k*26)*sz,(120-k*8)*sz,22*sz,0,0,7);x.fill()}
  }else{ // knock / meteor / неведомое
    x.fillStyle='rgba(255,120,60,.85)';for(let k=0;k<5;k++){const yy=((t*260+k*90)%520)-420;x.beginPath();x.moveTo(-100*sz+k*45*sz,yy*sz);x.lineTo(-78*sz+k*45*sz,yy*sz-60*sz);x.lineTo(-92*sz+k*45*sz,yy*sz-4*sz);x.fill()}
  }
  x.restore();
}

/* ---------- частицы ---------- */
function drawParts(x,kind,parts,t,W,H,S){
  if(!parts)return;x.save();
  for(const p of parts){
    let px=p.x*W,py=p.y*H;
    if(kind==='rain'){py=((p.y+t*p.v*1.4)%1)*H;px=((p.x*W-t*p.v*60)%W+W)%W;x.strokeStyle='rgba(180,210,255,.4)';x.lineWidth=1.3*S;x.beginPath();x.moveTo(px,py);x.lineTo(px-7*S,py+22*S);x.stroke()}
    else if(kind==='snow'){py=((p.y+t*p.v*.1)%1)*H;px=(p.x*W+Math.sin(t*p.v+p.ph)*30*S+W)%W;x.fillStyle='rgba(255,255,255,.8)';x.beginPath();x.arc(px,py,p.r*S*1.2,0,7);x.fill()}
    else if(kind==='embers'){py=H-((p.y+t*p.v*.12)%1)*H;px=(p.x*W+Math.sin(t*p.v*2+p.ph)*24*S+W)%W;x.fillStyle=`rgba(255,${130+p.ph*18|0},40,${.35+.4*Math.sin(t*3+p.ph)**2})`;x.beginPath();x.arc(px,py,p.r*S,0,7);x.fill()}
    else if(kind==='dust'){px=(p.x*W+t*p.v*40*S)%W;py=(p.y*H+Math.sin(t*p.v+p.ph)*16*S+H)%H;x.fillStyle='rgba(220,200,170,.2)';x.beginPath();x.arc(px,py,p.r*S*1.5,0,7);x.fill()}
    else if(kind==='bubbles'){py=H-((p.y+t*p.v*.1)%1)*H;px=(p.x*W+Math.sin(t*p.v+p.ph)*20*S)%W;x.strokeStyle='rgba(200,240,255,.45)';x.lineWidth=1.5*S;x.beginPath();x.arc(px,py,p.r*S*3,0,7);x.stroke()}
  }
  x.restore();
}

/* ---------- план сцены ---------- */
function plan(sc,ctx){
  const gn=ctx.gn,w=ctx.world,r=rng(sc.seed||ctx.i*977+13),feats=features(w,gn);
  const pal={s0:hexRgb(gn.c[0]),s1:hexRgb(gn.c[1]),g:hexRgb(gn.c[2])};
  const P={feats,pal,r,seed:sc.seed||1,cam:{x:0,y:0,z:1,rot:0,init:false},look:threatLook(sc.threatName,sc.threatKind),
    eye:mix(pal.s1,[255,60,40],.65),layers:[],props:[],parts:null,lastT:0};
  const top=feats[0]||'city',second=feats[1]||(top==='city'?'hills':'city'),third=feats[2];
  const kinds={city:'skyline',forest:'forest',hills:'hills',water:'water',space:'space',interior:'tunnel',ice:'ice',fire:'fire'};
  const farKind=(top==='interior'||top==='space')?kinds[top]:(second==='hills'||top==='water'||top==='ice'?'hills':kinds[second]);
  const midKind=kinds[top],nearKind=kinds[third]&&kinds[third]!==midKind&&kinds[third]!=='skyline'?kinds[third]:(midKind==='skyline'?'hills':midKind);
  P.layers=[buildLayer(farKind==='water'?'hills':farKind,r,.15),buildLayer(midKind,r,.4),buildLayer(['forest','hills','ice','fire'].includes(nearKind)?nearKind:'hills',r,.75)];
  P.water=feats.includes('water')&&feats.indexOf('water')<2;P.interior=top==='interior';P.space=top==='space';
  const n=['rain','snow','embers','dust','bubbles'].includes(gn.fx)?90:0;
  P.fx=gn.fx;P.parts=Array.from({length:n},()=>({x:r(),y:r(),v:.4+r()*.8,r:r()*2.2+.8,ph:r()*6}));
  P.stars=Array.from({length:70},()=>({x:r(),y:r()*.55,r:r()*1.6+.4,ph:r()*6}));
  const names=sc.propNames||[];P.props=(sc.props||[]).slice(0,3).map((e,k)=>({shape:shapeOf(names[k],(sc.seed||1)+k),x:.1+r()*.78,s:.7+r()*.6,name:names[k]||''}));
  P.dark=clamp((gn.dark||0)+(sc.level>.7?.1:0),0,.95);
  P.group=1+Math.round((sc.level||0)*3);
  return P;
}

/* ---------- рендер кадра ---------- */
function render(x,P,sc,ctx,st){
  const {W,H,S}=ctx,t=st.t,p=st.p,gY=H*(W>H?.72:.64),lvl=sc.level||0,act=sc.act||'walk';
  const dt=clamp(t-P.lastT,0,.1)||.016;P.lastT=t;
  /* камера выбирает план */
  const feet=gY+(H-gY)*.38,hs=S*(W>H?1.15:1);
  const heroX=W*([.2,.28,.34,.4,.46,.52][clamp(ctx.i,0,5)]+.06*p);
  const compX=heroX-(W>H?95:70)*S;
  const run=act==='run',walk=act==='walk'||act==='run'||act==='pick';
  const scroll=walk?(run?150:70)*S*(st.t%1000):0; // бесконечная прокрутка фона при ходьбе
  const thrX=W*(1.12-lvl*(.35+.25*Math.min(1,p*1.4)));
  let tx=heroX,ty=feet-110*S,tz=1.02+.16*p+lvl*.08,rot=0;
  const who=st.spk&&st.spk.who;
  if(who==='H'){tx=heroX;ty=feet-165*S;tz=1.55}
  else if(who==='C'&&ctx.comp){tx=compX;ty=feet-150*S;tz=1.6}
  else if(sc.threat&&lvl>.4){tx=(heroX+thrX)/2;ty=feet-100*S;tz=1.0+lvl*.12}
  else if(act==='hazard'||act==='pick'){tx=heroX+60*S;ty=feet-80*S;tz=1.25}
  if(lvl>.7)rot=Math.sin(t*.7)*.025*lvl;
  const C=P.cam;if(!C.init){C.x=tx;C.y=ty;C.z=tz;C.init=true}
  const k=1-Math.exp(-3.2*dt);C.x+=(tx-C.x)*k;C.y+=(ty-C.y)*k;C.z+=(tz-C.z)*k;C.rot+=(rot-C.rot)*k;
  const shake=(act==='fight'||act==='hurt')?Math.sin(t*47)*3.5*S*lvl:0;
  const pal=P.pal;
  x.save();
  x.translate(W/2+shake,H/2+(act==='fight'?Math.cos(t*41)*2.5*S:0));x.rotate(C.rot);x.scale(C.z,C.z);x.translate(-C.x,-C.y);
  /* небо */
  const mixRed=mix(pal.s1,[210,50,40],lvl*.25);
  const g=x.createLinearGradient(0,-H,0,gY);g.addColorStop(0,rgb(pal.s0));g.addColorStop(1,rgb(mixRed));x.fillStyle=g;x.fillRect(-W*1.2,-H*1.2,W*3.4,gY+H*1.2);
  if(P.dark>.4||P.space||P.fx==='stars'){for(const s of P.stars){x.fillStyle=`rgba(255,255,255,${.3+.5*Math.sin(t*2+s.ph)**2})`;x.beginPath();x.arc(s.x*W*1.4-W*.2,s.y*gY,s.r*S,0,7);x.fill()}}
  if(!P.interior&&!P.space){const mx=W*(.78-.05*p),my=gY*.3,rg=x.createRadialGradient(mx,my,0,mx,my,170*S);rg.addColorStop(0,'rgba(255,240,205,.5)');rg.addColorStop(1,'rgba(255,240,205,0)');x.fillStyle=rg;x.fillRect(mx-180*S,my-180*S,360*S,360*S);x.fillStyle='rgba(255,246,220,.85)';x.beginPath();x.arc(mx,my,32*S,0,7);x.fill()}
  /* слои среды */
  const cols=[rgb(mix(mixRed,BLACK,.38)),rgb(mix(mixRed,BLACK,.58)),rgb(mix(pal.g,BLACK,.62))];
  const sc2=scroll;
  drawLayer(x,P.layers[0],sc2,W,H,S,gY,cols[0],t,P.dark);
  drawLayer(x,P.layers[1],sc2,W,H,S,gY,cols[1],t,P.dark);
  /* туман между слоями растёт с напряжением */
  const fg=x.createLinearGradient(0,gY-H*.3,0,gY+10);fg.addColorStop(0,'rgba(0,0,0,0)');fg.addColorStop(1,rgb(mixRed,.25+lvl*.25));x.fillStyle=fg;x.fillRect(-W*1.2,gY-H*.3,W*3.4,H*.3+10);
  /* земля */
  if(P.water){x.fillStyle=rgb(mix(pal.g,[20,90,130],.45));x.fillRect(-W*1.2,gY,W*3.4,H*1.4);x.fillStyle='rgba(255,255,255,.13)';for(let q=0;q<30;q++){const wx=((q*173+t*34*(1+q%3))%(W*1.6))-W*.3,wy=gY+14*S+((q*37)%((H-gY)*1.2));x.fillRect(wx,wy,50*S,3*S)}}
  else{x.fillStyle=rgb(pal.g);x.fillRect(-W*1.2,gY,W*3.4,H*1.4);x.fillStyle='rgba(255,255,255,.08)';x.fillRect(-W*1.2,gY,W*3.4,4*S);const gr=x.createLinearGradient(0,gY,0,H);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.4)');x.fillStyle=gr;x.fillRect(-W*1.2,gY,W*3.4,H*.6);
    x.fillStyle='rgba(0,0,0,.18)';for(let q=0;q<22;q++){const lx=((q*131-sc2*1.1)%(W*1.6)+W*1.6)%(W*1.6)-W*.3;x.fillRect(lx,gY+((q*53)%((H-gY)))+6*S,40*S,2*S)}}
  /* предметы */
  P.props.forEach((pr,q)=>{const px=((pr.x*W-sc2*1.1)%(W*1.5)+W*1.5)%(W*1.5)-W*.2,py=gY+(H-gY)*(.28+.12*pr.s)-(q%2)*6*S;drawProp(x,pr.shape,px,py,78*S*pr.s,rgb(mix(pal.g,[255,255,255],.12)),t,P.seed+q)});
  /* угроза за героем (дальше) */
  const nT=sc.threat?P.group:0;
  const look=P.look;
  const single=look==='wave'||look==='fire'||look==='storm'||look==='knock'||look==='beast'||look==='dragon';
  const count=single?1:nT;
  for(let q=count-1;q>=0;q--){const qx=thrX+q*(W>H?85:50)*S-Math.sin(t*2+q)*5*S,off=(q%2)*16*S;if(count)drawThreat(x,look,qx,feet-off,S*(1-q*.06),t,q,P.eye,lvl)}
  /* герои */
  const wph=run?t*12:act==='fight'?t*15:act==='hurt'?Math.sin(t*20)*1.2:walk?t*6:0;
  if(ctx.comp&&ctx.drawHero)ctx.drawHero(x,compX,feet+8*S,'C',wph*1.1+1,who==='C',act);
  if(ctx.drawHero)ctx.drawHero(x,heroX+(act==='fight'?Math.sin(t*6)*18*S:0),feet+(act==='hide'?10*S:0),'H',wph,who==='H',act);
  /* частицы поверх */
  drawParts(x,P.fx,P.parts,t,W,H,S);
  drawLayer(x,P.layers[2],sc2*1.2,W,H,S,H*1.02,cols[2],t,P.dark);
  x.restore();
  /* ---- экранный свет и цвет ---- */
  const sx=W/2+(heroX+40*S-C.x)*C.z,sy=H/2+(feet-120*S-C.y)*C.z;
  let flashed=false;if(sc.flash){const f=Math.sin(t*9)*Math.sin(t*2.3);if(f>.93){flashed=true;x.fillStyle='rgba(255,255,255,.55)';x.fillRect(0,0,W,H)}}
  const d=P.dark;
  if(d>.05){const R=(W>H?330:300)*S*C.z,gr=x.createRadialGradient(sx,sy,R*.12,sx,sy,R);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,`rgba(0,0,0,${d})`);x.fillStyle=gr;x.fillRect(0,0,W,H);x.fillStyle=`rgba(0,0,0,${d*.3})`;x.fillRect(0,0,W,H)}
  /* цветокоррекция: напряжение -> красноватый тон, мрачный тон -> обесцвечивание */
  if(lvl>.4){x.fillStyle=`rgba(255,30,20,${(lvl-.4)*.12})`;x.fillRect(0,0,W,H)}
  if(ctx.tone==='dark'){x.fillStyle='rgba(20,30,50,.18)';x.fillRect(0,0,W,H)}else if(ctx.tone==='warm'){x.fillStyle='rgba(255,170,80,.08)';x.fillRect(0,0,W,H)}
  const v=x.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,`rgba(0,0,0,${.5+lvl*.15})`);x.fillStyle=v;x.fillRect(0,0,W,H);
  return {heroX,compX,feet,flashed};
}
root.Director={plan,render,features,shapeOf,threatLook};
if(typeof module!=='undefined')module.exports=root.Director;
})(typeof window!=='undefined'?window:globalThis);

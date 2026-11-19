/* Студия Историй — логика приложения */
(function(){
'use strict';
const $=(s,r)=>(r||document).querySelector(s), $$=(s,r)=>[...(r||document).querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const EMOJI_FONT='"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

/* ---------- состояние ---------- */
const st={
  genre:null,
  hero:{name:'Алекс',gender:'m',age:28,prof:'Механик',trait:'Храбрый',out:0,hair:1,skin:1,acc:'🔦',catch:'',tone:'epic'},
  voice:{preset:'narrator',sys:'',pitch:1,rate:1},
  story:null
};
try{const h=JSON.parse(lsGet('si_hero')||'null');if(h)Object.assign(st.hero,h)}catch(e){}
const g=(m,f)=>st.hero.gender==='f'?f:m;

/* ---------- навигация ---------- */
function go(n,force){
  if(n>=2&&!st.genre){n=1}
  if(n===4&&!st.story&&!force){n=3}
  $$('section.step').forEach(s=>s.classList.toggle('on',s.id==='s'+n));
  $$('#steps button').forEach(b=>{const k=+b.dataset.go;b.classList.toggle('on',k===n);b.classList.toggle('done',k<n)});
  if(n!==4)stopPlay();
  if(n===2)drawPreview();
  if(n===3)syncVoiceUI();
  window.scrollTo({top:0,behavior:'smooth'});
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-go]');if(b){go(+b.dataset.go);return}
  const c=e.target.closest('[data-copy]');
  if(c){const t=$(c.dataset.copy).textContent;copyText(t,c)}
});
function copyText(t,btn){
  const done=()=>{if(btn){const o=btn.textContent;btn.textContent='✔ Скопировано';setTimeout(()=>btn.textContent=o,1200)}};
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,()=>fallbackCopy(t,done))}else fallbackCopy(t,done);
}
function fallbackCopy(t,done){const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy')}catch(e){}a.remove();done()}

/* ---------- 1. галерея ---------- */
function renderGrid(){
  const q=$('#q').value.trim().toLowerCase();
  const list=GENRES.map((x,i)=>({x,i})).filter(({x})=>!q||(x.n+' '+x.place+' '+x.hook).toLowerCase().includes(q));
  $('#grid').innerHTML=list.map(({x,i})=>`<button class="g${st.genre&&st.genre.id===x.id?' sel':''}" data-id="${x.id}" style="background:linear-gradient(160deg,${x.c[0]},${x.c[1]})"><span class="no">№${i+1}</span><span class="em">${x.e}</span><b>${esc(x.n)}</b><small>${esc(x.hook)}</small></button>`).join('');
  $('#cnt').textContent=`Историй: ${list.length} из ${GENRES.length}`;
}
$('#q').addEventListener('input',renderGrid);
$('#grid').addEventListener('click',e=>{
  const b=e.target.closest('.g');if(!b)return;
  st.genre=GENRES.find(x=>x.id===b.dataset.id);
  st.voice.preset=st.genre.v;applyPreset();
  renderGrid();go(2);
});
$('#useIdea').addEventListener('click',()=>{
  const t=$('#idea').value.trim();
  if(t.length<8){$('#idea').focus();$('#idea').placeholder='Напиши хотя бы одно предложение — о чём история?';return}
  st.genre=customGenre(t);st.voice.preset=st.genre.v;applyPreset();renderGrid();go(2);
});
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function customGenre(t){
  const h=hash(t),pal=[['#1d1b3a','#e0506a','#2a2438'],['#0b2a3a','#35c0a0','#1c3a30'],['#2b1a10','#f0a050','#4a3020'],['#141a3a','#6a8cff','#202848'],['#2a1030','#ff7ac0','#301a3a']];
  const sk=['city','forest','hills','water','interior','space'];
  const low=t.toLowerCase();
  const dark=/ноч|страх|тьм|мрак|ужас|кров|тень/.test(low)?.6:.15;
  return {id:'custom',n:'Моя история',e:'✍️',c:pal[h%pal.length],sk:sk[(h>>3)%sk.length],fx:['stars','dust','none','embers'][(h>>5)%4],dark,
   v:dark>.5?'whisper':'narrator',en:'scene inspired by: '+t,enT:'the main danger of the story',custom:t,
   place:'Мир твоей истории',hook:t.replace(/[.!?…]+$/,''),goal:'довести задуманное до конца',
   obs:'На пути встаёт неожиданное препятствие, о котором никто не предупреждал',
   twist:'Всё оказывается не тем, чем казалось в начале',threat:'❓',props:['✨','🗺️','🔮']};
}

/* ---------- 2. герой ---------- */
function chips(el,items,key,fmt){
  el.innerHTML=items.map(it=>`<span class="chip${st.hero[key]===it?' on':''}" data-v="${esc(it)}">${esc(fmt?fmt(it):it)}</span>`).join('');
  el.onclick=e=>{const c=e.target.closest('.chip');if(!c)return;st.hero[key]=c.dataset.v;saveHero();renderHeroForm()};
}
function swatches(el,arr,key){
  el.innerHTML=arr.map((c,i)=>`<span class="sw${st.hero[key]===i?' on':''}" data-i="${i}" title="${c.n||''}" style="background:${c.c}"></span>`).join('');
  el.onclick=e=>{const c=e.target.closest('.sw');if(!c)return;st.hero[key]=+c.dataset.i;saveHero();renderHeroForm()};
}
function renderHeroForm(){
  const h=st.hero;
  $('#hName').value=h.name;$('#hAge').value=h.age;$('#hProf').value=h.prof;$('#hAcc').value=h.acc;$('#hCatch').value=h.catch;
  $$('#hGender .chip').forEach(c=>c.classList.toggle('on',c.dataset.v===h.gender));
  chips($('#hTrait'),Object.keys(TRAITS),'trait');
  swatches($('#hOut'),COLORS_OUT,'out');swatches($('#hHair'),COLORS_HAIR,'hair');swatches($('#hSkin'),SKINS,'skin');
  chips($('#hTone'),Object.keys(TONES),'tone',k=>TONES[k].n);
  $('#hAccQ').innerHTML=['🔦','🔧','🗡️','📷','🎒','🧭','🪄','📞','🔫','🪓'].map(x=>`<span class="chip" data-v="${x}">${x}</span>`).join('');
  $('#hAccQ').onclick=e=>{const c=e.target.closest('.chip');if(c){h.acc=c.dataset.v;saveHero();renderHeroForm()}};
  drawPreview();
}
$('#hName').oninput=e=>{st.hero.name=e.target.value||'Герой';saveHero();drawPreview()};
$('#hAge').oninput=e=>{st.hero.age=Math.max(5,Math.min(99,+e.target.value||20));saveHero()};
$('#hProf').oninput=e=>{st.hero.prof=e.target.value||'Путник';saveHero()};
$('#hAcc').oninput=e=>{st.hero.acc=e.target.value;saveHero();drawPreview()};
$('#hCatch').oninput=e=>{st.hero.catch=e.target.value;saveHero()};
$('#hGender').onclick=e=>{const c=e.target.closest('.chip');if(!c)return;st.hero.gender=c.dataset.v;saveHero();renderHeroForm()};
function saveHero(){lsSet('si_hero',JSON.stringify(st.hero))}
function drawPreview(){
  const c=$('#pv');if(!c||!st.genre&&false)return;const x=c.getContext('2d'),gn=st.genre||GENRES[0];
  const gr=x.createLinearGradient(0,0,0,c.height);gr.addColorStop(0,gn.c[0]);gr.addColorStop(1,gn.c[1]);x.fillStyle=gr;x.fillRect(0,0,c.width,c.height);
  x.fillStyle=gn.c[2];x.fillRect(0,270,c.width,90);
  drawHero(x,150,320,1.15,0,false,st.hero,0);
  $('#pvName').textContent=st.hero.name+' · '+st.hero.prof;
}

/* ---------- 3. голос ---------- */
let sysVoices=[];
function loadVoices(){
  if(!('speechSynthesis' in window)){sysVoices=[];return}
  sysVoices=speechSynthesis.getVoices();
  const ru=sysVoices.filter(v=>/^ru/i.test(v.lang));
  const list=ru.length?ru:sysVoices;
  const sel=$('#vSys');if(!sel)return;
  sel.innerHTML='<option value="">Авто (подходящий под характер)</option>'+list.map(v=>`<option value="${esc(v.name)}">${esc(v.name)} (${esc(v.lang)})</option>`).join('');
  sel.value=st.voice.sys;
  $('#vHint').textContent=!sysVoices.length?'На этом устройстве нет синтезатора речи — видео будет идти по таймеру с субтитрами.':(ru.length?'Русские голоса найдены.':'Русских голосов нет — установи русский голос в настройках системы, пока читает доступный.');
}
if('speechSynthesis' in window){speechSynthesis.onvoiceschanged=loadVoices}
function applyPreset(){const p=VOICES[st.voice.preset];st.voice.pitch=p.p;st.voice.rate=p.r}
function syncVoiceUI(){
  $('#vChips').innerHTML=Object.keys(VOICES).map(k=>`<span class="chip${st.voice.preset===k?' on':''}" data-v="${k}">${VOICES[k].e} ${VOICES[k].n}</span>`).join('');
  $('#vPitch').value=st.voice.pitch;$('#vRate').value=st.voice.rate;
  $('#pV').textContent=(+st.voice.pitch).toFixed(2);$('#rV').textContent=(+st.voice.rate).toFixed(2);
  loadVoices();$('#vPrompt').textContent=voicePrompt();
}
$('#vChips').onclick=e=>{const c=e.target.closest('.chip');if(!c)return;st.voice.preset=c.dataset.v;applyPreset();syncVoiceUI()};
$('#vPitch').oninput=e=>{st.voice.pitch=+e.target.value;$('#pV').textContent=(+e.target.value).toFixed(2);$('#vPrompt').textContent=voicePrompt()};
$('#vRate').oninput=e=>{st.voice.rate=+e.target.value;$('#rV').textContent=(+e.target.value).toFixed(2);$('#vPrompt').textContent=voicePrompt()};
$('#vSys').onchange=e=>{st.voice.sys=e.target.value};
$('#vPlay').onclick=()=>{cancelSpeech();speak($('#vTest').value||'Проверка голоса',{})};
function voicePrompt(){
  const p=VOICES[st.voice.preset],v=st.voice,h=st.hero,tn=TONES[h.tone];
  const pitch=v.pitch<.8?'низкий':v.pitch>1.25?'высокий':'средний',rate=v.rate<.9?'медленный':v.rate>1.12?'быстрый':'средний';
  return `ГОЛОС ДЛЯ ОЗВУЧКИ\nХарактер: ${p.n} — ${p.ru}.\nВысота: ${pitch}. Темп: ${rate}. Подача: ${tn.n.toLowerCase()}.\nЯзык: русский, чёткая дикция, паузы на запятых и точках.\nЖанр истории: ${st.genre?st.genre.n:'—'}.\n\nENGLISH (for ElevenLabs / Voice Design):\n"${p.en}; ${tn.en.split(',')[0]} delivery; ${pitch==='низкий'?'low':pitch==='высокий'?'high':'medium'} pitch, ${rate==='медленный'?'slow':rate==='быстрый'?'fast':'moderate'} pace; native Russian speaker, clear diction, natural pauses."`;
}
function pickSysVoice(){
  if(!sysVoices.length)return null;
  if(st.voice.sys){const v=sysVoices.find(x=>x.name===st.voice.sys);if(v)return v}
  let list=sysVoices.filter(v=>/^ru/i.test(v.lang));if(!list.length)list=sysVoices;
  const want=VOICES[st.voice.preset].g;
  const fe=/female|жен|milena|alena|irina|anna|katya|svetlana|tatyana|elena/i,ma=/(^|[^a-z])male|муж|yuri|pavel|maxim|dmitry|aleksandr|nikolay/i;
  const m=list.find(v=>(want==='f'?fe:ma).test(v.name));
  return m||list[0];
}

/* ---------- речь ---------- */
let curUtter=null;
function cancelSpeech(){try{if('speechSynthesis' in window)speechSynthesis.cancel()}catch(e){}curUtter=null}
function speak(text,cb){
  if(!('speechSynthesis' in window)){cb.nostart&&cb.nostart();return null}
  const u=new SpeechSynthesisUtterance(text);
  const v=pickSysVoice();if(v){u.voice=v;u.lang=v.lang}else u.lang='ru-RU';
  u.pitch=st.voice.pitch;u.rate=st.voice.rate;
  u.onstart=()=>cb.start&&cb.start();
  u.onboundary=ev=>{if(cb.boundary&&(ev.name===undefined||ev.name==='word'))cb.boundary(ev.charIndex)};
  u.onend=()=>cb.end&&cb.end();
  u.onerror=()=>cb.end&&cb.end();
  curUtter=u;speechSynthesis.speak(u);return u;
}

/* ---------- агент: сценарий ---------- */
const SHOTS=['wide establishing shot','medium shot','tracking shot following the hero','close-up on the face','dynamic action shot','slow pull-back wide shot'];
const BEATS=['calm before the storm','sudden danger appears','determined journey begins','tense confrontation with the obstacle','shocking twist and climactic moment','hopeful ending, new dawn'];
function heroEn(){const h=st.hero;return `a ${TRAITS[h.trait].en} ${h.gender==='f'?'woman':'man'}, ${h.age} years old, ${h.prof}, wearing ${COLORS_OUT[h.out].en} clothes, ${COLORS_HAIR[h.hair].en} hair, holding ${h.acc}`}
function localStory(gn){
  const h=st.hero,n=h.name,tr=TRAITS[h.trait][h.gender],tone=h.tone;
  const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
  const ends={
   epic:`С рассветом ${n} ${g('дошёл','дошла')} до конца пути. Мир уже не станет прежним, но у него появился герой.`,
   dark:`${n} ${g('выжил','выжила')}, но цена оказалась страшной. Некоторые двери лучше не открывать.`,
   ironic:`${n} ${g('справился','справилась')}, хотя, честно говоря, по плану всё должно было пойти совсем иначе.`,
   warm:`${n} ${g('вернулся','вернулась')} к тем, кто ждал. И впервые за долгое время стало по-настоящему тихо и тепло.`};
  const catchLine=h.catch?` «${h.catch}» — ${g('сказал','сказала')} ${n}.`:'';
  const t=[
   `${gn.place}. Знакомьтесь: ${n}, ${h.age}, ${h.prof.toLowerCase()}. Характер: ${tr}. ${pick(['Обычный день — пока не случилось это.','Всё шло как всегда. Ненадолго.'])}`,
   `${cap(gn.hook)}. ${n} ${g('замер','замерла')}: прежней жизни больше нет.`,
   `Цель ясна: ${gn.goal}. ${n} ${g('собрал','собрала')} всё нужное и ${g('вышел','вышла')} в путь, сжимая ${h.acc}.`,
   `${cap(gn.obs)}. ${n} ${g('понял','поняла')}: назад дороги нет.`,
   `${cap(gn.twist)}. И тогда ${n} ${g('принял','приняла')} решение, от которого зависело всё.`,
   ends[tone]+catchLine];
  const lv=[0,.3,.1,.8,1,0];
  return {title:gn.n+': '+n,scenes:t.map((text,i)=>({text,props:gn.props.slice(),threat:lv[i]>0?gn.threat:'',level:lv[i],flash:!!gn.flash&&(i===1||i===4)||tone==='dark'&&i===4,
    anim:`${SHOTS[i]}, ${heroEn()}, ${gn.en}, ${BEATS[i]}${lv[i]>0?', threat: '+gn.enT:''}, ${TONES[tone].en}, smooth camera motion, 5 seconds, 16:9`}))};
}
async function aiStory(gn,key){
  const h=st.hero;
  const prompt=`Ты — сценарист коротких анимационных историй. Напиши историю на РУССКОМ ровно из 6 сцен (по 1–2 предложения, до 230 символов каждая).
Жанр/мир: ${gn.n}. Место: ${gn.place}. ${gn.custom?'Идея автора: '+gn.custom:'Завязка: '+gn.hook}.
Герой: ${h.name}, ${h.gender==='f'?'женщина':'мужчина'}, ${h.age} лет, ${h.prof}, характер — ${h.trait}. ${h.catch?'Коронная фраза: «'+h.catch+'». ':''}Тон: ${TONES[h.tone].n}.
Структура: 1 знакомство, 2 завязка, 3 путь к цели, 4 препятствие, 5 поворот и кульминация, 6 финал.
Верни ТОЛЬКО JSON без пояснений: {"title":"...","scenes":[{"text":"...","props":["эмодзи","эмодзи","эмодзи"],"threat":"эмодзи или пустая строка","level":число 0..1,"anim":"промт для генератора видео на английском: план камеры, герой, место, действие, стиль"}]}`;
  const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
    body:JSON.stringify({model:'claude-sonnet-5-5',max_tokens:2500,messages:[{role:'user',content:prompt}]})});
  if(!r.ok)throw new Error('API '+r.status);
  const j=await r.json(),txt=(j.content||[]).map(c=>c.text||'').join('');
  const m=txt.match(/\{[\s\S]*\}/);if(!m)throw new Error('нет JSON');
  const o=JSON.parse(m[0]);if(!o.scenes||o.scenes.length<3)throw new Error('мало сцен');
  return {title:o.title||gn.n,scenes:o.scenes.slice(0,8).map((s,i)=>({text:String(s.text||''),props:(s.props&&s.props.length?s.props:gn.props).slice(0,4),threat:s.threat||'',level:Math.max(0,Math.min(1,+s.level||0)),flash:false,anim:s.anim||''}))};
}
function log(msg,cls){const d=document.createElement('div');d.className=cls||'run';d.textContent=msg;$('#log').appendChild(d);return d}
async function runAgent(){
  $('#log').innerHTML='';
  const gn=st.genre,key=($('#apiKey').value||lsGet('si_key')||'').trim();
  let d=log('Агент: читаю идею и параметры героя…');await sleep(250);d.className='ok';
  d=log('Агент: пишу сценарий '+(key?'через Claude API…':'встроенным генератором…'));
  let story=null;
  if(key){try{story=await aiStory(gn,key);d.className='ok'}catch(e){d.className='err';d.textContent='Claude API не ответил ('+e.message+') — использую встроенный генератор';}}
  if(!story){await sleep(250);story=localStory(gn);if(!key)d.className='ok'}
  d=log('Агент: подбираю голос «'+VOICES[st.voice.preset].n+'»…');await sleep(200);d.className='ok';
  d=log('Агент: пишу промты анимации для '+story.scenes.length+' сцен…');await sleep(200);d.className='ok';
  d=log('Агент: рисую видео кодом (HTML5 canvas) и синхронизирую субтитры с голосом…');await sleep(300);d.className='ok';
  log('Готово. Нажми «Смотреть» или запиши видео.','ok');
  story.scenes.forEach((s,i)=>{s.seed=hash(story.title+i)});
  st.story=story;return story;
}
$('#make').onclick=async()=>{
  if(!st.genre){go(1);return}
  go(4,true);$('#title').textContent='Агент пишет видео…';$('#p1').innerHTML='';$('#p2').innerHTML='';
  setTab('p4');
  await runAgent();renderStudio();setTab('p1');
};
$('#regen').onclick=async()=>{stopPlay();setTab('p4');await runAgent();renderStudio()};
$('#apiKey').value=lsGet('si_key')||'';
$('#apiKey').onchange=e=>lsSet('si_key',e.target.value.trim());

/* ---------- студия ---------- */
function setTab(t){$$('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));$$('.pane').forEach(p=>p.classList.toggle('on',p.id===t))}
$('#tabs').onclick=e=>{const b=e.target.closest('button');if(b)setTab(b.dataset.t)};
function renderStudio(){
  const s=st.story;if(!s)return;
  $('#title').textContent=s.title;
  $('#p1').innerHTML=s.scenes.map((sc,i)=>`<div class="scene" id="sc${i}"><div class="hd"><span>Сцена ${i+1}</span><button class="btn sec sm" data-say="${i}">▶ с этой сцены</button></div><textarea data-i="${i}">${esc(sc.text)}</textarea></div>`).join('');
  $('#p2').innerHTML='<p class="hint" style="margin-top:0">Готовые промты для Veo, Runway, Kling, Sora, Pika, Hailuo и т. п. — по одному на сцену.</p>'+s.scenes.map((sc,i)=>`<div class="scene"><div class="hd"><span>Сцена ${i+1}</span><button class="btn sec sm" data-copy="#an${i}">Копировать</button></div><div class="prompt" id="an${i}">${esc(sc.anim)}</div></div>`).join('')+'<button class="btn sec sm" id="copyAll">Копировать все промты</button>';
  $('#copyAll').onclick=e=>copyText(s.scenes.map((x,i)=>`Сцена ${i+1}: ${x.anim}`).join('\n\n'),e.target);
  $('#vPrompt2').textContent=voicePrompt();
  $$('#p1 textarea').forEach(t=>t.oninput=()=>{s.scenes[+t.dataset.i].text=t.value});
  $$('[data-say]').forEach(b=>b.onclick=()=>{startPlay(+b.dataset.say)});
  setFormat($('#vert').checked);drawFrame(0,0,0,false);
}

/* ---------- рисование героя и мира ---------- */
function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function drawHero(x,px,py,S,walk,speaking,h,t){
  const sw=Math.sin(walk)*26*S,bob=Math.abs(Math.sin(walk))*5*S;
  x.save();x.lineCap='round';
  x.fillStyle='#0003';x.beginPath();x.ellipse(px,py+2*S,40*S,9*S,0,0,7);x.fill();
  const oc=COLORS_OUT[h.out].c,hc=COLORS_HAIR[h.hair].c,sk=SKINS[h.skin].c,y=py-bob;
  x.strokeStyle='#23283a';x.lineWidth=17*S;
  x.beginPath();x.moveTo(px-9*S,y-92*S);x.lineTo(px-9*S+sw,py);x.moveTo(px+9*S,y-92*S);x.lineTo(px+9*S-sw,py);x.stroke();
  x.strokeStyle='#111';x.lineWidth=11*S;x.beginPath();x.moveTo(px-9*S+sw,py);x.lineTo(px-9*S+sw+10*S,py);x.moveTo(px+9*S-sw,py);x.lineTo(px+9*S-sw+10*S,py);x.stroke();
  x.strokeStyle=oc;x.lineWidth=13*S;
  x.beginPath();x.moveTo(px-22*S,y-148*S);x.lineTo(px-26*S-sw*.6,y-104*S);x.stroke();
  x.fillStyle=oc;x.beginPath();x.roundRect?x.roundRect(px-28*S,y-158*S,56*S,76*S,16*S):x.rect(px-28*S,y-158*S,56*S,76*S);x.fill();
  x.fillStyle='#0002';x.fillRect(px-28*S,y-96*S,56*S,8*S);
  x.strokeStyle=oc;x.lineWidth=13*S;x.beginPath();x.moveTo(px+22*S,y-148*S);x.lineTo(px+30*S+sw*.6,y-104*S);x.stroke();
  x.fillStyle=sk;x.beginPath();x.arc(px-26*S-sw*.6,y-100*S,7*S,0,7);x.arc(px+30*S+sw*.6,y-100*S,7*S,0,7);x.fill();
  if(h.acc){x.font=Math.round(34*S)+'px '+EMOJI_FONT;x.textAlign='center';x.textBaseline='middle';x.fillText(h.acc,px+40*S+sw*.6,y-108*S)}
  x.fillStyle=sk;x.fillRect(px-7*S,y-170*S,14*S,16*S);
  x.beginPath();x.arc(px,y-190*S,30*S,0,7);x.fill();
  x.fillStyle=hc;x.beginPath();x.arc(px,y-193*S,31*S,Math.PI*1.02,Math.PI*1.98);x.fill();
  if(h.gender==='f'){x.fillRect(px-32*S,y-196*S,10*S,46*S);x.fillRect(px+22*S,y-196*S,10*S,46*S)}else{x.fillRect(px-31*S,y-196*S,62*S,12*S)}
  x.fillStyle='#111';x.beginPath();x.arc(px+10*S,y-190*S,3.4*S,0,7);x.arc(px+22*S,y-190*S,3.4*S,0,7);x.fill();
  x.strokeStyle='#111';x.lineWidth=2.4*S;x.beginPath();
  if(speaking){const m=Math.abs(Math.sin(t*14))*6*S+2*S;x.fillStyle='#5a1a1a';x.ellipse(px+16*S,y-175*S,5*S,m,0,0,7);x.fill()}
  else{x.moveTo(px+9*S,y-176*S);x.quadraticCurveTo(px+16*S,y-172*S,px+23*S,y-177*S);x.stroke()}
  x.restore();
}
function prepScene(sc,gn){
  const r=rng(sc.seed||7),W=1280,H=1280;
  sc._st=[...Array(70)].map(()=>({x:r(),y:r()*.5,r:r()*1.6+.4,ph:r()*6}));
  const mk=(h0,h1,w0,w1)=>{const a=[];let x=-.1;while(x<1.6){const w=(w0+r()*(w1-w0));a.push({x,w,h:h0+r()*(h1-h0),win:[...Array(12)].map(()=>r())});x+=w*.9+r()*.02}return a};
  sc._far=mk(.1,.3,.05,.1);sc._near=mk(.14,.42,.07,.14);
  sc._pp=sc.props.map(()=>({x:.12+r()*.78,s:.6+r()*.5}));
  const kind=gn.fx;const n=kind==='none'?0:kind==='stars'?0:90;
  sc._parts=[...Array(n)].map(()=>({x:r(),y:r(),v:.4+r()*.8,r:r()*2.2+.8,ph:r()*6}));
}
function drawParts(x,sc,gn,t,W,H,S){
  const k=gn.fx;if(!sc._parts)return;
  x.save();
  for(const p of sc._parts){
    let px=p.x*W,py=p.y*H;
    if(k==='rain'){py=(p.y+t*p.v*1.4)%1*H;px=(p.x*W-t*p.v*60)%W;if(px<0)px+=W;x.strokeStyle='rgba(180,210,255,.45)';x.lineWidth=1.3*S;x.beginPath();x.moveTo(px,py);x.lineTo(px-7*S,py+22*S);x.stroke()}
    else if(k==='snow'){py=(p.y+t*p.v*.1)%1*H;px=(p.x*W+Math.sin(t*p.v+p.ph)*30*S)%W;x.fillStyle='rgba(255,255,255,.8)';x.beginPath();x.arc(px,py,p.r*S*1.2,0,7);x.fill()}
    else if(k==='embers'){py=H-((p.y+t*p.v*.12)%1)*H;px=(p.x*W+Math.sin(t*p.v*2+p.ph)*24*S+W)%W;x.fillStyle=`rgba(255,${130+p.ph*18|0},40,${.35+.4*Math.sin(t*3+p.ph)**2})`;x.beginPath();x.arc(px,py,p.r*S,0,7);x.fill()}
    else if(k==='dust'){px=(p.x*W+t*p.v*40*S)%W;py=(p.y*H+Math.sin(t*p.v+p.ph)*16*S+H)%H;x.fillStyle='rgba(220,200,170,.22)';x.beginPath();x.arc(px,py,p.r*S*1.5,0,7);x.fill()}
    else if(k==='bubbles'){py=H-((p.y+t*p.v*.1)%1)*H;px=(p.x*W+Math.sin(t*p.v+p.ph)*20*S)%W;x.strokeStyle='rgba(200,240,255,.45)';x.lineWidth=1.5*S;x.beginPath();x.arc(px,py,p.r*S*3,0,7);x.stroke()}
  }
  x.restore();
}
function drawWorld(x,sc,gn,i,p,t,speaking,W,H,S,hh){
  const gY=H*(W>H?.72:.64),dark=gn.dark;
  const g1=x.createLinearGradient(0,0,0,gY);g1.addColorStop(0,gn.c[0]);g1.addColorStop(1,gn.c[1]);x.fillStyle=g1;x.fillRect(0,0,W,H);
  if(gn.fx==='stars'||dark>.5||gn.sk==='space'){for(const s of sc._st){x.fillStyle=`rgba(255,255,255,${.35+.5*Math.sin(t*2+s.ph)**2})`;x.beginPath();x.arc(s.x*W,s.y*gY,s.r*S,0,7);x.fill()}}
  if(gn.sk!=='interior'){const mx=W*.78,my=gY*.28,rg=x.createRadialGradient(mx,my,0,mx,my,150*S);rg.addColorStop(0,'rgba(255,240,200,.55)');rg.addColorStop(1,'rgba(255,240,200,0)');x.fillStyle=rg;x.fillRect(mx-160*S,my-160*S,320*S,320*S);x.fillStyle='rgba(255,245,215,.85)';x.beginPath();x.arc(mx,my,34*S,0,7);x.fill()}
  const off=p*70*S;
  if(gn.sk==='city'){
    [['_far',.45,off*.4],['_near',.65,off]].forEach(([k,a,o])=>{for(const b of sc[k]){const bx=b.x*W-o,bw=b.w*W,bh=b.h*H*(W>H?1:.7);x.fillStyle=`rgba(0,0,0,${a})`;x.fillRect(bx,gY-bh,bw,bh);if(k==='_near'&&dark>.15){x.fillStyle='rgba(255,215,120,.75)';b.win.forEach((w,j)=>{if(w>.55&&Math.sin(t*.7+j*3+b.x*40)>-.6)x.fillRect(bx+8*S+(j%3)*bw/3.3,gY-bh+12*S+((j/3|0)*22*S),bw/6,10*S)})}}});
  }else if(gn.sk==='forest'){
    [['_far',.4,off*.4],['_near',.62,off]].forEach(([k,a,o])=>{for(const b of sc[k]){const bx=b.x*W-o,bw=b.w*W*1.3,bh=b.h*H*1.1*(W>H?1:.7);x.fillStyle=`rgba(0,0,0,${a})`;x.beginPath();x.moveTo(bx,gY);x.lineTo(bx+bw/2,gY-bh);x.lineTo(bx+bw,gY);x.fill()}});
  }else if(gn.sk==='hills'){
    [[.55,.45,.6,.9],[.35,.7,.4,1.3]].forEach(([al,hh2,sp,fr],k)=>{x.fillStyle=`rgba(0,0,0,${al})`;x.beginPath();x.moveTo(0,gY);for(let px=0;px<=W;px+=16)x.lineTo(px,gY-(60+k*40)*S-Math.sin((px+off*sp*(k+1))/(160*S/fr)+k*2)*40*S*hh2-Math.sin((px+off*sp)/(70*S))*10*S);x.lineTo(W,gY);x.fill()});
  }else if(gn.sk==='space'){
    x.fillStyle='rgba(120,160,255,.35)';x.beginPath();x.arc(W*.25-off*.3,gY*.62,110*S,0,7);x.fill();x.fillStyle='rgba(255,170,100,.3)';x.beginPath();x.arc(W*.6-off*.5,gY*.35,48*S,0,7);x.fill();
  }else if(gn.sk==='interior'){
    for(let k=0;k<9;k++){x.fillStyle=`rgba(0,0,0,${k%2?.28:.4})`;x.fillRect((k/9)*W-off*.5,0,W/9,gY)}
    x.fillStyle='rgba(255,255,255,.07)';x.fillRect(0,gY*.18,W,10*S);
  }
  let gcol=gn.c[2];
  x.fillStyle=gcol;x.fillRect(0,gY,W,H-gY);
  if(gn.sk==='water'){x.fillStyle='rgba(255,255,255,.12)';for(let k=0;k<26;k++){const wx=((k*173+t*30*(1+k%3))%(W+100))-50,wy=gY+14*S+(k*37%(H-gY-20*S));x.fillRect(wx,wy,50*S,3*S)}x.fillStyle='rgba(0,0,0,.12)';x.fillRect(0,gY,W,5*S)}
  else{x.fillStyle='rgba(255,255,255,.1)';x.fillRect(0,gY,W,4*S);const gr=x.createLinearGradient(0,gY,0,H);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.35)');x.fillStyle=gr;x.fillRect(0,gY,W,H-gY)}
  const feet=gY+(H-gY)*.38;
  x.textAlign='center';x.textBaseline='alphabetic';
  sc._pp.forEach((pp,k)=>{x.font=Math.round(70*pp.s*S)+'px '+EMOJI_FONT;x.fillText(sc.props[k],((pp.x*W-off*1.2)%W+W)%W,gY+(H-gY)*(.3+.12*pp.s))});
  const heroX=W*([.2,.28,.36,.45,.52,.64][Math.min(i,5)]+.08*p);
  const L=sc.level*(.4+.6*Math.min(1,p*1.4));
  const nT=sc.threat?1+Math.round(sc.level*3):0;
  const walking=!speaking||sc.level>.7;
  const drawT=()=>{for(let k=0;k<nT;k++){const fs=(120-k*16)*S,tx=W*(1.12-L*.38)+k*(W>H?95:55)*S-Math.sin(t*2+k)*6*S,ty=feet-(k%2)*18*S+Math.sin(t*5+k*2)*5*S;x.font=Math.round(fs)+'px '+EMOJI_FONT;x.textAlign='center';x.fillText(sc.threat,tx,ty-8*S)}};
  drawHero(x,heroX,feet,S*1.0*(W>H?1.15:1),walking?t*6:0,speaking,hh,t);
  drawT();
  if(gn.sk==='city'||gn.sk==='interior'){}
  drawParts(x,sc,gn,t,W,H,S);
  return {heroX,feet};
}
function drawOverlay(x,sc,gn,p,t,W,H,S,pos){
  if(sc.flash){const f=Math.sin(t*9)*Math.sin(t*2.3);if(f>.93){x.fillStyle='rgba(255,255,255,.55)';x.fillRect(0,0,W,H)}}
  const d=Math.min(.95,gn.dark+(sc.level>.7?.12:0));
  if(d>.05){const r=(W>H?330:300)*S,gr=x.createRadialGradient(pos.heroX+40*S,pos.feet-120*S,r*.12,pos.heroX+40*S,pos.feet-120*S,r);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,`rgba(0,0,0,${d})`);x.fillStyle=gr;x.fillRect(0,0,W,H);x.fillStyle=`rgba(0,0,0,${d*.3})`;x.fillRect(0,0,W,H)}
  const v=x.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.55)');x.fillStyle=v;x.fillRect(0,0,W,H);
}
function wrapWords(x,words,maxW){
  const lines=[[]];let w0=0;const sp=x.measureText(' ').width;
  words.forEach(o=>{const w=x.measureText(o.w).width;if(w0+w>maxW&&lines[lines.length-1].length){lines.push([]);w0=0}lines[lines.length-1].push({o,w});w0+=w+sp});
  return lines;
}
function drawSubs(x,sc,wordIdx,W,H,S){
  const words=sc._words;if(!words)return;
  const CH=W>H?11:7;const ci=Math.floor(Math.max(0,wordIdx)/CH),chunk=words.slice(ci*CH,ci*CH+CH);
  const fs=Math.round((W>H?36:34)*S);x.font='700 '+fs+'px system-ui,"Segoe UI",Roboto,sans-serif';x.textBaseline='middle';x.textAlign='left';
  const maxW=W*(W>H?.8:.86),lines=wrapWords(x,chunk,maxW),sp=x.measureText(' ').width,lh=fs*1.35;
  const bh=lines.length*lh+22*S,by=H-bh-(W>H?34:90)*S;
  const bw=Math.max(...lines.map(l=>l.reduce((a,c)=>a+c.w+sp,-sp)))+44*S;
  x.fillStyle='rgba(0,0,0,.62)';x.beginPath();x.roundRect?x.roundRect((W-bw)/2,by,bw,bh,16*S):x.rect((W-bw)/2,by,bw,bh);x.fill();
  lines.forEach((l,li)=>{const tw=l.reduce((a,c)=>a+c.w+sp,-sp);let px=(W-tw)/2;const py=by+11*S+lh*(li+.5);
    l.forEach(c=>{const idx=words.indexOf(c.o);x.fillStyle=idx<wordIdx?'#fff':idx===wordIdx?'#ffd23f':'rgba(255,255,255,.45)';x.fillText(c.o.w,px,py);if(idx===wordIdx){x.fillRect(px,py+fs*.55,c.w,3*S)}px+=c.w+sp})});
}
function drawFrame(i,p,t,speaking,wordIdx){
  const s=st.story;if(!s)return;
  const sc=s.scenes[i],gn=st.genre;if(!sc._st)prepScene(sc,gn);
  const x=cv.getContext('2d');x.save();
  const z=1+.07*p,sh=sc.level>.75?Math.sin(t*40)*3*S0:0;
  x.translate(W/2+sh,H/2);x.scale(z,z);x.translate(-W/2,-H/2);
  const pos=drawWorld(x,sc,gn,i,p,t,speaking,W,H,S0,st.hero);
  x.restore();
  drawOverlay(x,sc,gn,p,t,W,H,S0,pos);
  const bar=Math.round(46*S0*(W>H?.5:.3));x.fillStyle='#000';x.fillRect(0,0,W,bar);x.fillRect(0,H-bar,W,bar);
  x.fillStyle='rgba(255,255,255,.85)';x.fillRect(0,0,W*((i+p)/s.scenes.length),4*S0);
  if(t<2.2&&i>=0){const a=Math.min(1,t*2,(2.2-t)*2);x.save();x.globalAlpha=Math.max(0,a);x.textAlign='center';x.textBaseline='middle';x.fillStyle='#fff';x.shadowColor='#000';x.shadowBlur=12*S0;x.font='800 '+Math.round(54*S0)+'px system-ui,sans-serif';x.fillText(i===0?s.title:'Сцена '+(i+1),W/2,H*.2);x.restore()}
  drawSubs(x,sc,wordIdx===undefined?-1:wordIdx,W,H,S0);
}

/* ---------- проигрыватель ---------- */
const cv=$('#cv');let W=1280,H=720,S0=1;
function setFormat(v){W=v?720:1280;H=v?1280:720;S0=v?.9:1;cv.width=W;cv.height=H;$('#stage').classList.toggle('vert',v);if(st.story&&!P.on)drawFrame(P.i,0,0,false,-1)}
$('#vert').onchange=e=>setFormat(e.target.checked);
const P={on:false,i:0,t0:0,wi:-1,dur:6,speaking:false,boundary:false,timed:false,done:false,gen:0,onFinish:null,raf:0,ended:0,safety:0};
function splitWords(text){const a=[],re=/\S+/g;let m;while((m=re.exec(text)))a.push({w:m[0],c:m.index});return a}
function startPlay(from){
  const s=st.story;if(!s)return;stopPlay();
  P.on=true;P.done=false;P.gen++;beginScene(from||0);
  $('#play').textContent='⏸ Пауза';
  cancelAnimationFrame(P.raf);P.raf=requestAnimationFrame(loop);
}
function beginScene(i){
  const s=st.story,sc=s.scenes[i];if(!sc._st)prepScene(sc,st.genre);
  sc._words=splitWords(sc.text);P.i=i;P.t0=performance.now();P.wi=-1;P.boundary=false;P.speaking=false;P.timed=false;P.ended=0;
  const rate=st.voice.rate||1;P.dur=Math.max(4,sc._words.length*.4/rate+.8);
  $$('.scene').forEach(e=>e.classList.remove('act'));const el=$('#sc'+i);if(el){el.classList.add('act');try{el.scrollIntoView({block:'nearest',behavior:'smooth'})}catch(e){}}
  const gen=P.gen;
  if($('#narr').checked){
    cancelSpeech();
    const u=speak(sc.text,{start(){if(gen===P.gen){P.speaking=true}},boundary(ci){if(gen!==P.gen)return;P.boundary=true;let k=0;sc._words.forEach((w,j)=>{if(w.c<=ci)k=j});P.wi=k},end(){if(gen===P.gen&&P.i===i&&P.speaking){P.speaking=false;P.wi=sc._words.length;P.ended=performance.now()}},nostart(){P.timed=true}});
    if(!u)P.timed=true;
    clearTimeout(P.safety);P.safety=setTimeout(()=>{if(gen===P.gen&&P.i===i&&!P.speaking&&!P.ended&&!P.boundary){P.timed=true}},2500);
  }else P.timed=true;
}
function nextScene(){
  const s=st.story;
  if(P.i+1>=s.scenes.length){finish();return}
  beginScene(P.i+1);
}
function finish(){
  P.on=false;P.done=true;cancelSpeech();$('#play').textContent='▶ Ещё раз';
  const x=cv.getContext('2d');x.fillStyle='rgba(0,0,0,.6)';x.fillRect(0,0,W,H);x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';x.font='800 '+Math.round(64*S0)+'px system-ui,sans-serif';x.fillText('КОНЕЦ',W/2,H/2);
  x.font='500 '+Math.round(26*S0)+'px system-ui,sans-serif';x.fillText(st.story.title,W/2,H/2+60*S0);
  if(P.onFinish){const f=P.onFinish;P.onFinish=null;setTimeout(f,600)}
}
function stopPlay(){P.on=false;P.gen++;clearTimeout(P.safety);cancelAnimationFrame(P.raf);cancelSpeech();const b=$('#play');if(b)b.textContent=P.done?'▶ Ещё раз':'▶ Смотреть'}
function loop(now){
  if(!P.on)return;
  const s=st.story,sc=s.scenes[P.i],el=(now-P.t0)/1000;
  const nw=sc._words.length;
  if(P.timed||(!P.speaking&&!P.ended&&!P.boundary&&el>.1&&!$('#narr').checked)){P.wi=Math.min(nw-1,Math.floor(el/P.dur*nw*1.0));}
  else if(P.speaking&&!P.boundary){P.wi=Math.min(nw-1,Math.floor(el/P.dur*nw))}
  const p=Math.min(1,el/P.dur);
  drawFrame(P.i,p,el+P.i*3,P.speaking,P.wi);
  if(P.timed&&el>P.dur+.4)nextScene();
  else if(P.ended&&now-P.ended>650)nextScene();
  else if(!P.timed&&el>P.dur*3+6)nextScene();
  P.raf=requestAnimationFrame(loop);
}
$('#play').onclick=()=>{
  if(P.on){P.on=false;P.paused=true;cancelSpeech();clearTimeout(P.safety);$('#play').textContent='▶ Продолжить';return}
  startPlay(P.paused&&!P.done?P.i:0);P.paused=false;
};
$('#stop').onclick=()=>{P.paused=false;P.done=false;stopPlay();if(st.story)drawFrame(0,0,0,false,-1)};
$('#narr').onchange=()=>{if(P.on){beginScene(P.i)}};

/* ---------- запись и экспорт ---------- */
async function record(withAudio){
  if(!window.MediaRecorder||!cv.captureStream){alert('Этот браузер не умеет записывать canvas. Используй Chrome или экспорт «HTML-видео».');return}
  const stream=cv.captureStream(30);
  if(withAudio){try{const d=await navigator.mediaDevices.getDisplayMedia({video:{displaySurface:'browser'},audio:true,preferCurrentTab:true});d.getAudioTracks().forEach(t=>stream.addTrack(t));d.getVideoTracks().forEach(t=>t.stop());}catch(e){alert('Звук вкладки не подключён — запишу без звука.')}}
  const types=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm','video/mp4'];
  const mime=types.find(t=>MediaRecorder.isTypeSupported(t))||'';
  const rec=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:5e6}:{}),chunks=[];
  rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
  rec.onstop=()=>{const b=new Blob(chunks,{type:rec.mimeType||'video/webm'});dl(b,(st.story.title.replace(/[^\wа-яё]+/gi,'_')||'video')+(b.type.includes('mp4')?'.mp4':'.webm'));$('#rec').disabled=$('#recA').disabled=false;$('#rec').textContent='⏺ Записать видео (.webm)'};
  $('#rec').disabled=$('#recA').disabled=true;$('#rec').textContent='⏺ Идёт запись…';
  rec.start(500);P.onFinish=()=>rec.stop();startPlay(0);
}
$('#rec').onclick=()=>record(false);
$('#recA').onclick=()=>record(true);
function dl(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000)}
$('#expJson').onclick=()=>dl(new Blob([JSON.stringify(project(),null,2)],{type:'application/json'}),'story-project.json');
function project(){const s=JSON.parse(JSON.stringify(st.story,(k,v)=>k[0]==='_'?undefined:v));return {genre:st.genre,hero:st.hero,voice:st.voice,story:s}}
$('#expHtml').onclick=async()=>{
  let src='';
  try{const r=await fetch(location.href.split('#')[0]);if(r.ok)src=await r.text()}catch(e){}
  if(!src||!/id="s4"/.test(src))src='<!doctype html>\n'+document.documentElement.outerHTML;
  const data='window.__PRESET__='+JSON.stringify(project()).replace(/</g,'\\u003c')+';';
  src=src.replace(/<head>/i,'<head><script>'+data+'<\/script>');
  dl(new Blob([src],{type:'text/html'}),'video-'+(st.story.title.replace(/[^\wа-яё]+/gi,'_'))+'.html');
};

/* ---------- старт ---------- */
renderGrid();renderHeroForm();syncVoiceUI();
if(window.__PRESET__){
  const p=window.__PRESET__;st.genre=p.genre;Object.assign(st.hero,p.hero);Object.assign(st.voice,p.voice);st.story=p.story;
  document.body.classList.add('solo');go(4);setTab('p1');renderStudio();
  window.__readyStory=true;
}
window.__app={st,go,startPlay,stopPlay,runAgent,renderStudio};
})();

/* ============================================================
   Движок историй «без шаблонов».
   1) Морфология русского языка: падежи, число, род, согласование, прошедшее время.
   2) Онтология мира: у каждого жанра есть сущности (место, угроза, цель, предметы...).
   3) Симуляция сюжета: состояние героя и мира, действия с условиями и последствиями,
      планировщик выбирает действия по кривой напряжения.
   4) Реализатор: события -> предложения (синтаксис + падежи), без готовых фраз.
   ============================================================ */
(function(root){
'use strict';
const SIB='жшчщ',VEL='гкх',VOW='аеёиоуыэюя';
const last=s=>s.slice(-1);

/* ---------- 1. МОРФОЛОГИЯ ---------- */
const FLEET={'замок':'замк','рынок':'рынк','городок':'городк','незнакомец':'незнакомц','пришелец':'пришельц','огонёк':'огоньк'};
const LOC={'берег':'берегу','лес':'лесу','мост':'мосту','угол':'углу','сад':'саду'};
const STRESSED_OM=['ключ','нож','плащ','врач','мяч','меч','товарищ','сторож','муж'];
function nounSg(w,g,c,an){
  const L=last(w),L2=w.slice(-2),s1=w.slice(0,-1),s2=w.slice(0,-2);
  if(c==='nom')return w;
  if(g==='m'&&(L==='а'||L==='я'))g='f'; // юнга, убийца
  if(c==='prep'&&LOC[w])return LOC[w];
  if(g==='m'&&FLEET[w]){const st=FLEET[w];return c==='acc'?(an?st+'а':w):st+({gen:'а',dat:'у',ins:'ом',prep:'е'}[c])}
  if(g==='m'){
    let stem,t;
    if(L2==='ий'){stem=s2;t={gen:'ия',dat:'ию',ins:'ием',prep:'ии'}}
    else if(L==='й'){stem=s1;t={gen:'я',dat:'ю',ins:'ем',prep:'е'}}
    else if(L==='ь'){stem=s1;t={gen:'я',dat:'ю',ins:'ем',prep:'е'}}
    else{stem=w;const soft=(SIB.includes(L)&&!STRESSED_OM.includes(w))||L==='ц';t={gen:'а',dat:'у',ins:soft?'ем':'ом',prep:'е'}}
    if(c==='acc')return an?stem+t.gen:w;
    return stem+t[c];
  }
  if(g==='f'){
    if(L2==='ия'){const t={gen:'ии',dat:'ии',acc:'ию',ins:'ией',prep:'ии'};return s2+t[c]}
    if(L==='а'){const t={gen:(SIB+VEL).includes(last(s1))?'и':'ы',dat:'е',acc:'у',ins:(SIB+'ц').includes(last(s1))?'ей':'ой',prep:'е'};return s1+t[c]}
    if(L==='я'){const t={gen:'и',dat:'е',acc:'ю',ins:'ей',prep:'е'};return s1+t[c]}
    if(L==='ь'){const t={gen:'и',dat:'и',acc:'ь',ins:'ью',prep:'и'};return s1+t[c]}
    return w;
  }
  // средний род
  if(L2==='ие'){const t={gen:'ия',dat:'ию',acc:'ие',ins:'ием',prep:'ии'};return s2+t[c]}
  if(L==='е'){const sb=SIB.includes(last(s1))||last(s1)==='ц';const t={gen:sb?'а':'я',dat:sb?'у':'ю',acc:'е',ins:'ем',prep:'е'};return s1+t[c]}
  if(L==='о'){const t={gen:'а',dat:'у',acc:'о',ins:'ом',prep:'е'};return s1+t[c]}
  return w;
}
function nounPl(w,g,c,an){
  if(FLEET[w]){const st=FLEET[w],o={nom:st+'ы',gen:st+'ов',dat:st+'ам',ins:st+'ами',prep:st+'ах'};o.acc=an?o.gen:o.nom;return o[c]}
  const L=last(w),L2=w.slice(-2),s1=w.slice(0,-1),s2=w.slice(0,-2);
  if(g==='m'&&(L==='а'||L==='я'))g='f';
  const gen=(stem,e)=>stem+e;let o;
  if(g==='m'){
    if(L2==='ий')o={nom:s2+'ии',gen:s2+'иев',dat:s2+'иям',ins:s2+'иями',prep:s2+'иях'};
    else if(L==='й')o={nom:s1+'и',gen:s1+'ев',dat:s1+'ям',ins:s1+'ями',prep:s1+'ях'};
    else if(L==='ь')o={nom:s1+'и',gen:s1+'ей',dat:s1+'ям',ins:s1+'ями',prep:s1+'ях'};
    else o={nom:w+((SIB+VEL).includes(L)?'и':'ы'),gen:w+(SIB.includes(L)?'ей':'ов'),dat:w+'ам',ins:w+'ами',prep:w+'ах'};
  }else if(g==='f'){
    if(L2==='ия')o={nom:s2+'ии',gen:s2+'ий',dat:s2+'иям',ins:s2+'иями',prep:s2+'иях'};
    else if(L==='а')o={nom:s1+((SIB+VEL).includes(last(s1))?'и':'ы'),gen:s1,dat:s1+'ам',ins:s1+'ами',prep:s1+'ах'};
    else if(L==='я')o={nom:s1+'и',gen:s1+'ь',dat:s1+'ям',ins:s1+'ями',prep:s1+'ях'};
    else if(L==='ь')o={nom:s1+'и',gen:s1+'ей',dat:s1+'ям',ins:s1+'ями',prep:s1+'ях'};
    else return w;
  }else{
    if(L2==='ие')o={nom:s2+'ия',gen:s2+'ий',dat:s2+'иям',ins:s2+'иями',prep:s2+'иях'};
    else if(L==='е'){const sb=SIB.includes(last(s1));o={nom:s1+(sb?'а':'я'),gen:s1+(sb?'':'й'),dat:s1+(sb?'ам':'ям'),ins:s1+(sb?'ами':'ями'),prep:s1+(sb?'ах':'ях')}}
    else if(L==='о')o={nom:s1+'а',gen:s1,dat:s1+'ам',ins:s1+'ами',prep:s1+'ах'};
    else return w;
  }
  o.acc=an?o.gen:o.nom;return o[c];
}
/* прилагательное: лемма (м.р. ед.ч.) -> нужная форма */
function adjForm(a,g,c,pl,an){
  let stem,type;
  if(/(ая|ое)$/.test(a)){const b=a.slice(0,-2),l=last(b);a=b+((VEL+SIB).includes(l)?'ий':'ый')}
  else if(/(яя|ее)$/.test(a))a=a.slice(0,-2)+'ий';
  if(/ый$/.test(a)){stem=a.slice(0,-2);type='hard'}
  else if(/ой$/.test(a)){stem=a.slice(0,-2);type='hard'}
  else if(/ий$/.test(a)){stem=a.slice(0,-2);const l=last(stem);type=VEL.includes(l)?'vel':SIB.includes(l)?'sib':'soft'}
  else return a;
  const T={
   hard:{m:['ый','ого','ому','','ым','ом'],f:['ая','ой','ой','ую','ой','ой'],n:['ое','ого','ому','ое','ым','ом'],p:['ые','ых','ым','','ыми','ых']},
   vel:{m:['ий','ого','ому','','им','ом'],f:['ая','ой','ой','ую','ой','ой'],n:['ое','ого','ому','ое','им','ом'],p:['ие','их','им','','ими','их']},
   sib:{m:['ий','его','ему','','им','ем'],f:['ая','ей','ей','ую','ей','ей'],n:['ее','его','ему','ее','им','ем'],p:['ие','их','им','','ими','их']},
   soft:{m:['ий','его','ему','','им','ем'],f:['яя','ей','ей','юю','ей','ей'],n:['ее','его','ему','ее','им','ем'],p:['ие','их','им','','ими','их']}}[type];
  const ci={nom:0,gen:1,dat:2,acc:3,ins:4,prep:5}[c];
  const row=pl?T.p:T[g==='f'?'f':g==='n'?'n':'m'];
  let e=row[ci];
  if(e===''){ // винительный падеж: одушевлённость
    e=(an?row[1]:row[0]);
  }
  if(a.endsWith('ой')&&!pl&&g==='m'&&c==='nom')return a;
  if(a.endsWith('ой')&&!pl&&g==='m'&&c==='acc'&&!an)return a;
  return stem+e;
}
/* именная группа: "прил прил сущ =замороженное" */
function np(e,c,pl){
  if(pl===undefined)pl=!!e.pl;
  if(e.ind)return e.ph.replace(/=/g,'');
  const key=(pl?'p':'')+c;if(e.o&&e.o[key])return e.o[key];
  const tk=e.ph.split(' ');let hi=-1;
  for(let i=0;i<tk.length;i++)if(tk[i][0]!=='=')hi=i;
  return tk.map((t,i)=>{
    if(t[0]==='=')return t.slice(1);
    if(i<hi)return adjForm(t,e.g,c,pl,e.an);
    if(e.ad||(e.g==='f'&&/ая$/.test(t)))return adjForm(t,e.g,c,pl,e.an);
    return pl?nounPl(t,e.g,c,e.an):nounSg(t,e.g,c,e.an);
  }).join(' ');
}
/* имена людей */
const NAME_ROOT={'Павел':'Павл','Лев':'Льв','Пётр':'Петр','Игорь':'Игор','Лёва':'Лёв'};
function nameForm(name,gender,c){
  if(c==='nom'||!/^[А-ЯЁа-яё\-]+$/.test(name))return name;
  const L=last(name);
  if(NAME_ROOT[name]&&gender==='m'){const r=NAME_ROOT[name];return nounSg(r+'ь','m',c,true).replace(/ь/,'')||name}
  if(gender==='f'&&!/[аяь]$/.test(name))return name;
  if(!/[а-яё]$/.test(name)||/[эиоуыеё]$/.test(name))return name;
  return nounSg(name,gender,c,true);
}
const PRON={m:{nom:'он',gen:'его',dat:'ему',acc:'его',ins:'им',prep:'нём'},f:{nom:'она',gen:'её',dat:'ей',acc:'её',ins:'ей',prep:'ней'},n:{nom:'оно',gen:'его',dat:'ему',acc:'его',ins:'им',prep:'нём'},p:{nom:'они',gen:'их',dat:'им',acc:'их',ins:'ими',prep:'них'}};
function pron(e,c,afterPrep){
  let p=PRON[e.pl?'p':e.g||'m'][c];
  if(afterPrep&&c!=='nom'&&c!=='prep'&&/^[еёи]/.test(p))p='н'+p;
  return p;
}
/* прошедшее время */
const IRR={'идти':['шёл','шла','шло','шли'],'замереть':['замер','замерла','замерло','замерли'],'помочь':['помог','помогла','помогло','помогли'],'лечь':['лёг','легла','легло','легли'],
 'спасти':['спас','спасла','спасло','спасли'],'сесть':['сел','села','село','сели'],'вынести':['вынес','вынесла','вынесло','вынесли'],'принести':['принёс','принесла','принесло','принесли'],
 'довести':['довёл','довела','довело','довели'],'вскрыть':['вскрыл','вскрыла','вскрыло','вскрыли'],'выйти':['вышел','вышла','вышло','вышли'],'украсть':['украл','украла','украло','украли'],
 'выпасть':['выпал','выпала','выпало','выпали'],'упасть':['упал','упала','упало','упали'],'дожить':['дожил','дожила','дожило','дожили'],'умереть':['умер','умерла','умерло','умерли']};
function pastForm(inf,s){
  const g=s&&s.pl?3:({m:0,f:1,n:2}[(s&&s.g)||'n']);
  let refl=false,base=inf;if(/ся$/.test(inf)){refl=true;base=inf.slice(0,-2)}
  let forms=IRR[base];
  if(!forms){
    const m=base.match(/^(.*)йти$/);
    if(m){const pre=m[1];forms=pre==='вы'?['вышел','вышла','вышло','вышли']:[pre+'шёл',pre+'шла',pre+'шло',pre+'шли']}
    else if(/(по|с)мочь$/.test(base)){const p=base.slice(0,-3);forms=[p+'мог',p+'могла',p+'могло',p+'могли']}
    else if(/ти$/.test(base)){return base}
    else{const b=base.replace(/ть$/,'');forms=[b+'л',b+'ла',b+'ло',b+'ли']}
  }
  let f=forms[g];
  if(refl)f+=(g===0?'ся':(/[ауо]|и$/.test(last(f))&&g!==0?'сь':'ся'));
  if(refl&&g!==0)f=forms[g]+'сь';
  return f;
}
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const low=s=>s.charAt(0).toLowerCase()+s.slice(1);

/* ---------- 2. ОНТОЛОГИЯ ---------- */
const n=(ph,g,em,en,x)=>Object.assign({ph,g,em:em||'',en:en||'',id:ph},x||{});
const s=(ph,g,prep)=>({ph,g,prep,id:ph});
const A1={an:1},PL={pl:1,an:1};
const W={};
const def=(id,o)=>{W[id]=o};

def('zombie',{P:n('заброшенный город','m','','abandoned city',{prep:'в'}),sp:[s('пустая улица','f','на'),s('подвал','m','в'),s('крыша','f','на')],
 T:n('мертвец','m','🧟','zombie horde',PL),kind:'c',G:n('эвакуационный пункт','m','📍','evacuation point'),gv:['добраться','до','gen'],
 it:[n('ржавая монтировка','f','🔧','rusty crowbar'),n('рация','f','📻','radio'),n('аптечка','f','🩹','first aid kit')],
 hz:[n('завал','m','🧱','rubble'),n('разбитая машина','f','🚗','wrecked car')],cv:n('ржавый грузовик','m','🚚','rusty truck'),
 A:n('выживший','m','🧑','survivor',{an:1,ad:1}),sg:[n('вой =сирен','m'),n('далёкий выстрел','m')],sec:'betray'});
def('bandits90',{P:n('панельный район','m','','1990s panel district',{prep:'в'}),sp:[s('двор','m','во'),s('подъезд','m','в'),s('гараж','m','в')],
 T:n('бандит','m','🕴️','gangsters in leather jackets',PL),kind:'c',G:n('долг','m','💰','debt'),gv:['вернуть',null,'acc'],
 it:[n('записная книжка','f','📓','notebook'),n('телефон','m','📞','phone'),n('монтировка','f','🔧','crowbar')],
 hz:[n('железная дверь','f','🚪','iron door'),n('чёрный джип','m','🚙','black jeep')],cv:n('ларёк','m','🏪','kiosk'),
 A:n('старый друг','m','🧔','old friend',A1),sg:[n('визг =шин','m'),n('хлопок двери','m')],sec:'betray'});
def('blackout',{P:n('тёмная многоэтажка','f','','dark apartment tower',{prep:'в'}),sp:[s('лестница','f','на'),s('подвал','m','в'),s('крыша','f','на')],
 T:n('тень','f','👤','shadowy figures',{pl:1,an:1,o:{pgen:'теней',pacc:'теней'}}),kind:'c',G:n('распределительный щит','m','🔌','power panel'),gv:['найти',null,'acc'],
 it:[n('фонарь','m','🔦','flashlight'),n('аккумулятор','m','🔋','battery'),n('радиоприёмник','m','📻','radio')],
 hz:[n('запертая дверь','f','🚪','locked door'),n('оборванный кабель','m','⚡','sparking cable')],cv:n('шкаф','m','🗄️','cabinet'),
 A:n('сосед','m','🧑','neighbor',A1),sg:[n('шаг','m','',' ',{pl:1}),n('далёкий грохот','m')],sec:'trap'});
def('postapoc',{P:n('выжженная пустошь','f','','scorched wasteland',{prep:'на'}),sp:[s('бархан','m','на'),s('заправка','f','на'),s('овраг','m','в')],
 T:n('рейдер','m','👹','mutant raiders',PL),kind:'c',G:n('оазис','m','🌴','oasis'),gv:['дойти','до','gen'],
 it:[n('канистра =воды','f','🛢️','water canister'),n('противогаз','m','😷','gas mask'),n('самодельный нож','m','🔪','homemade knife')],
 hz:[n('радиоактивная буря','f','🌪️','radioactive storm'),n('ржавый мост','m','🌉','rusty bridge')],cv:n('остов =автобуса','m','🚌','bus wreck'),
 A:n('странник','m','🧑','wanderer',A1),sg:[n('далёкий взрыв','m'),n('гул =моторов','m')],sec:'trap'});
def('space',{P:n('орбитальная станция','f','','orbital station',{prep:'на'}),sp:[s('шлюз','m','в'),s('реакторный отсек','m','в'),s('командный модуль','m','в')],
 T:n('бортовой компьютер','m','🤖','rogue AI',{an:0}),kind:'c',G:n('реактор','m','⚛️','reactor'),gv:['починить',null,'acc'],
 it:[n('гаечный ключ','m','🔧','wrench'),n('скафандр','m','👨‍🚀','spacesuit'),n('кислородный баллон','m','💨','oxygen tank')],
 hz:[n('утечка =кислорода','f','💨','oxygen leak'),n('заблокированный шлюз','m','🚪','sealed airlock')],cv:n('грузовой контейнер','m','📦','cargo container'),
 A:n('бортинженер','m','🧑‍🚀','flight engineer',A1),sg:[n('сирена =тревоги','f'),n('мигание =ламп','n')],sec:'sympathy'});
def('pirates',{P:n('палуба =галеона','f','','galleon deck',{prep:'на'}),sp:[s('бак','m','на'),s('трюм','m','в'),s('капитанская каюта','f','в')],
 T:n('вражеский пират','m','☠️','rival pirates',PL),kind:'c',G:n('остров =сокровищ','m','🏝️','treasure island'),gv:['найти',null,'acc'],
 it:[n('старая карта','f','🗺️','old map'),n('абордажная сабля','f','🗡️','cutlass'),n('подзорная труба','f','🔭','spyglass')],
 hz:[n('шторм','m','⛈️','storm'),n('коварный риф','m','🪨','reef')],cv:n('бочка','f','🛢️','barrel'),
 A:n('юнга','m','🧒','cabin boy',A1),sg:[n('скрип =снастей','m'),n('пушечный выстрел','m')],sec:'trap'});
def('fantasy',{P:n('королевство','n','','fantasy kingdom',{prep:'в'}),sp:[s('проклятый лес','m','в'),s('горный перевал','m','на'),s('каменный мост','m','на')],
 T:n('дракон','m','🐉','giant dragon',A1),kind:'c',G:n('меч =древних','m','🗡️','ancient sword'),gv:['добыть',null,'acc'],
 it:[n('зачарованный амулет','m','📿','enchanted amulet'),n('путевой посох','m','🪄','staff'),n('лечебное зелье','n','🧪','healing potion')],
 hz:[n('колдовской туман','m','🌫️','magic fog'),n('каменный обвал','m','🪨','rockslide')],cv:n('древний дуб','m','🌳','ancient oak'),
 A:n('бродячий маг','m','🧙','wandering mage',A1),sg:[n('рёв =дракона','m'),n('зарево над горами','n')],sec:'betray'});
def('cyberpunk',{P:n('неоновый мегаполис','m','','neon megacity',{prep:'в'}),sp:[s('грязный переулок','m','в'),s('ночной рынок','m','на'),s('крыша =небоскрёба','f','на')],
 T:n('кибернаёмник','m','🤖','cyborg mercenaries',PL),kind:'c',G:n('секретный чип','m','💾','secret data chip'),gv:['украсть',null,'acc'],
 it:[n('хакерский терминал','m','💻','hacker deck'),n('дымовая шашка','f','💨','smoke grenade'),n('неоновая куртка','f','🧥','neon jacket')],
 hz:[n('камера слежения','f','📹','surveillance camera'),n('электронный замок','m','🔒','electronic lock')],cv:n('мусорный контейнер','m','🗑️','dumpster'),
 A:n('уличный хакер','m','🧑‍💻','street hacker',A1),sg:[n('гул =дронов','m'),n('вой =сирен','m')],sec:'self'});
def('noir',{P:n('дождливый город','m','','rainy noir city',{prep:'в'}),sp:[s('контора','f','в'),s('набережная','f','на'),s('бар','m','в')],
 T:n('незнакомец','m','🕴️','mysterious stranger in a trench coat',A1),kind:'c',G:n('убийца','m','🔍','killer',A1),gv:['найти',null,'acc'],
 it:[n('блокнот','m','📓','notebook'),n('фотография','f','📷','photograph'),n('лупа','f','🔍','magnifying glass')],
 hz:[n('закрытая дверь','f','🚪','closed door'),n('густой туман','m','🌫️','thick fog')],cv:n('фонарный столб','m','💡','lamp post'),
 A:n('журналистка','f','👩‍💼','journalist',A1),sg:[n('одинокий выстрел','m'),n('женский крик','m')],sec:'betray'});
def('island',{P:n('необитаемый остров','m','','deserted island',{prep:'на'}),sp:[s('берег','m','на'),s('пальмовая роща','f','в'),s('скала','f','на')],
 T:n('шторм','m','⛈️','tropical storm'),kind:'f',G:n('плот','m','🛶','raft'),gv:['построить',null,'acc'],
 it:[n('верёвка','f','🪢','rope'),n('топор','m','🪓','axe'),n('кокос','m','🥥','coconut')],
 hz:[n('коварный прибой','m','🌊','surf'),n('ядовитая змея','f','🐍','venomous snake')],cv:n('пальма','f','🌴','palm tree'),
 A:n('обезьяна','f','🐒','monkey',A1),sg:[n('раскат грома','m'),n('крик =чайки','m')],sec:'trap'});
def('haunted',{P:n('старый особняк','m','','haunted mansion',{prep:'в'}),sp:[s('тёмный холл','m','в'),s('библиотека','f','в'),s('чердак','m','на')],
 T:n('призрак','m','👻','pale ghost',A1),kind:'c',G:n('выход','m','🚪','exit'),gv:['найти',null,'acc'],
 it:[n('свеча','f','🕯️','candle'),n('старый ключ','m','🗝️','old key'),n('дневник','m','📖','diary')],
 hz:[n('запертая дверь','f','🚪','locked door'),n('скрипучая лестница','f','🪜','creaking stairs')],cv:n('тяжёлая портьера','f','🪞','heavy curtain'),
 A:n('служанка','f','👩','maid',A1),sg:[n('шёпот','m'),n('скрип =половиц','m')],sec:'sympathy'});
def('vampires',{P:n('готический город','m','','gothic city',{prep:'в'}),sp:[s('кладбище','n','на'),s('собор','m','в'),s('крыша','f','на')],
 T:n('вампир','m','🧛','vampires',PL),kind:'c',G:n('серебряный клинок','m','🗡️','silver blade'),gv:['найти',null,'acc'],
 it:[n('осиновый кол','m','🪵','wooden stake'),n('факел','m','🔥','torch'),n('распятие','n','✝️','crucifix')],
 hz:[n('запечатанная дверь','f','🚪','sealed door'),n('стая =летучих =мышей','f','🦇','swarm of bats')],cv:n('надгробие','n','🪦','tombstone'),
 A:n('охотник','m','🏹','hunter',A1),sg:[n('хлопанье =крыльев','n'),n('волчий вой','m')],sec:'betray'});
def('ninja',{P:n('горный замок','m','','mountain castle',{prep:'в'}),sp:[s('бамбуковая роща','f','в'),s('каменная лестница','f','на'),s('внутренний двор','m','во')],
 T:n('воин =клана','m','🥷','rival ninja clan',PL),kind:'c',G:n('священный свиток','m','📜','sacred scroll'),gv:['вернуть',null,'acc'],
 it:[n('дымовая бомба','f','💨','smoke bomb'),n('верёвка =с =крюком','f','🪝','grappling hook'),n('сюрикен','m','✴️','shuriken')],
 hz:[n('бдительный часовой','m','💂','alert guard',A1),n('скрипучий пол','m','🪵','squeaky floor')],cv:n('каменный фонарь','m','🏮','stone lantern'),
 A:n('старый мастер','m','🧙','old master',A1),sg:[n('удар =гонга','m'),n('шорох бамбука','m')],sec:'trap'});
def('western',{P:n('пыльный городок','m','','dusty western town',{prep:'в'}),sp:[s('салун','m','в'),s('главная улица','f','на'),s('каньон','m','в')],
 T:n('бандит','m','🤠','outlaw gang',PL),kind:'c',G:n('городок','m','🏘️','town'),gv:['защитить',null,'acc'],
 it:[n('винчестер','m','🔫','rifle'),n('динамит','m','🧨','dynamite'),n('лошадь','f','🐎','horse')],
 hz:[n('каменная осыпь','f','🪨','rock slide'),n('пересохшая река','f','🏜️','dry riverbed')],cv:n('бочка','f','🛢️','barrel'),
 A:n('шериф','m','⭐','sheriff',A1),sg:[n('топот =копыт','m'),n('одинокий выстрел','m')],sec:'self'});
def('aliens',{P:n('тихий городок','m','','quiet small town',{prep:'в'}),sp:[s('пшеничное поле','n','на'),s('ферма','f','на'),s('радиовышка','f','на')],
 T:n('пришелец','m','👽','alien invaders',{pl:1,an:1,o:{gen:'пришельца',dat:'пришельцу',acc:'пришельца',ins:'пришельцем',prep:'пришельце',pgen:'пришельцев',pacc:'пришельцев'}}),kind:'c',
 G:n('сигнал','m','📡','mind-control signal'),gv:['отключить',null,'acc'],
 it:[n('бинокль','m','🔭','binoculars'),n('радиоприёмник','m','📻','radio'),n('канистра','f','🛢️','canister')],
 hz:[n('яркий луч','m','🔦','searchlight beam'),n('патрульный дрон','m','🛸','patrol drone')],cv:n('стог =сена','m','🌾','haystack'),
 A:n('фермер','m','🧑‍🌾','farmer',A1),sg:[n('странный гул','m'),n('вспышка =в =небе','f')],sec:'sympathy'});
def('timemachine',{P:n('старая лаборатория','f','','old laboratory',{prep:'в'}),sp:[s('древний город','m','в'),s('поле =боя','n','на'),s('будущая улица','f','на')],
 T:n('страж =времени','m','⌛','time guardians',PL),kind:'c',G:n('родное время','n','🏠','own time'),gv:['вернуться','в','acc'],
 it:[n('компас','m','🧭','compass'),n('шестерёнка','f','⚙️','gear'),n('дневник','m','📖','diary')],
 hz:[n('временная воронка','f','🌀','time vortex'),n('сломанный механизм','m','⚙️','broken mechanism')],cv:n('каменная колонна','f','🏛️','stone column'),
 A:n('странствующий учёный','m','🧑‍🔬','wandering scientist',A1),sg:[n('тиканье =часов','n'),n('гул портала','m')],sec:'self'});
def('underwater',{P:n('глубоководная станция','f','','deep sea station',{prep:'на'}),sp:[s('тёмный коридор','m','в'),s('шлюзовая камера','f','в'),s('морское дно','n','на')],
 T:n('морское чудовище','n','🦑','giant sea monster',A1),kind:'c',G:n('подводный город','m','🏙️','underwater city'),gv:['добраться','до','gen'],
 it:[n('акваланг','m','🤿','scuba gear'),n('гарпун','m','🔱','harpoon'),n('сигнальный фонарь','m','🔦','signal lamp')],
 hz:[n('сильное течение','n','🌊','strong current'),n('трещина =в =корпусе','f','💥','hull crack')],cv:n('коралловый риф','m','🪸','coral reef'),
 A:n('ныряльщик','m','🤿','diver',A1),sg:[n('писк =сонара','m'),n('глухой удар','m')],sec:'sympathy'});
def('magic',{P:n('академия =волшебства','f','','magic academy',{prep:'в'}),sp:[s('библиотека','f','в'),s('высокая башня','f','в'),s('подземелье','n','в')],
 T:n('тёмный маг','m','🧙','dark sorcerer',A1),kind:'c',G:n('магический артефакт','m','🔮','magic artifact'),gv:['собрать',null,'acc'],
 it:[n('волшебная палочка','f','🪄','wand'),n('книга =заклинаний','f','📖','spellbook'),n('зелье','n','🧪','potion')],
 hz:[n('ожившая статуя','f','🗿','living statue'),n('меняющаяся лестница','f','🪜','shifting staircase')],cv:n('высокий стеллаж','m','📚','tall bookshelf'),
 A:n('однокурсник','m','🧑‍🎓','classmate',A1),sg:[n('раскат грома','m'),n('вспышка =заклинания','f')],sec:'betray'});
def('superhero',{P:n('огромный мегаполис','m','','huge megacity',{prep:'в'}),sp:[s('небоскрёб','m','на'),s('мост','m','на'),s('площадь','f','на')],
 T:n('суперзлодей','m','🦹','supervillain',A1),kind:'c',G:n('заложник','m','🧑‍🤝‍🧑','hostages',PL),gv:['спасти',null,'acc'],
 it:[n('плащ','m','🦸','cape'),n('маска','f','🎭','mask'),n('щит','m','🛡️','shield')],
 hz:[n('обрушенный мост','m','🌉','collapsed bridge'),n('взрыв','m','💥','explosion')],cv:n('автобус','m','🚌','bus'),
 A:n('репортёр','m','🎤','reporter',A1),sg:[n('вой =сирен','m'),n('далёкий взрыв','m')],sec:'self'});
def('heist',{P:n('банк','m','','bank',{prep:'в'}),sp:[s('вестибюль','m','в'),s('вентиляционная шахта','f','в'),s('хранилище','n','в')],
 T:n('охранник','m','🚨','security guards',PL),kind:'c',G:n('сейф','m','🔐','vault safe'),gv:['вскрыть',null,'acc'],
 it:[n('отмычка','f','🗝️','lockpick'),n('чертёж','m','📐','blueprint'),n('рация','f','📻','radio')],
 hz:[n('лазерная сетка','f','🔴','laser grid'),n('электронный замок','m','🔒','electronic lock')],cv:n('мраморная колонна','f','🏛️','marble column'),
 A:n('взломщик','m','🧑‍💻','hacker',A1),sg:[n('писк =сигнализации','m'),n('гул =вентиляции','m')],sec:'trap'});
def('spy',{P:n('старый европейский город','m','','old European city',{prep:'в'}),sp:[s('вокзал','m','на'),s('крыша =поезда','f','на'),s('набережная','f','на')],
 T:n('вражеский агент','m','🕶️','enemy agents',PL),kind:'c',G:n('чемоданчик','m','💼','briefcase'),gv:['передать',null,'acc'],
 it:[n('шифровальный блокнот','m','📓','cipher pad'),n('фальшивый паспорт','m','🛂','fake passport'),n('зонт','m','☂️','umbrella')],
 hz:[n('пограничный пост','m','🛃','border checkpoint'),n('плотная толпа','f','👥','dense crowd')],cv:n('газетный киоск','m','📰','newsstand'),
 A:n('связной','m','🧑','contact',{an:1,ad:1}),sg:[n('гудок =поезда','m'),n('далёкий свисток','m')],sec:'betray'});
def('arctic',{P:n('полярная станция','f','','polar station',{prep:'на'}),sp:[s('ледяное поле','n','на'),s('снежная пещера','f','в'),s('ледник','m','на')],
 T:n('снежная буря','f','❄️','blizzard',{}),kind:'f',G:n('соседняя станция','f','🏠','neighbor station'),gv:['добраться','до','gen'],
 it:[n('ледоруб','m','⛏️','ice axe'),n('спальный мешок','m','🛏️','sleeping bag'),n('ракетница','f','🧨','flare gun')],
 hz:[n('ледяная трещина','f','🧊','ice crevasse'),n('сломанный вездеход','m','🚙','broken snowmobile')],cv:n('снежный занос','m','⛄','snowdrift'),
 A:n('учёный','m','🧑‍🔬','scientist',{an:1,ad:1}),sg:[n('треск =льда','m'),n('вой =ветра','m')],sec:'trap'});
def('flood',{P:n('затопленный город','m','','flooded city',{prep:'в'}),sp:[s('улица','f','на'),s('крыша =дома','f','на'),s('мост','m','на')],
 T:n('бурный поток','m','🌊','raging flood',{}),kind:'f',G:n('точка =эвакуации','f','📍','evacuation point'),gv:['добраться','до','gen'],
 it:[n('надувная лодка','f','🛶','inflatable boat'),n('спасательный жилет','m','🦺','life vest'),n('верёвка','f','🪢','rope')],
 hz:[n('сильное течение','n','🌊','strong current'),n('оборванный провод','m','⚡','live wire')],cv:n('перевёрнутая лодка','f','🛶','overturned boat'),
 A:n('спасатель','m','🧑‍🚒','rescuer',A1),sg:[n('рёв =воды','m'),n('далёкая сирена','f')],sec:'trap'});
def('dino',{P:n('тропический остров','m','','tropical island',{prep:'на'}),sp:[s('болото','n','на'),s('берег реки','m','на'),s('холм','m','на')],
 T:n('тираннозавр','m','🦖','tyrannosaurus',A1),kind:'c',G:n('вертолётная площадка','f','🚁','helipad'),gv:['добраться','до','gen'],
 it:[n('фонарь','m','🔦','flashlight'),n('шокер','m','⚡','stun gun'),n('рация','f','📻','radio')],
 hz:[n('обрушенный мост','m','🌉','collapsed bridge'),n('бурная река','f','🌊','wild river')],cv:n('поваленное дерево','n','🪵','fallen tree'),
 A:n('палеонтолог','m','🧑‍🔬','paleontologist',A1),sg:[n('далёкий рёв','m'),n('тяжёлый топот','m')],sec:'trap'});
def('robots',{P:n('умный город','m','','smart city',{prep:'в'}),sp:[s('центральная площадь','f','на'),s('подземный гараж','m','в'),s('серверный зал','m','в')],
 T:n('мятежный робот','m','🤖','rebel robots',PL),kind:'c',G:n('главный сервер','m','🖥️','main server'),gv:['найти',null,'acc'],
 it:[n('отвёртка','f','🪛','screwdriver'),n('провод','m','🔌','cable'),n('батарея','f','🔋','battery')],
 hz:[n('запертая дверь','f','🚪','locked door'),n('лазерная сетка','f','🔴','laser grid')],cv:n('торговый автомат','m','🥤','vending machine'),
 A:n('старый робот','m','🦾','old robot',A1),sg:[n('механический лязг','m'),n('гул =моторов','m')],sec:'sympathy'});
def('maze',{P:n('каменный лабиринт','m','','stone maze',{prep:'в'}),sp:[s('узкий коридор','m','в'),s('зал =с =колоннами','m','в'),s('тупик','m','в')],
 T:n('хранитель =лабиринта','m','👁️','maze guardian',A1),kind:'c',G:n('выход','m','🚪','exit'),gv:['найти',null,'acc'],
 it:[n('клубок =нити','m','🧶','ball of thread'),n('факел','m','🔥','torch'),n('мел','m','✏️','chalk')],
 hz:[n('движущаяся стена','f','🧱','moving wall'),n('ловушка =с =шипами','f','🕳️','spike trap')],cv:n('каменная колонна','f','🏛️','stone pillar'),
 A:n('заблудившийся путник','m','🧑','lost traveler',A1),sg:[n('скрежет =камня','m'),n('эхо =шагов','n')],sec:'self'});
def('racing',{P:n('трасса =смерти','f','','death race track',{prep:'на'}),sp:[s('старт','m','на'),s('крутой поворот','m','на'),s('мост','m','на')],
 T:n('вражеский гонщик','m','🚙','rival racers',PL),kind:'c',G:n('финиш','m','🏁','finish line'),gv:['доехать','до','gen'],
 it:[n('канистра =топлива','f','⛽','fuel can'),n('запаска','f','🛞','spare tire'),n('шлем','m','⛑️','helmet')],
 hz:[n('глубокая яма','f','🕳️','pit'),n('горящая покрышка','f','🔥','burning tire')],cv:n('бетонный блок','m','🧱','concrete block'),
 A:n('механик','m','🔧','mechanic',A1),sg:[n('рёв =моторов','m'),n('визг =шин','m')],sec:'trap'});
def('egypt',{P:n('древняя гробница','f','','ancient tomb',{prep:'в'}),sp:[s('погребальный зал','m','в'),s('коридор =с =ловушками','m','в'),s('тайная камера','f','в')],
 T:n('мумия','f','💀','mummies',PL),kind:'c',G:n('золотой артефакт','m','🏺','golden artifact'),gv:['вынести',null,'acc'],
 it:[n('факел','m','🔥','torch'),n('кирка','f','⛏️','pickaxe'),n('верёвка','f','🪢','rope')],
 hz:[n('каменная плита','f','🪨','stone slab'),n('внезапный обвал','m','🪨','cave-in')],cv:n('саркофаг','m','⚰️','sarcophagus'),
 A:n('археолог','m','🧑','archaeologist',A1),sg:[n('шёпот','m'),n('скрежет =плиты','m')],sec:'trap'});
def('vikings',{P:n('суровый фьорд','m','','harsh fjord',{prep:'в'}),sp:[s('драккар','m','на'),s('туманный берег','m','на'),s('горный перевал','m','на')],
 T:n('вражеский воин','m','🪓','rival warriors',PL),kind:'c',G:n('вражеское селение','n','🔥','enemy village'),gv:['добраться','до','gen'],
 it:[n('боевой топор','m','🪓','battle axe'),n('щит','m','🛡️','shield'),n('рог','m','📯','war horn')],
 hz:[n('ледяной шторм','m','🌨️','ice storm'),n('коварный камень','m','🪨','hidden rock')],cv:n('валун','m','🪨','boulder'),
 A:n('старый скальд','m','🧙','old skald',A1),sg:[n('удар =барабана','m'),n('зов =рога','m')],sec:'sympathy'});
def('arena',{P:n('огромная арена','f','','giant arena',{prep:'на'}),sp:[s('тёмный тоннель','m','в'),s('центр =арены','m','в'),s('трибуна','f','на')],
 T:n('гладиатор','m','🎯','arena fighters',PL),kind:'c',G:n('финал','m','🏆','final round'),gv:['дожить','до','gen'],
 it:[n('щит','m','🛡️','shield'),n('шлем','m','⛑️','helmet'),n('копьё','n','🔱','spear')],
 hz:[n('скрытая ловушка','f','🕳️','hidden trap'),n('огненная стена','f','🔥','wall of fire')],cv:n('мраморная колонна','f','🏛️','marble column'),
 A:n('бывший чемпион','m','🏅','former champion',A1),sg:[n('рёв =толпы','m'),n('удар =гонга','m')],sec:'trap'});
def('camp',{P:n('летний лагерь','m','','summer camp',{prep:'в'}),sp:[s('лесная тропа','f','на'),s('домик =вожатых','m','в'),s('причал','m','на')],
 T:n('тёмный силуэт','m','🎭','masked silhouette',A1),kind:'c',G:n('дорога','f','🛣️','road'),gv:['добежать','до','gen'],
 it:[n('фонарик','m','🔦','flashlight'),n('свисток','m','📯','whistle'),n('рация','f','📻','radio')],
 hz:[n('поваленное дерево','n','🪵','fallen tree'),n('густой туман','m','🌫️','thick fog')],cv:n('старая лодка','f','🛶','old boat'),
 A:n('вожатый','m','🧑','camp counselor',{an:1,ad:1}),sg:[n('хруст =веток','m'),n('крик =совы','m')],sec:'sympathy'});
def('fairytale',{P:n('заколдованный лес','m','','enchanted forest',{prep:'в'}),sp:[s('сказочная поляна','f','на'),s('высокая башня','f','в'),s('пряничный домик','m','в')],
 T:n('обиженная колдунья','f','🧙‍♀️','offended witch',A1),kind:'c',G:n('счастливый конец','m','📖','happy ending'),gv:['вернуть',null,'acc'],
 it:[n('волшебное зеркальце','n','🪞','magic mirror'),n('клубок','m','🧶','ball of yarn'),n('корзинка','f','🧺','basket')],
 hz:[n('колючий куст','m','🌿','thorn bush'),n('говорящий пень','m','🪵','talking stump')],cv:n('старый пень','m','🪵','old stump'),
 A:n('говорящая лиса','f','🦊','talking fox',A1),sg:[n('звон =колокольчика','m'),n('тихий смех','m')],sec:'sympathy'});
def('metro',{P:n('станция =метро','f','','metro station',{prep:'на'}),sp:[s('тоннель','m','в'),s('платформа','f','на'),s('вагон','m','в')],
 T:n('мутант','m','🐀','tunnel mutants',PL),kind:'c',G:n('чистая станция','f','🚇','clean station'),gv:['добраться','до','gen'],
 it:[n('противогаз','m','😷','gas mask'),n('фильтр','m','🧪','filter'),n('фонарь','m','🔦','lantern')],
 hz:[n('обвал','m','🪨','cave-in'),n('облако =газа','n','💨','gas cloud')],cv:n('ржавая дрезина','f','🚃','rusty handcar'),
 A:n('сталкер','m','🧑','stalker',A1),sg:[n('далёкий вой','m'),n('капанье =воды','n')],sec:'sympathy'});
def('virus',{P:n('закрытый город','m','','quarantined city',{prep:'в'}),sp:[s('пустая улица','f','на'),s('больница','f','в'),s('блокпост','m','на')],
 T:n('заражённый','m','🦠','infected crowd',{pl:1,an:1,ad:1}),kind:'c',G:n('вакцина','f','💉','vaccine'),gv:['доставить',null,'acc'],
 it:[n('защитный костюм','m','🥼','hazmat suit'),n('маска','f','😷','mask'),n('шприц','m','💉','syringe')],
 hz:[n('карантинный кордон','m','🚧','quarantine cordon'),n('зелёный туман','m','🌫️','green fog')],cv:n('фургон','m','🚑','van'),
 A:n('врач','m','🧑‍⚕️','doctor',{an:1,o:{ins:'врачом'}}),sg:[n('сирена','f'),n('вой =ветра','m')],sec:'cause'});
def('meteor',{P:n('обречённый город','m','','doomed city',{prep:'в'}),sp:[s('шоссе','n','на',),s('вокзал','m','на'),s('горный склон','m','на')],
 T:n('метеоритный дождь','m','☄️','meteor shower'),kind:'f',G:n('убежище','n','🏔️','shelter'),gv:['добраться','до','gen'],
 it:[n('карта','f','🗺️','map'),n('канистра =бензина','f','⛽','fuel can'),n('рация','f','📻','radio')],
 hz:[n('автомобильная пробка','f','🚗','traffic jam'),n('трещина =в =асфальте','f','💥','road crack')],cv:n('бетонная плита','f','🧱','concrete slab'),
 A:n('водитель','m','🚚','driver',A1),sg:[n('огненный след','m'),n('гул =в =небе','m')],sec:'trap'});
def('bunker',{P:n('герметичный бункер','m','','sealed bunker',{prep:'в'}),sp:[s('жилой отсек','m','в'),s('склад','m','на'),s('генераторная','f','в')],
 T:n('таинственный стук','m','🚪','mysterious knocking'),kind:'f',iv:['раздаться'],G:n('рассвет','m','🌅','dawn'),gv:['дожить','до','gen'],
 it:[n('запас =консервов','m','🥫','canned food'),n('фонарь','m','🔦','flashlight'),n('радиоприёмник','m','📻','radio')],
 hz:[n('сломанный генератор','m','🔋','broken generator'),n('запертая дверь','f','🚪','locked door')],cv:n('железная бочка','f','🛢️','iron barrel'),
 A:n('старик','m','👴','old man',A1),sg:[n('гул =труб','m'),n('приглушённый стук','m')],sec:'betray'});
def('skyscraper',{P:n('горящий небоскрёб','m','','burning skyscraper',{prep:'в'}),sp:[s('задымлённая лестница','f','на'),s('офисный этаж','m','на'),s('крыша','f','на')],
 T:n('пожар','m','🔥','raging fire'),kind:'f',G:n('аварийный выход','m','🚪','emergency exit'),gv:['добраться','до','gen'],
 it:[n('огнетушитель','m','🧯','fire extinguisher'),n('мокрая тряпка','f','🧣','wet cloth'),n('топор','m','🪓','axe')],
 hz:[n('рухнувшее перекрытие','n','🧱','collapsed slab'),n('густой дым','m','💨','thick smoke')],cv:n('офисный стол','m','🗄️','office desk'),
 A:n('пожарный','m','🧑‍🚒','firefighter',{an:1,ad:1}),sg:[n('треск =пламени','m'),n('сигнал =тревоги','m')],sec:'trap'});

/* ---------- словарь общих сущностей ---------- */
const COM={
 path:n('путь','m'),hand:n('рука','f'),hands:n('рука','f','','',{pl:1,o:{pgen:'рук'}}),help:n('помощь','f'),price:n('высокая цена','f'),victory:n('победа','f'),
 trap:n('ловушка','f'),lie:n('обман','m'),friends:n('друг','m','','',{pl:1,an:1,o:{pdat:'друзьям',pgen:'друзей',pacc:'друзей',pins:'друзьями',pprep:'друзьях',pnom:'друзья'}}),dawn:n('рассвет','m'),silence:n('тишина','f'),relief:n('облегчение','n'),
 fear:n('страх','m'),horror:n('ужас','m'),panic:n('паника','f'),tension:n('тревога','f'),doubt:n('сомнение','n'),hope:n('надежда','f'),thrill:n('азарт','m'),calm:n('спокойствие','n'),
 despair:n('отчаяние','n'),cold:n('холод','m'),heart:n('сердце','n'),throat:n('горло','n'),chest:n('грудь','f'),legs:n('нога','f','','',{pl:1,o:{pgen:'ног'}}),
 cause:n('причина =всего','f'),mist:n('лёгкая дымка','f')
};
const FX={rain:[n('дождь','m'),'идти'],snow:[n('снег','m'),'идти'],dust:[n('пыль','f'),'висеть'],embers:[n('пепел','m'),'кружиться'],stars:[n('звезда','f','','',{pl:1,o:{pnom:'звёзды'}}),'мерцать'],bubbles:[n('пузырь','m','','',{pl:1}),'подниматься'],none:null};
const FXADJ={rain:'холодный',snow:'колючий',dust:'густой',embers:'горячий',stars:'далёкий',bubbles:'мелкий'};

/* ---------- 3. ГЕНЕРАТОР ---------- */
function rngFrom(seed){let a=seed>>>0||1;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const SHOTS=['wide establishing shot','medium shot','tracking shot following the hero','close-up on the face','low angle dynamic shot','handheld chase shot','slow pull-back wide shot','over-the-shoulder shot'];

function findWorld(gn){
  if(W[gn.id])return W[gn.id];
  // своя идея: ближайший мир по совпадению корней слов
  const idea=(gn.custom||'').toLowerCase().match(/[а-яё]{4,}/g)||[];
  let best=null,bs=-1;
  for(const id in W){
    const w=W[id],bag=[GENRES_NAME(id),w.P.ph,w.T.ph,w.G.ph,w.sp.map(x=>x.ph).join(' '),w.it.map(x=>x.ph).join(' '),w.hz.map(x=>x.ph).join(' ')].join(' ').toLowerCase();
    let sc=0;idea.forEach(t=>{const r=t.slice(0,Math.max(4,t.length-2));if(bag.includes(r))sc+=2});
    sc+=Math.random()*.5;if(sc>bs){bs=sc;best=id}
  }
  return W[best];
}
function GENRES_NAME(id){const g=(root.GENRES||[]).find(x=>x.id===id);return g?g.n:''}

function generate(gn,hero,tone,opts){
  opts=opts||{};
  const seed=opts.seed||((Math.random()*2**31)|0),rnd=rngFrom(seed);
  const pick=a=>a[Math.floor(rnd()*a.length)];
  const chance=p=>rnd()<p;
  const w=findWorld(gn),N=opts.scenes||6;
  const H={id:'H',g:hero.gender==='f'?'f':'m',an:1,name:hero.name};
  const P=w.P,T=w.T,G=w.G,A=w.A;
  const comp=opts.comp||null;
  T.id='T';A.id='A';
  const Cm=comp?{id:'C',g:comp.gender==='f'?'f':'m',an:1,name:comp.name}:null;
  const dark=!!(gn.dark>.5);
  const st={hp:3,items:[],ally:false,spot:-1,aware:false,seenT:false,tension:.1,usedAlly:false};
  const R={last:null};let curAct='';
  /* ссылающиеся выражения */
  const refH=c=>{
    if(c==='nom'){
      if(R.last==='H'&&chance(.85)){return pron(H,'nom')}
      const useEpi=H.g==='m'&&R.last!=='H'&&curAct!=='intro'&&chance(.12)&&hero.prof;
      return useEpi?low(hero.prof):nameForm(hero.name,H.g,'nom');
    }
    return R.last==='H'&&chance(.7)?pron(H,c):nameForm(hero.name,H.g,c);
  };
  const X=(e,c,prep)=>{
    if(e===H)return prep&&c!=='nom'?pron(H,c,true):refH(c);
    if(Cm&&e===Cm){if(c==='nom'&&R.last==='C'&&chance(.8))return pron(Cm,'nom');return nameForm(comp.name,Cm.g,c)}
    if(e===A&&R.last==='A'&&c==='nom')return pron(A,'nom');
    return np(e,c);
  };
  const PP=(p,e,c)=>{const nx=e===H?'':np(e,c);if(p==='в'&&/^[вф][^аеёиоуыэюя]/i.test(nx))p='во';if(p==='с'&&/^[сзшж][^аеёиоуыэюя]/i.test(nx))p='со';const ph=e===H?pron(H,c,true):np(e,c);return p+' '+ph};
  /* K: предложение из подлежащего, глагола и дополнений */
  function K(sub,verb,o){
    o=o||{};
    const subj=sub&&!o.drop?X(sub,'nom'):'';
    const v=(o.neg?'не ':'')+(sub?pastForm(verb,sub):pastForm(verb,{g:'n'}));
    let d='',i='',pp='',pr='';
    if(o.d){let c=o.d[1];if(o.neg&&c==='acc')c='gen';d=X(o.d[0],c)}
    if(o.i)i=X(o.i[0],o.i[1]);
    if(o.pp)pp=(Array.isArray(o.pp[0])?o.pp:[o.pp]).map(a=>PP(a[0],a[1],a[2])).join(' ');
    if(o.pred)pr=np(o.pred[0],o.pred[1]);if(o.predS)pr=o.predS;
    const adv=o.adv||'';
    const parts=o.inv?[adv,pp,v,subj,i,d,pr,o.inf||'',o.end||'']:o.dinv?[adv,subj,v,d,i,pp,pr,o.inf||'',o.end||'']:[adv,subj,v,i,d,pp,pr,o.inf||'',o.end||''];
    if(sub)R.last=sub.id;
    return parts.filter(Boolean).join(' ');
  }
  const spotP=sp=>[sp.prep,sp,'prep'];const FROM=sp=>sp.prep==='на'?'с':'из';
  const curSpot=()=>st.spot<0?P:w.sp[st.spot];

  /* события: возвращают {c:[{t,rel}],vis,en,act} */
  const ev={};
  const cmNoun=()=>comp?(comp.age<14?(Cm.g==='f'?'девочка':'мальчик'):(Cm.g==='f'?'девушка':'парень')):'';
  ev.intro=()=>{
    const c=[],fx=FX[gn.fx]&&gn.fx!=='none'?FX[gn.fx]:null;
    const hab=pick(['оказаться','оказаться','находиться']);
    // 1) где — с фронтированием обстоятельства места
    c.push({t:K(H,hab==='находиться'?'находиться':'оказаться',{pp:[P.prep,P,'prep'],inv:chance(.5)}),rel:'start'});
    // 2) атмосфера
    if(fx){const nn=fx[0];const adj=FXADJ[gn.fx];const e=Object.assign({},nn,{ph:(adj?adj+' ':'')+nn.ph});e.id='fx';
      c.push({t:K(e,fx[1],{adv:pick(['вокруг','над головой','вдалеке']),inv:true}),rel:'and'});}
    else if(dark)c.push({t:K(n('темнота','f'),'сгущаться',{adv:'вокруг',inv:true}),rel:'and'});
    // 3) кто
    const trait=hero.traitAdj||'храбрый';
    c.push({t:`${nameForm(hero.name,H.g,'nom')}, ${hero.age} ${hero.age%10===1&&hero.age%100!==11?'год':([2,3,4].includes(hero.age%10)&&![12,13,14].includes(hero.age%100)?'года':'лет')}, — ${low(hero.prof)}`,rel:'plain'});
    R.last='H';
    if(Cm)c.push({t:K(Cm,'стоять',{adv:'рядом',inv:true})+' — '+adjForm(comp.traitAdj||'добрый',Cm.g,'nom')+' '+cmNoun(),rel:'plain'});
    c.push({t:K(H,'быть',{predS:adjForm(trait,H.g,'ins',false,true),drop:chance(.6)}),rel:'and'});
    return {c,vis:{act:'idle',level:.05},en:'standing calmly in',tn:.1};
  };
  const SIGN_ADV=['вдалеке','внезапно','откуда-то издалека','совсем рядом'];
  ev.sign=()=>{const sg=pick(w.sg);const e=Object.assign({},sg,{id:'sg'});
    return {c:[{t:K(e,pick(['раздаться','послышаться']),{adv:pick(SIGN_ADV),inv:true}),rel:'then'},{t:K(H,pick(['замереть','оглянуться']),{}),rel:'and'}],vis:{act:'look',level:.25,flash:true},en:'hearing a distant ominous sound in',tn:.25,ctx:{sg:e}}};
  ev.incite=()=>{
    const c=[];const sp=pick(w.sp);st.aware=true;st.seenT=true;
    if(w.kind==='c'){
      if(w.iv)c.push({t:K(T,pick(w.iv),{adv:'внезапно',inv:true}),rel:'start'});
      else if(chance(.5))c.push({t:K(T,'появиться',{adv:'внезапно',pp:spotP(sp),inv:true}),rel:'start'});
      else c.push({t:K(T,'выйти',{adv:'внезапно',pp:[FROM(sp),sp,'gen'],inv:true}),rel:'start'});
      c.push({t:K(H,'заметить',{d:[T,'acc']}),rel:'then'});
    }else{
      if(w.iv)c.push({t:K(T,pick(w.iv),{adv:'внезапно',inv:true}),rel:'start'});
      else c.push({t:K(T,pick(['обрушиться','нахлынуть']),{adv:'внезапно',pp:['на',P,'acc']}),rel:'start'});
      c.push({t:K(H,'понять',{}),rel:'colon',x:K(n('прежняя жизнь','f'),'закончиться',{})});
    }
    return {c,vis:{act:'look',level:.45,flash:true},en:`noticing ${T.en} appearing in`,tn:.45};
  };
  ev.resolve=()=>{
    const [vb,pr,cs]=w.gv;const obj=pr?PP(pr,G,cs):np(G,cs);
    const c=[{t:K(H,'решить',{inf:vb+' '+obj}),rel:'start'}];
    const appr=w.kind==='c'?K(T,pick(['приближаться','наступать']),{}):K(T,pick(['не стихать','не утихать']),{});
    c.push({t:'потому что '+appr,rel:'because'});
    return {c,vis:{act:'walk',level:.3},en:'determined, looking toward the horizon in',tn:.3};
  };
  ev.gather=()=>{
    const free=w.it.filter(x=>!st.items.includes(x));if(!free.length)return ev.travel();
    const it=pick(free);st.items.push(it);const sp=pick(w.sp);
    const c=[{t:K(H,pick(['найти','найти','отыскать']),{d:[it,'acc'],pp:spotP(sp)}),rel:'start'}];
    c.push({t:K(H,pick(['сжать','спрятать','проверить']),{d:[it,'acc'],drop:true}),rel:'then'});
    return {c,vis:{act:'pick',level:.2,props:[it.em]},en:`picking up ${it.en} in`,tn:.2,ctx:{it}};
  };
  ev.travel=()=>{
    const nx=(st.spot+1)%w.sp.length,sp=w.sp[nx];st.spot=nx;
    const c=[{t:K(H,pick(['направиться','двинуться','пойти']),{pp:[sp.prep==='во'?'во':sp.prep,sp,'acc']}),rel:'start'}];
    return {c:c.filter(x=>x.rel!=='skip'),vis:{act:'walk',level:.3},en:`walking toward the next area of`,tn:.3,ctx:{sp}};
  };
  ev.hazard=()=>{
    const hz=pick(w.hz);st.hz=hz;const c=[];
    const hzE=Object.assign({},hz,{id:'Z'});
    c.push({t:K(hzE,pick(['преградить','перекрыть']),{d:[COM.path,'acc'],i:[H,'dat'],dinv:false}),rel:'start'});
    // реакция зависит от состояния
    const usable=st.items.length?pick(st.items):null;
    if(usable&&chance(.75)){
      c.push({t:K(H,'применить',{d:[usable,'acc']}),rel:'so'});
      c.push({t:K(hzE,'уступить',{}),rel:'and'});st.tension-=.05;
      return {c,vis:{act:'fight',level:.5,props:[hz.em,usable.em]},en:`using ${usable.en} against ${hz.en} in`,tn:.5,ctx:{hz,used:usable}};
    }
    if(chance(.5)){c.push({t:K(H,'обойти',{d:[hzE,'acc']}),rel:'so'});c.push({t:K(n('дорога','f'),'занять',{d:[n('лишний час','m'),'acc'],adv:'',drop:false}).replace(/^/,'')||'',rel:'but'});
      return {c,vis:{act:'walk',level:.5,props:[hz.em]},en:`circling around ${hz.en} in`,tn:.5,ctx:{hz}};}
    st.hp--;
    c.push({t:K(H,'рискнуть',{}),rel:'so'});c.push({t:K(H,'пробраться',{pp:['через',hzE,'acc']}),rel:'and'});
    return {c,vis:{act:'run',level:.6,props:[hz.em],flash:true},en:`forcing through ${hz.en} in`,tn:.6,ctx:{hz}};
  };
  ev.chase=()=>{
    const c=[];const cv=Object.assign({},w.cv,{id:'C'});
    c.push({t:K(T,pick(['настигать','преследовать']),{d:[H,'acc'],dinv:true}),rel:'start'});
    if(Cm&&chance(.7))c.push({t:K(Cm,'схватить',{d:[H,'acc'],pp:['за',COM.hand,'acc']}),rel:'then'});
    if(chance(.6)){c.push({t:K(H,'спрятаться',{pp:['за',cv,'ins']}),rel:'so'});c.push({t:K(T,'пройти',{adv:'стороной'}),rel:'and'});
      return {c,vis:{act:'hide',level:.75,props:[cv.em]},en:`hiding behind ${w.cv.en} from ${T.en} in`,tn:.7};}
    c.push({t:K(H,'бежать',{}),rel:'so'});
    return {c,vis:{act:'run',level:.85,flash:true},en:`sprinting away from ${T.en} in`,tn:.8};
  };
  ev.ally=()=>{
    st.ally=true;const sp=pick(w.sp);
    const c=[{t:K(A,'выйти',{pp:[FROM(sp),sp,'gen'],inv:true}),rel:'start'}];
    c.push({t:K(A,'протянуть',{i:[H,'dat'],d:[COM.hand,'acc']}),rel:'and'});
    c.push({t:K(H,'поколебаться',{}),rel:'then'});c.push({t:K(H,'принять',{d:[COM.help,'acc'],drop:true}),rel:'but'});
    return {c,vis:{act:'meet',level:.35,props:[A.em]},en:`meeting ${A.en} in`,tn:.35};
  };
  ev.setback=()=>{
    const c=[];
    if(st.items.length&&chance(.6)){const it=st.items.pop();
      c.push({t:K(Object.assign({},it,{id:'it'}),'выпасть',{pp:['из',COM.hands,'gen'],adv:'',dinv:false}),rel:'start'});
      c.push({t:K(H,pick(['поднять','вернуть']),{neg:true,inf:'',d:[it,'acc'],drop:true,end:''}).replace(/^не /,'')?pick(['вернуть','поднять'])+' '+(it.g==='f'?'её':'его')+' уже не получилось':'',rel:'and'});
    }else{st.hp--;
      c.push({t:K(w.kind==='c'?T:H,w.kind==='c'?'задеть':'споткнуться',w.kind==='c'?{d:[H,'acc']}:{}),rel:'start'});
      c.push({t:K(H,'стиснуть',{d:[n('зуб','m','','',{pl:1}),'acc']}),rel:'then'});}
    return {c,vis:{act:'hurt',level:.7,flash:true},en:'stumbling, hit by a setback in',tn:.7};
  };
  ev.inner=()=>{
    const hi=st.hp<=1||st.tension>.6;const pool=hi?[COM.fear,COM.horror,COM.panic]:(st.tension<.25?[COM.hope,COM.thrill,COM.calm]:[COM.tension,COM.doubt]);
    if(tone==='dark')pool.push(COM.despair,COM.cold);
    const e=Object.assign({},pick(pool),{id:'emo'});
    const c=[];
    if(chance(.5))c.push({t:K(e,pick(['охватить','сковать']),{d:[H,'acc'],dinv:true}),rel:'start'});
    else c.push({t:K(e,pick(['сжать','стиснуть']),{i:[H,'dat'],d:[pick([COM.throat,COM.heart,COM.chest]),'acc']}),rel:'start'});
    return {c,vis:{act:'idle',level:Math.max(.2,st.tension)},en:'close-up on a tense face in',tn:.4};
  };
  ev.twist=()=>{
    const c=[];const a=Object.assign({},A,{id:'A'});
    c.push({t:K(H,'понять',{}),rel:'start'});
    const sec=w.sec==='betray'&&!st.ally?'trap':w.sec;
    let cl;
    if(sec==='betray')cl=K(a,'работать',{adv:pick(['всё это время','с самого начала']),pp:['на',T,'acc']});
    else if(sec==='trap')cl=K(G,'оказаться',{pred:[pick([COM.trap,COM.lie]),'ins']});
    else if(sec==='cause')cl=K(G,'быть',{dinv:true,pred:[COM.cause,'nom']}).replace(/\sбыл\S*/,' и есть');
    else if(sec==='self')cl=K(T,'вернуться',{pp:['за',H,'ins']});
    else if(sec==='sympathy')cl=K(T,'хотеть',{neg:true,inf:pick(['нападать','причинять вред'])})+', а '+K(T,'просить',{d:[COM.help,'gen'],drop:true});
    c[0].x=cl;c[0].rel='colon0';
    c.push({t:K(H,'решиться',{pp:['на',n('последний шаг','m'),'acc']}),rel:'then'});
    st.twist=sec;
    return {c,vis:{act:'shock',level:.75,flash:true},en:'shocked realization of a twist in',tn:.8,ctx:{sec:sec}};
  };
  ev.climax=()=>{
    const score=st.hp+st.items.length*.7+(st.ally?1:0)+(rnd()*2-1);
    const out=score>=4.2?'win':score>=2.4?'costly':'narrow';st.out=out;
    const c=[];
    if(w.kind==='c')c.push({t:K(H,'броситься',{pp:['на',T,'acc']}),rel:'start'});else c.push({t:K(H,'встретить',{d:[T,'acc'],end:'лицом к лицу'}),rel:'start'});
    if(st.items.length)c.push({t:K(H,'использовать',{d:[st.items[0],'acc'],drop:true}),rel:'and'});
    if(hero.catch&&!Cm)c.push({t:`«${hero.catch.replace(/[.!]+$/,'')}», — ${hero.gender==='f'?'сказала':'сказал'} ${nameForm(hero.name,H.g,'nom')}`,rel:'plain'});
    if(out==='win')c.push({t:K(H,'победить',{d:[T,'acc']}),rel:'then'});
    else if(out==='costly'){c.push({t:K(H,'победить',{d:[T,'acc']}),rel:'then'});c.push({t:K(H,'заплатить',{d:[COM.price,'acc'],pp:['за',COM.victory,'acc'],drop:true}),rel:'but'})}
    else c.push({t:K(T,'отступить',{}),rel:'but',pre:true});
    return {c,vis:{act:'fight',level:1,flash:true,props:[T.em]},en:`final confrontation with ${T.en} in`,tn:1};
  };
  ev.ending=()=>{
    const [vb,pr,cs]=w.gv;const obj=pr?PP(pr,G,cs):np(G,cs);
    const c=[];
    const done=pick(['добраться','дойти']);
    c.push({t:K(H,vb==='вернуть'||vb==='найти'||vb==='украсть'||vb==='защитить'||vb==='спасти'||vb==='починить'||vb==='собрать'||vb==='вскрыть'||vb==='доставить'||vb==='передать'||vb==='построить'||vb==='вынести'||vb==='добыть'||vb==='отключить'?vb:vb,{inf:'',...(pr?{pp:[pr,G,cs]}:{d:[G,cs]})}),rel:'start'});
    const o=st.out;
    if(tone==='epic')c.push({t:K(COM.dawn,'подняться',{pp:['над',P,'ins'],adv:''}),rel:'then'});
    else if(tone==='dark')c.push({t:K(COM.silence,'принести',{neg:true,d:[COM.relief,'acc']}),rel:'but'});
    else if(tone==='ironic')c.push({t:'Всё прошло почти по плану, если не считать '+np(st.hz||w.hz[0],'gen')+' и '+np(T,'gen'),rel:'plain'});
    else c.push({t:K(H,'вернуться',{pp:['к',COM.friends,'dat']}),rel:'then'});
    if(Cm)c.push({t:K(Cm,'улыбнуться',{}),rel:'plain'});
    return {c,vis:{act:'walk',level:.05},en:'quiet closing moment, new dawn over',tn:.1};
  };


  /* ---------- диалоги: реплики строятся из тех же сущностей и падежей ---------- */
  const PRES={'приближаться':['приближается','приближаются'],'не стихать':['не стихает','не стихают'],'хотеть':['хочет','хотят'],'просить':['просит','просят']};
  const pres=(v,pl)=>PRES[v][pl?1:0];
  const nm=hero.name,cn=comp?comp.name:'';
  const LN=(who,t)=>({w:who,t});
  function dlg(act,x){
    if(!comp)return [];
    const Hs=t=>LN('H',t),Cs=t=>LN('C',t),Tn=()=>cap(np(T,'nom'));
    const warn=()=>pick([`Осторожно, ${np(T,'nom')} ${w.kind==='c'?pres('приближаться',T.pl):pres('не стихать',T.pl)}!`,`${Tn()} уже рядом, ${nm}!`]);
    const [vb,pr,cs]=w.gv,obj=pr?PP(pr,G,cs):np(G,cs);
    switch(act){
     case 'intro':return [Cs(`Привет, ${nm}!`),Hs(`Привет, ${cn}.`)];
     case 'sign':return [Cs(`${nm}, ты ${pick(['слышал','слышала'].slice(H.g==='f'?1:0,H.g==='f'?2:1))} ${np(x.sg,'acc')}?`),Hs(cap(pastForm('услышать',H))+'. Тише.')];
     case 'incite':return [Cs(`${nm}, смотри!`),Cs(warn()),Hs(pick(['Не двигайся.','Тихо. Не привлекай внимания.']))];
     case 'resolve':return [Hs(`Нам нужно ${vb} ${obj}.`),Cs(pick([`Я с тобой, ${nm}.`,'Тогда пошли.']))];
     case 'gather':return x.it?[Hs(`Смотри, что я ${pastForm('найти',H)}: ${np(x.it,'acc')}!`),Cs(pick(['Это нам пригодится.','Хорошая находка.']))]:[];
     case 'travel':return x.sp?[Cs('Куда теперь?'),Hs(cap(PP(x.sp.prep,x.sp,'acc'))+'.')]:[];
     case 'hazard':return x.hz?[Cs(`Что нам делать с ${np(x.hz,'ins')}?`),Hs(x.used?`Попробуем ${pick(['использовать','применить'])} ${np(x.used,'acc')}.`:pick(['Попробуем обойти.','Придётся рискнуть.']))]:[];
     case 'chase':return [Cs(warn()),Hs(pick(['Бежим!','Прячься!','Не оглядывайся!']))];
     case 'ally':return [Cs(pick(['Кто это?','Ему можно доверять?'])),Hs('Тише. Посмотрим.')];
     case 'setback':return [Cs(`Ты как, ${nm}? Держись!`),Hs(pick(['Ничего. Я в порядке.','Всё нормально. Идём дальше.']))];
     case 'twist':{const sc=x.sec;
       if(sc==='betray')return [Cs(`Я так и ${pastForm('знать',Cm)}: ${np(A,'dat')} нельзя было доверять!`),Hs(`${cap(np(A,'nom'))} нас ${pastForm('обмануть',A)}.`)];
       if(sc==='trap')return [Cs(`${cap(np(G,'nom'))} — это ${pick(['ловушка','обман'])}!`),Hs('Назад!')];
       if(sc==='cause')return [Hs(`${cap(np(G,'nom'))} и есть причина всего!`),Cs('Значит, всё только начинается.')];
       if(sc==='self')return [Cs(`Они пришли за тобой, ${nm}!`),Hs('Значит, это моя битва.')];
       return [Cs(`Постой! ${Tn()} не ${pres('хотеть',T.pl)} нападать, ${T.pl?'они просят':'оно просит'} помощи.`),Hs('Тогда нельзя бить первыми.')];}
     case 'finale':{
       const tl={epic:`${cn}, я бы не ${pastForm('справиться',H)} без тебя.`,ironic:'Ну, могло быть и хуже.',dark:'Но мы ещё не дома.',warm:`Спасибо, что ты ${pastForm('быть',Cm)} рядом.`}[tone]||'Мы справились.';
       return [Hs(hero.catch?hero.catch:pick(['Сейчас или никогда!','Всё закончится здесь!'])),Cs('Я с тобой!'),Cs(pick(['Мы это сделали!','Получилось!'])),Hs(tl)];}
    }
    return [];
  }

  /* ---------- планировщик ---------- */
  const seq=['intro','incite','resolve'];
  const mid=N-5;                      // остаётся мест под середину
  const pool={gather:1,travel:1,hazard:1,chase:w.kind==='c'?1:.4,ally:1,setback:.7,sign:.5,inner:.4};
  const used={};const midActs=[];
  for(let i=0;i<mid;i++){
    let cand=Object.keys(pool).filter(k=>!(k==='ally'&&used.ally)&&!(k==='sign'&&(i>1||used.sign))&&midActs[midActs.length-1]!==k);
    if(w.sec==='betray'&&!used.ally&&i===Math.floor(mid/2)-0)cand=['ally'];
    const tot=cand.reduce((a,k)=>a+pool[k]/(1+(used[k]||0)*1.8),0);let r=rnd()*tot,ch=cand[0];
    for(const k of cand){r-=pool[k]/(1+(used[k]||0)*1.8);if(r<=0){ch=k;break}}
    used[ch]=(used[ch]||0)+1;midActs.push(ch);
  }
  if(w.sec==='betray'&&!used.ally&&midActs.length)midActs[0]='ally';
  const order=['intro','incite','resolve'].concat(midActs,['twist','finale']);
  // порядок: при N=6 -> intro, incite, resolve+gather, [1 mid], twist, climax+ending
  const plan=[...order];
  const scenes=[];
  let prevAct=null;
  for(let i=0;i<plan.length;i++){
    R.last=null;
    const act=plan[i];curAct=act;
    let e;if(act==='finale'){const a=ev.climax(),b=ev.ending();e={c:a.c.concat(b.c.map((x,k)=>k===0?Object.assign(x,{rel:'then'}):x)),vis:a.vis,en:a.en,tn:a.tn}}else e=ev[act]();
    st.tension=Math.max(0,Math.min(1,e.tn||st.tension));
    let list=e.c.slice();
    // добавим внутреннее состояние в напряжённых сценах
    if(!['intro','ending','inner'].includes(act)&&(e.tn||0)>.45&&list.length<4&&chance(.55)){const inn=ev.inner();list.push({t:inn.c[0].t,rel:'then'})}
    // дополнение: на сцене resolve сразу подбираем предмет
    scenes.push({act,e,list,dl:dlg(act,e.ctx||{})});
    prevAct=act;
  }
  // соединение: climax + ending в одну сцену для компактности при N==6 уже отдельные
  const text=list=>{
    let out='',usedA=false;
    list.forEach((x,i)=>{
      let t=x.t;if(x.x){t=x.rel==='colon0'?t+': '+x.x:t+': '+x.x}
      if(i===0){out=cap(t);return}
      const rel=x.rel;
      const J={and:[', и ','. '],plain:['. '],then:['. Тогда ',', а затем ','. Затем ','. '],so:[', поэтому ','. Поэтому ',', и '],but:[', но ','. Но '],because:[', ',', '],colon:[': ',': '],colon0:['. ','. ']}[rel]||['. '];
      if(rel==='because'){out+=', '+t;return}
      if(rel==='colon'){out+=': '+x.x;return}
      let j=pick(J);if(j===', а затем '){if(usedA)j='. Затем ';usedA=true}
      out+=j+(j==='. '?cap(t):t);
    });
    return out.replace(/\s+/g,' ').replace(/\s,/g,',').trim()+'.';
  };
  const out={title:'',scenes:[],seed};
  const kinds=plan;
  out.scenes=scenes.map((sc,i)=>{
    const f=i/(plan.length-1),base=sc.e.vis.level;
    const vis=sc.e.vis;
    const props=[...(vis.props||[]),...w.it.slice(0,1).map(x=>x.em)].filter(Boolean);
    const dedup=[...new Set(props)].slice(0,3);while(dedup.length<3)dedup.push(w.sp.length?pick(w.it).em:'✨');
    const shot=SHOTS[Math.min(SHOTS.length-1,Math.floor(rnd()*3)+(vis.act==='run'?3:0)+(vis.act==='fight'?2:0))];
    const style=(root.TONES&&root.TONES[hero.tone]?root.TONES[hero.tone].en:'cinematic');
    const nar=text(sc.list),lines=[{w:'N',t:nar}].concat(sc.dl||[]);
    const label=l=>l.w==='N'?l.t:(l.w==='H'?nm:cn)+': '+l.t;
    const nameOf={};[].concat(w.it,w.hz,[w.cv,A,T,G]).forEach(e=>{if(e&&e.em)nameOf[e.em]=e.ph.replace(/=/g,'')});
    return {propNames:dedup.map(em=>nameOf[em]||''),threatName:T.ph.replace(/=/g,''),threatKind:w.kind,text:lines.map(label).join('\n'),props:dedup,threat:base>=.25||sc.act==='incite'?T.em:'',level:base,flash:!!vis.flash,act:vis.act,kind:sc.act,
      anim:`${shot}, ${hero.heroEn||'the hero'} ${sc.e.en} ${gn.en||w.P.en}, ${base>.6?'high tension':base>.3?'rising suspense':'calm atmosphere'}, ${style}, smooth camera motion, 5 seconds, 16:9`};
  });
  out.title=(gn.n||'История')+': '+hero.name;
  out.world=gn.id;
  return out;
}
root.Engine={generate,np,adjForm,nounSg,nounPl,pastForm,nameForm,W,COM};
if(typeof module!=='undefined')module.exports=root.Engine;
})(typeof window!=='undefined'?window:globalThis);

import re, json, subprocess, sys
TXT = """[calmly] [softly] Мы считали проценты заряда как минуты жизни. [pause] 02:40. Дом погас разом, и я услышал собственное сердце. [pause] Девятый этаж. Миха лежит на аппарате. Тридцать один процент: хватит на три часа. До рассвета — пять. [pause] Я набрал «103». Тишина. [short pause] Вышки умерли вместе со светом. [pause] Миха шутил, как всегда, когда страшно: «Свет остаётся у тех, кто платит». [short pause] И подсказал: у Петровича с седьмого гудит генератор. [pause] Петрович согласился, но не бесплатно. Я отдал всё из дорожной сумки. [pause] Но бак оказался пуст. [short pause] Солярка осталась в моей фуре, на стоянке за трассой. [pause] Девять этажей вниз в темноте. Фонарик светил из последних сил. [pause] У самого бака он погас. [short pause] Я сливал топливо на ощупь, на запах. [pause] [tense] Назад — по трассе, без света. Двое вышли из темноты. [short pause] Канистра ушла вместе с ними. [pause] Я считал минуты: у Михи остался час. [pause] В кармане лежал его запасной блок. Пустой. [short pause] Но впереди горел свет. [pause] Горело только одно крыло больницы. [short pause] Второе было чёрным. [pause] Врач выслушал молча. «Генератор тянет лишь частное крыло. В общем — одна розетка. [short pause] И она занята». [pause] [quietly] Он подошёл к старику у стены и выдернул вилку. [pause] Чужой аппарат замолчал. [short pause] Врач повернулся и посмотрел на меня. [long pause] Он ждал, что я сделаю дальше."""
# silences
out = subprocess.run(['ffmpeg','-hide_banner','-i','/home/user/Project/episode1/voice.mp3','-af','silencedetect=noise=-35dB:d=0.15','-f','null','-'],capture_output=True,text=True).stderr
st=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',out)]
en=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',out)]
sil=list(zip(st,en))
END=88.47
# groups split by pause tags
parts=re.split(r'\[(?:short |long )?pause\]',TXT)
groups=[]
for p in parts:
    p=re.sub(r'\[[a-z ]+\]','',p).strip()
    if p: groups.append(p)
G=len(groups)
def wlen(g): return len(re.sub(r'[^\w]','',g))
cum=0; PAUSE=13; weights=[wlen(g) for g in groups]
total=sum(weights)+PAUSE*(G-1)
exp=[]
for i in range(G-1):
    cum+=weights[i]; exp.append(END*(cum+PAUSE*i+PAUSE/2)/total)
cands=[(a,b) for a,b in sil if b-a>=0.25 and b<END-0.1]
INF=1e9
n=len(cands)
# dp[j][i]: min cost choosing boundary j at cand i
import functools
dp=[[INF]*n for _ in range(G-1)]
bk=[[-1]*n for _ in range(G-1)]
for i in range(n): dp[0][i]=abs(exp[0]-(cands[i][0]+cands[i][1])/2)
for j in range(1,G-1):
    best=INF;bi=-1
    for i in range(n):
        if i>0 and dp[j-1][i-1]<best: best=dp[j-1][i-1];bi=i-1
        if bi>=0:
            dp[j][i]=best+abs(exp[j]-(cands[i][0]+cands[i][1])/2); bk[j][i]=bi
i=min(range(n),key=lambda k:dp[G-2][k]); sel=[i]
for j in range(G-2,0,-1):
    i=bk[j][i]; sel.append(i)
sel=sel[::-1]
bounds=[cands[i] for i in sel]
# speech segments of each group
gseg=[]
t0=0.0
for k in range(G):
    a=t0
    b=bounds[k][0] if k<G-1 else END
    gseg.append((a,b))
    if k<G-1: t0=bounds[k][1]
# within group distribute words over speech time excluding inner silences
words=[]
for k,g in enumerate(groups):
    a,b=gseg[k]
    inner=[(max(s,a),min(e,b)) for s,e in sil if s<b and e>a and e-s>=0.15]
    # speech intervals
    segs=[];cur=a
    for s,e in inner:
        if s>cur: segs.append((cur,s))
        cur=max(cur,e)
    if cur<b: segs.append((cur,b))
    dur=sum(y-x for x,y in segs)
    toks=g.split()
    wt=[len(re.sub(r'[^\w]','',w))+ (1.2 if re.search(r'[,:.»—]$',w) else 0)+1 for w in toks]
    tw=sum(wt); acc=0
    def pos(u):  # map speech-time offset to real time
        for x,y in segs:
            if u<=y-x: return x+u
            u-=y-x
        return segs[-1][1]
    for w,ww in zip(toks,wt):
        s=pos(dur*acc/tw); acc+=ww; e=pos(dur*acc/tw)
        words.append({'w':w,'s':round(s,3),'e':round(e,3),'g':k})
json.dump({'groups':groups,'gseg':gseg,'words':words,'duration':88.764},open('/home/user/Project/episode1/build/words.json','w'),ensure_ascii=False,indent=1)
print('groups',G,'cands',n)
for k,g in enumerate(groups):
    a,b=gseg[k];print(f'{k:2d} {a:6.2f}-{b:6.2f} {(b-a):5.2f}s {wlen(g)/(b-a):4.1f}c/s  {g[:60]}')

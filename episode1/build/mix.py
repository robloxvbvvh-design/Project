import subprocess, re, json, numpy as np, wave
def lufs(path, extra=''):
    o = subprocess.run(['ffmpeg','-hide_banner','-i',path,'-af','ebur128=peak=true','-f','null','-'],capture_output=True,text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS',o)[-1])
def rd(p):
    w=wave.open(p); x=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2')/32768.; return x
vo = lufs('../voice.mp3'); print('voice LUFS', vo)
gb = (vo-19) - lufs('stem_bed.wav'); gr = -45 - lufs('stem_rain.wav')
x = rd('stem_sfx.wav'); sr=44100; win=int(.4*sr)
rms = [np.sqrt(np.mean(x[i:i+win]**2)+1e-12) for i in range(0,len(x)-win,win//4)]
gs = -34 - 20*np.log10(max(rms))
print('gains dB bed %.1f rain %.1f sfx %.1f'%(gb,gr,gs))
fc = f"[0:a]apad=whole_dur=89.6,atrim=0:89.6[v];[1:a]volume={gb}dB,atrim=0:89.6[b];[2:a]volume={gr}dB,atrim=0:89.6[r];[3:a]volume={gs}dB,atrim=0:89.6[s];[v][b][r][s]amix=inputs=4:normalize=0:duration=longest[m]"
subprocess.run(['ffmpeg','-y','-v','error','-i','../voice.mp3','-i','stem_bed.wav','-i','stem_rain.wav','-i','stem_sfx.wav','-filter_complex',fc,'-map','[m]','-ar','44100','-ac','1','premix.wav'],check=True)
print('premix LUFS', lufs('premix.wav'))
# двухпроходная нормализация громкости до -14 LUFS
o = subprocess.run(['ffmpeg','-hide_banner','-i','premix.wav','-af','loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True).stderr
j = json.loads(o[o.rindex('{'):o.rindex('}')+1])
af = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
subprocess.run(['ffmpeg','-y','-v','error','-i','premix.wav','-af',af,'-ar','44100','-ac','2','final_audio.wav'],check=True)
print('final LUFS', lufs('final_audio.wav'))

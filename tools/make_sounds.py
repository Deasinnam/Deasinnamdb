#!/usr/bin/env python3
"""알림벨 기본 소리 4가지(WAV, 22kHz 모노)를 만듭니다: 딩동 · 종소리 · 차임 · 삐삐"""
import math, struct, wave, sys, os
R = 22050
def tone(freqs, dur, decay=4.0, vol=0.6, attack=0.005):
    n = int(R * dur); out = []
    for i in range(n):
        t = i / R
        env = min(1, t / attack) * math.exp(-decay * t)
        v = sum(a * math.sin(2 * math.pi * f * t) for f, a in freqs)
        out.append(v * env * vol)
    return out
def silence(d): return [0.0] * int(R * d)
def mix(*parts): return [x for p in parts for x in p]
def save(name, s):
    m = max(abs(x) for x in s) or 1
    with wave.open(name, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(R)
        w.writeframes(b"".join(struct.pack("<h", int(x / m * 0.92 * 32767)) for x in s))
bell = lambda f, d=1.2, dec=3.2: tone([(f, 1), (f * 2.01, .45), (f * 3.02, .25), (f * 4.2, .12)], d, dec)
out = sys.argv[1]
save(os.path.join(out, "dingdong.wav"), mix(bell(1046.5, .55, 4), bell(830.6, 1.1, 3)))
save(os.path.join(out, "bell.wav"), mix(bell(1568, .35, 9), silence(.02), bell(1568, .35, 9), silence(.02), bell(1568, .9, 5)))
save(os.path.join(out, "chime.wav"), mix(bell(784, .28, 7), bell(988, .28, 7), bell(1175, .28, 7), bell(1568, 1.0, 3.5)))
save(os.path.join(out, "beep.wav"), mix(tone([(1760, 1)], .16, 2, .5), silence(.08), tone([(1760, 1)], .16, 2, .5), silence(.08), tone([(1760, 1)], .3, 3, .5)))

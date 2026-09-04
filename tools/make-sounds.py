#!/usr/bin/env python3
"""Generuje zvukové efekty hry jako krátké WAV soubory (22 050 Hz, mono, 16 bit).

Zvuky jsou syntetizované, takže nemají žádnou licenci a jdou kdykoli
přegenerovat: `python3 tools/make-sounds.py assets/sounds`.
"""
import math
import os
import struct
import sys
import wave

RATE = 22050


def tone(freq_start, freq_end, seconds, volume=0.5, decay=6.0, harmonics=(1.0,)):
    """Sinusový tón s lineárním posunem frekvence, exponenciálním dozníváním a přesahy."""
    n = int(RATE * seconds)
    out = []
    phase = 0.0
    for i in range(n):
        t = i / n
        freq = freq_start + (freq_end - freq_start) * t
        phase += 2 * math.pi * freq / RATE
        env = math.exp(-decay * t) * min(1.0, i / (RATE * 0.004))  # rychlý náběh proti lupnutí
        sample = 0.0
        for k, amp in enumerate(harmonics, start=1):
            sample += amp * math.sin(phase * k)
        out.append(volume * env * sample / sum(harmonics))
    return out


def silence(seconds):
    return [0.0] * int(RATE * seconds)


def mix(*layers):
    length = max(len(l) for l in layers)
    out = [0.0] * length
    for layer in layers:
        for i, v in enumerate(layer):
            out[i] += v
    return out


def concat(*parts):
    out = []
    for p in parts:
        out.extend(p)
    return out


def fade_out(samples, seconds=0.01):
    n = int(RATE * seconds)
    total = len(samples)
    for i in range(max(0, total - n), total):
        samples[i] *= (total - i) / n
    return samples


def write(path, samples):
    samples = fade_out(samples)
    peak = max(1e-9, max(abs(s) for s in samples))
    scale = min(1.0, 0.9 / peak)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1.0, min(1.0, s * scale)) * 32767)) for s in samples))


SOUNDS = {
    # Klepnutí: krátké cinknutí krystalu.
    "tap": lambda: tone(1100, 700, 0.07, volume=0.35, decay=14, harmonics=(1.0, 0.3)),
    # Nákup zařízení: dva stoupající tóny.
    "buy": lambda: concat(tone(523, 523, 0.06, decay=8), tone(784, 784, 0.11, decay=7, harmonics=(1.0, 0.2))),
    # Vylepšení: krátké arpeggio.
    "upgrade": lambda: concat(
        tone(523, 523, 0.07, decay=9), tone(659, 659, 0.07, decay=9), tone(784, 784, 0.16, decay=6, harmonics=(1.0, 0.25))
    ),
    # Prestiž: dlouhý stoupající sweep se třpytem.
    "prestige": lambda: mix(
        tone(300, 1400, 0.7, volume=0.5, decay=3, harmonics=(1.0, 0.4, 0.15)),
        concat(silence(0.25), tone(1760, 2637, 0.45, volume=0.25, decay=5)),
    ),
    # Zlatá žíla: zvonivý akord.
    "golden": lambda: mix(
        tone(1319, 1319, 0.5, volume=0.4, decay=5),
        tone(1760, 1760, 0.5, volume=0.3, decay=5),
        concat(silence(0.05), tone(2637, 2637, 0.45, volume=0.25, decay=6)),
    ),
    # Úspěch: měkké dvojité „ding“.
    "achievement": lambda: concat(tone(659, 659, 0.12, volume=0.4, decay=6), tone(988, 988, 0.28, volume=0.4, decay=5, harmonics=(1.0, 0.2))),
}


def main():
    out_dir = sys.argv[1] if len(sys.argv) > 1 else "assets/sounds"
    os.makedirs(out_dir, exist_ok=True)
    for name, build in SOUNDS.items():
        path = os.path.join(out_dir, f"{name}.wav")
        write(path, build())
        print("wrote", path)


if __name__ == "__main__":
    main()

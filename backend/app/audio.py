"""audio processing, etc"""
from pydub import AudioSegment
import pandas as pd
import numpy as np
import soundfile as sf


class Audio:
    silence_threshold = -50.0
    threshold_value = 0.0007  # Tweak the value of threshold to get the aggressive trimming

    @staticmethod
    def _detect_leading_silence(sound: bytearray, sample_rate: int) -> list:
        y = pd.Series(sound).apply(np.abs)
        y_mean = y.rolling(window=int(sample_rate / 20),
                           min_periods=1,
                           center=True).max()

        return [True if mean > Audio.threshold_value else False for mean in y_mean]

    @staticmethod
    def trim_silence(path: str) -> AudioSegment:
        sound, rate = sf.read(path + ".wav")
        mask = Audio._detect_leading_silence(sound, rate)
        trimmed_sound = sound[mask]
        return trimmed_sound

    @staticmethod
    def save_audio(path: str, audio: AudioSegment):
        audio.export(path + ".wav", format="wav")

    @staticmethod
    def get_audio_len(audio: AudioSegment) -> float:
        return len(audio) / 1000.0

"""audio processing, etc"""
from pydub import AudioSegment


class Audio:
    silence_threshold = -50.0
    chunk_size = 10

    @staticmethod
    def _detect_leading_silence(sound: AudioSegment) -> int:
        trim_ms = 0
        assert Audio.chunk_size > 0  # to avoid infinite loop
        while sound[trim_ms:trim_ms + Audio.chunk_size].dBFS \
                < Audio.silence_threshold and trim_ms < len(sound):
            trim_ms += Audio.chunk_size

        return trim_ms

    @staticmethod
    def trim_silence(path: str) -> AudioSegment:
        sound = AudioSegment.from_wav(path + ".wav")
        start_trim = Audio._detect_leading_silence(sound)
        # end_trim = Audio._detect_leading_silence(sound.reverse())
        duration = len(sound)
        trimmed_sound = sound[int(start_trim/2):duration]
        return trimmed_sound

    @staticmethod
    def save_audio(path: str, audio: AudioSegment):
        audio.export(path + ".wav", format="wav")

    @staticmethod
    def get_audio_len(audio: AudioSegment) -> float:
        return len(audio)/1000.0

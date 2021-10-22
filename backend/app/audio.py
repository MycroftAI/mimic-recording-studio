"""audio processing, etc"""
from pydub import AudioSegment


class Audio:
    """Audio class for handling audio data."""
    silence_threshold = -50.0
    chunk_size = 10

    @staticmethod
    def _detect_leading_silence(sound: AudioSegment) -> int:
        """Check for leading silence in audio segment.
        A leading/ending silence buffer of 300ms will be kept to avoid too hard cut offs.

        Args:
            sound (AudioSegment): Audio segment to be checked for silence. 

        Returns:
            int: Milliseconds to be trimmed off.
        """
        trim_ms = 0
        assert Audio.chunk_size > 0  # to avoid infinite loop
        while sound[trim_ms:trim_ms + Audio.chunk_size].dBFS \
                < Audio.silence_threshold and trim_ms < len(sound):
            trim_ms += Audio.chunk_size
        trim_buffer = 300  # buffer to prevent first sound getting cut
        trim_ms -= trim_buffer
        if trim_ms < 0:
            trim_ms = 0
        return trim_ms

    @staticmethod
    def trim_silence(path: str) -> AudioSegment:
        """Remove leading/ending silence from audio.

        Args:
            path (str): Filename of audio recording.

        Returns:
            AudioSegment: Audio data without excessive silence.
        """
        sound = AudioSegment.from_wav(path + ".wav")
        start_trim = Audio._detect_leading_silence(sound)
        end_trim = Audio._detect_leading_silence(sound.reverse())
        duration = len(sound)
        trimmed_sound = sound[start_trim:duration - end_trim]
        return trimmed_sound

    @staticmethod
    def save_audio(path: str, audio: AudioSegment):
        """Saving audio data as wav file.

        Args:
            path (str): Location for wav file.
            audio (AudioSegment): Audio data.
        """
        audio.export(path + ".wav", format="wav")

    @staticmethod
    def get_audio_len(audio: AudioSegment) -> float:
        return len(audio)/1000.0

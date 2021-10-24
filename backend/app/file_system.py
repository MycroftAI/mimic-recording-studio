"""Module to interface with the os filesystem"""

import os
import csv
import hashlib
import subprocess
import os
from subprocess import DEVNULL
from .protocol import response

corpus_name = os.environ["CORPUS"]

prompts_dir = prompts_path = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "../prompts/"
)
os.makedirs(prompts_dir, exist_ok=True)
prompts_path = os.path.join(
    prompts_dir,
    "../prompts",
    corpus_name
)

audio_dir = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "../audio_files/"
)
os.makedirs(audio_dir, exist_ok=True)

temp_path = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "../tmp/"
)
os.makedirs(temp_path, exist_ok=True)


class AudioFS:
    """API Class for audio handling."""

    @staticmethod
    def save_audio(path: str, audio: bytes):
        """Save audio after ffmpeg conversion (stereo, samplerate 44.100Hz) to disk.

        Args:
            path (str): Directory where recordings are saved (./backend/audio_files/<user-id>).
            audio (bytes): Raw audio data.
        """
        webm_file_name = path + ".webm"

        with open(webm_file_name, 'wb+') as f:
            f.write(audio)
        
        subprocess.call(
            'ffmpeg -i {} -ab 160k -ac 2 -ar 44100 -vn {}.wav -y'.format(
                webm_file_name, path
            ),
            shell=True
        )
        os.remove(webm_file_name)

    @staticmethod
    def save_meta_data(user_audio_dir, uuid, wav_file_id, prompt):
        """Write a line for every saved recording in metadata.csv file.

        CSV file format is <uuid of recording>.wav|Recorded phrase|Length of phrase.

        Args:
            user_audio_dir: Base directory for recordings (./backend/audio_files/<user-id>/).
            uuid: user-id.
            wav_file_id (str): unique id of wavefile.
            prompt (str): Text of recorded phrase.
        """
        path = os.path.join(user_audio_dir, '%s-metadata.txt' % uuid)
        data = "{}|{}|{}\n".format(wav_file_id + ".wav", prompt, len(prompt))

        same = False
        if os.path.isfile(path):
            with open(path, 'r+') as f:
                lines = f.readlines()
                if len(lines) > 0 and lines[-1] == data:
                    same = True

        if not same:
            with open(path, 'a') as f:
                f.write(data)

    @staticmethod
    def save_skipped_data(user_audio_dir, uuid, prompt):
        """Write text phrase for every skipped recording in userid-skipped.txt file.

        Args:
            user_audio_dir (str): Base directory for user recordings.
            uuid (str): user-id.
            prompt (str): Text phrase that has been skipped.
        """
        path = os.path.join(user_audio_dir, '%s-skipped.txt' % uuid)
        data = "{}\n".format(prompt.lstrip('___SKIPPED___'))

        with open(path, 'a') as f:
            f.write(data)


    @staticmethod
    def get_audio_path(uuid: str) -> str:
        return os.path.join(audio_dir, uuid)

    @staticmethod
    def create_file_name(prompt: str):
        return hashlib.md5(prompt.encode("utf-8")).hexdigest()


class PromptsFS:
    """API Class for Prompt handling."""
    def __init__(self):
        self.data = []
        with open(prompts_path, 'r') as f:
            prompts = csv.reader(f, delimiter="\t")
            for p in prompts:
                self.data.append(p[0])

    def get(self, prompt_number: int) -> response:
        """Get text from corpus by prompt number.
        If end of corpus file is reached then '___CORPUS_END___' is returned as phrase.

        Args:
            prompt_number (int): Number of requested prompt from corpus.

        Returns:
            response: Text phrase from corpus, length of prompt.
        """
        try:
            d = {
                "prompt": self.data[prompt_number],
                "total_prompt": len(self.data)
            }
        except IndexError as e:
            d = {
                "prompt": "___CORPUS_END___",
                "total_prompt": 0
            }            
        return response(True, data=d)

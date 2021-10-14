import os
from .db import DB
from .protocol import response
from .file_system import AudioFS, PromptsFS, temp_path
from .audio import Audio
import random


class UserAPI:
    """API that queries and transform data from DB"""

    def get_user(self, uuid: str) -> response:
        return DB.get_user(uuid)

    def save_user(self, user) -> response:
        if not DB.UserModel.validate(user):
            return response(False, message="user model is missing fields")
        elif self.get_user(user.get("user_name")).success:
            return response(False, message="user already existed")
        else:
            res = DB.save_user(user)
            if res.success:
                return response(
                    True,
                    message="user %s created" % user["user_name"]
                )
            else:
                return response(False, message=res.message)


class AudioAPI:
    """API that to save, get, and extract all audio as zip"""

    def save_audio(self, audio: bytes, uuid: str, prompt: str):
        user_audio_dir = AudioFS.get_audio_path(uuid)
        
        if prompt[:13] == "___SKIPPED___":
            res = DB.skipPhrase(uuid)

            # Save skipped phrase to textfile
            AudioFS.save_skipped_data(user_audio_dir,uuid,prompt)
            return response(True)
        else:
            os.makedirs(user_audio_dir, exist_ok=True)
            wav_file_id = AudioFS.create_file_name(prompt)
            path = os.path.join(user_audio_dir, wav_file_id)

            try:
                # save wav file. This step is needed before trimming.
                AudioFS.save_audio(path, audio)
                AudioFS.save_meta_data(user_audio_dir, uuid, wav_file_id, prompt)

                # trim silence and save
                trimmed_sound = Audio.trim_silence(path)
                Audio.save_audio(path, trimmed_sound)

                res = DB.save_audio(wav_file_id, prompt, 'english', uuid)
                if res.success:
                    audio_len = Audio.get_audio_len(trimmed_sound)
                    char_len = len(prompt)
                    res = DB.update_user_metrics(uuid, audio_len, char_len)
                    if res.success:
                        return response(True)
                return response(False)
            except Exception as e:
                # TODO: log Exception
                print(e)
                return response(False)

    def get_audio_len(self, audio: bytes):
        try:
            name = random.getrandbits(64)  # get random num
            path = os.path.join(temp_path, str(name))
            AudioFS.save_audio(path, audio)
            trimmed_sound = Audio.trim_silence(path)
            audio_len = Audio.get_audio_len(trimmed_sound)
            os.remove(path + ".wav")
            return response(True, data={"audio_len": audio_len})
        except Exception as e:
            print(e)
            return response(False)

    def extract_all_audio(self):
        pass


# TODO: add language support
class PromptAPI:
    """API to get prompts"""

    prompt_fs = PromptsFS()

    def __init__(self):
        self.user_api = UserAPI()

    def get_prompt(self, uuid: str) -> response:
        user = self.user_api.get_user(uuid)
        if user.success:
            prompt_num = user.data["prompt_num"]
            # res = DB.get_prompt(prompt_num)
            res = PromptAPI.prompt_fs.get(prompt_num)
            if res.success:
                return response(True, data=res.data)

        return response(False)

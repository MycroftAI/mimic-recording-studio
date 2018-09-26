from .db import DB
from .protocol import response


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
        res = DB.save_audio(audio, uuid, prompt)
        if res.success:
            res = DB.add_prompt_counter(uuid)
            if res.success:
                return response(True)

        return response(False)

    def extract_all_audio(self):
        pass


# TOOD: add language support
class PromptAPI:
    """API to get prompts"""

    def __init__(self):
        self.user_api = UserAPI()

    def get_prompt(self, uuid: str) -> response:
        user = self.user_api.get_user(uuid)
        if user.success:
            prompt_num = user.data["prompt_num"]
            res = DB.get_prompt(prompt_num)
            if res.success:
                return response(True, data=res.data)

        return response(False)

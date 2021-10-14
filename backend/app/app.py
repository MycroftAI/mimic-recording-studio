from flask import Flask, jsonify, request
from flask.views import MethodView
from flask_cors import CORS
from .api import UserAPI, PromptAPI, AudioAPI

app = Flask(__name__)
CORS(app)

user_api = UserAPI()
audio_api = AudioAPI()
prompt_api = PromptAPI()


class Users(MethodView):
    """User class reading/writing user object data."""

    def get(self):
        """Get user details based on object instance user-id.

        Returns:
            User object with data from Sqlite datase table "usermodel".
        """
        uuid = request.args.get('uuid')
        user = user_api.get_user(uuid)
        if user.success:
            return jsonify(success=True, message="success", data=user.data)
        else:
            return jsonify(success=False, message=user.message)

    def post(self):
        """Save user object to Sqlite database.

        Returns:
            (bool): 'true' when saving to database is successful or 'false' in any other case.
        """
        user = request.get_json(force=True)
        res = user_api.save_user(user)
        if res.success:
            return jsonify(success=True, message="succesfully saved user")
        else:
            return jsonify(success=False, message=res.message)


class Audio(MethodView):
    """Audio class saving audio data or getting audio length."""

    def save_audio(self, uuid: str, prompt: str, data: bytes) -> jsonify:
        res = audio_api.save_audio(data, uuid, prompt)
        if res.success:
            return jsonify(success=True, message="sucessfully saved audio")
        else:
            return jsonify(
                success=False,
                message="did not sucessfully save audio"
            )

    def get_audio_len(self, data: bytes) -> jsonify:
        res = audio_api.get_audio_len(data)
        if res.success:
            return jsonify(success=True, data=res.data)
        else:
            return jsonify(success=False, message="error occured in server")

    def post(self):
        data = request.data
        uuid = request.args.get('uuid')
        prompt = request.args.get('prompt')
        get_len = request.args.get('get_len')
        if uuid and prompt:
            return self.save_audio(uuid, prompt, data)
        elif uuid and get_len:
            return self.get_audio_len(data)
        else:
            return jsonify(
                success=False,
                message="missing prompt or uuid query param"
            )


class Prompts(MethodView):

    def get(self):
        uuid = request.args.get('uuid')
        prompts = prompt_api.get_prompt(uuid)
        if prompts.success:
            return jsonify(success=True, data=prompts.data)
        else:
            return jsonify(success=False, messsage="failed to get prompt")


# registering apis
user_view = Users.as_view('user')
app.add_url_rule(
    '/api/user/',
    view_func=user_view,
    methods=['POST', 'GET']
)

audio_view = Audio.as_view('audio')
app.add_url_rule(
    '/api/audio/',
    view_func=audio_view,
    methods=['POST', 'GET']
)

prompt_view = Prompts.as_view('prompt')
app.add_url_rule(
    '/api/prompt/',
    view_func=prompt_view,
    methods=['GET']
)

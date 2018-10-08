"""The Data layer. Has anything to do with creating,
    storing, getting, udpating, data
"""

import os
import datetime
from .protocol import response
from .audio import Audio
from peewee import (
    Model, SqliteDatabase, CharField, IntegerField,
    DateTimeField, ForeignKeyField, DoesNotExist, FloatField,
    AutoField
)


# define paths and directories
mimic_studio_dir = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "../db"
)
os.makedirs(mimic_studio_dir, exist_ok=True)
mimic_studio_db_path = os.path.join(
    mimic_studio_dir,
    "mimicstudio.db"
)

# setting up and db
mimic_studio_db = SqliteDatabase(mimic_studio_db_path)


class UserModel(Model):
    uuid = CharField(primary_key=True)
    mycroft_uuid = CharField(default="")
    user_name = CharField()
    prompt_num = IntegerField(default=0)
    total_time_spoken = FloatField(default=0.0)
    len_char_spoken = IntegerField(default=0)
    # TODO: language support, change this from default
    language = CharField(default='english')
    created_date = DateTimeField(default=datetime.datetime.now)

    class Meta:
        database = mimic_studio_db

    @staticmethod
    def validate(user):
        if user.get("uuid") and user.get("user_name"):
            return True
        else:
            return False


# TODO: use this for language support
class AudioModel(Model):
    id = AutoField()
    audio_id = CharField()
    prompt = CharField()
    language = CharField()
    user = ForeignKeyField(UserModel, backref="user")
    created_date = DateTimeField(default=datetime.datetime.now)

    class Meta:
        database = mimic_studio_db

# TODO: need to have prompt model to
# support multiple prompts
# class PromptMpdel(Model):
#     id = AutoField()
#     language = Cha


# connecting to dbs
mimic_studio_db.connect()
mimic_studio_db.create_tables([UserModel, AudioModel])


class DB:
    """DB layer"""
    UserModel = UserModel
    AudioModel = AudioModel

    @staticmethod
    def save_user(user: dict) -> response:
        try:
            DB.UserModel.create(uuid=user["uuid"], user_name=user["user_name"])
            return response(True)
        except Exception as e:
            # TODO: log exceptions
            print(e)
            return response(False, message="Exception thrown, check logs")

    @staticmethod
    def get_user(uuid: str) -> response:
        try:
            user = DB.UserModel.get(UserModel.uuid == uuid)
            data = {
                "user_name": user.user_name,
                "prompt_num": user.prompt_num,
                "total_time_spoken": user.total_time_spoken,
                "len_char_spoken": user.len_char_spoken,
                "language": user.language,
            }
            return response(True, data=data)
        except DoesNotExist:
            # TODO: log exceptions
            return response(
                False,
                message="user %s does not exist" % uuid
            )

    @staticmethod
    def update_user_metrics(uuid: str, time: float, char_len: int) -> response:
        try:
            query = UserModel \
                .update(
                    prompt_num=UserModel.prompt_num + 1,
                    total_time_spoken=UserModel.total_time_spoken + time,
                    len_char_spoken=UserModel.len_char_spoken + char_len
                ) \
                .where(uuid == uuid)
            query.execute()
            return response(True)
        except Exception as e:
            print(e)
            response(False)

    @staticmethod
    def save_audio(audio_id: str, prompt: str,
                   language: str, uuid: str) -> response:
        try:
            user = DB.UserModel.get(UserModel.uuid == uuid)
            if user:
                DB.AudioModel.create(
                    audio_id=audio_id,
                    prompt=prompt,
                    language=language,
                    user=user
                )
                return response(True)
            else:
                return response(
                    False,
                    message="user %s does not exist" % uuid
                )
        except Exception as e:
            print(e)
            return response(False, message="Exception thrown, check logs")

    # # TODO: should we add prompt in database?
    # @staticmethod
    # def get_prompt(prompt_num: int) -> response:
    #     prompt = prompt_fs.get(prompt_num)
    #     if prompt:
    #         data = {
    #             "prompt": prompt
    #         }
    #         return response(True, data=data)
    #     else:
    #         return response(False)

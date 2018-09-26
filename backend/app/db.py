import json
import os
import sqlite3
import datetime
import csv
import hashlib
from scipy.io import wavfile
from .protocol import response
from peewee import (
    Model, SqliteDatabase, CharField, IntegerField,
    DateTimeField, ForeignKeyField, DoesNotExist
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

prompts_dir = prompts_path = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "../prompts/"
)
os.makedirs(prompts_dir, exist_ok=True)
prompts_path = os.path.join(
    prompts_dir,
    "../prompts/english_prompts.csv"
)

audio_dir = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "../audio_files/"
)
os.makedirs(audio_dir, exist_ok=True)

# setting up and db
mimic_studio_db = SqliteDatabase(mimic_studio_db_path)


class UserModel(Model):
    uuid = CharField(primary_key=True)
    user_name = CharField()
    prompt_num = IntegerField(default=0)
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


class AudioModel(Model):
    audio_id = CharField(primary_key=True)
    audio_path = CharField()
    prompt = CharField()
    language = CharField()
    user = ForeignKeyField(UserModel, backref="user")
    created_date = DateTimeField(default=datetime.datetime.now)

    class Meta:
        database = mimic_studio_db

    @staticmethod
    def get_audio_path(uuid):
        return os.path.join(audio_dir, uuid)

    @staticmethod
    def create_file_name(prompt: str):
        return hashlib.md5(prompt.encode("utf-8")).hexdigest()


# Just a simple csv json reader for now
# TODO: store prompts in a database
class PromptModel:
    def __init__(self):
        self.data = []
        with open(prompts_path, 'r') as f:
            prompts = csv.reader(f, delimiter="\t")
            for p in prompts:
                self.data.append(p[2])

    def get(self, prompt_number):
        try:
            return self.data[prompt_number]
        except IndexError as e:
            # TODO: loggin
            print(e)
            return None


# connecting to dbs
mimic_studio_db.connect()
mimic_studio_db.create_tables([UserModel, AudioModel])


class DB:
    """DB layer"""
    UserModel = UserModel
    AudioModel = AudioModel
    PromptModel = PromptModel()

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
    def add_prompt_counter(uuid: str) -> response:
        try:
            query = UserModel \
                .update(prompt_num=UserModel.prompt_num + 1) \
                .where(uuid == uuid)
            query.execute()
            return response(True)
        except Exception as e:
            print(e)
            return response(False)

    @staticmethod
    def save_audio(audio: bytes, uuid: str, prompt: str) -> response:
        user_audio_dir = AudioModel.get_audio_path(uuid)
        file_name = AudioModel.create_file_name(prompt)
        path = os.path.join(user_audio_dir, file_name)
        os.makedirs(user_audio_dir, exist_ok=True)
        try:
            # wavfile.write(path, rate=22000, data=audio)
            with open(path + ".wav", 'wb+') as f:
                f.write(audio)
            with open(path + ".txt", 'w+') as f:
                f.write(prompt)
            return response(True)
        except Exception as e:
            # TODO: log Exception
            print(e)
            return response(False)

    @staticmethod
    def get_prompt(prompt_num: int) -> response:
        prompt = DB.PromptModel.get(prompt_num)
        if prompt:
            data = {
                "prompt": prompt
            }
            return response(True, data=data)
        else:
            return response(False)

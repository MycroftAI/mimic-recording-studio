# Copyright 2017, Mycroft AI Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import re
import argparse
import wikipedia as wiki
from format import pronounce_number, nice_date, nice_time
from parse import extract_numbers, normalize
from mycroft.util.lang.format_de import nice_response_de
import requests


class Name:
    def __init__(self):
        # print("importing args: ")
        lang = "en"
        lang = input("select language for wiki. for example 'en' ")
        parser = argparse.ArgumentParser()
        parser.add_argument(
            '--prepare_file', default="1",
            help='prepare .cvs file  only:3 none:0 after:1 default=1')
        parser.add_argument(
            '--file', default=lang+".csv",
            help='file path')
        parser.add_argument(
            '--disable_downloader', default="False",
            help='disable poodle and mozilla voice downloader')
        parser.add_argument(
            '--disable_num_worker', default="False",
            help='disable transalate 1 to one')

        args = parser.parse_args()
        #  print("args: ""\n"+str(args))

        if args.prepare_file is "3":
            self.check_file(args, lang)
        else:
            num_lines = 0
            if args.disable_downloader is "False":
                self.poodle_loader(lang, args)
                self.voice_web_loader(lang, args)
            while (num_lines < 35000):  # edit to set the length of the file
                summary = self.lookup(lang, wiki.random(pages=1))
                if summary is None:
                    continue
                else:
                    sentence = self.edit_sentences(summary)
                    num_lines = self.writing_sentence(sentence, args)
            if args.prepare_file is "1":
                self.check_file(args, lang)
        # print("sentence: " "\n"+ str(sentence))


    def lookup(self, lang, search):
        try:
            # Use the version of Wikipedia appropriate to the request language
            wiki.set_lang(lang)
            # First step is to get wiki article titles.  This comes back
            # as a list.  I.e. "beans" returns ['beans',
            #     'Beans, Beans the Music Fruit', 'Phaseolus vulgaris',
            #     'Baked beans', 'Navy beans']
            results = wiki.search(search, 5)
          #  print("wiki raw: "+str(results))
            if len(results) == 0:
                print("no answer found:")
                return None
            # Now request the summary for the first (best) match.  Wikipedia
            # writes in inverted-pyramid style, so the first sentence is the
            # most important, the second less important, etc.  Two sentences
            # is all we ever need.
            lines = 10
            summary = wiki.summary(results[0], lines)
          #  print("summary 1: "+"\n"+str(summary))

            # Now clean up the text and for speaking.  Remove words between
            # parenthesis and brackets.  Wikipedia often includes birthdates
            # in the article title, which breaks up the text badly.
            summary = re.sub(r'\([^)]*\)|/[^/]*/', '', summary)
            # print("the answer is: ""\n"+ str(summary))
            return summary

        except Exception as e:
            print("Error: {0}".format(e))


    def edit_sentences(self, summary):
       # print("before processing: "+"\n"+str(summary))
        summary = summary.replace('\n', '')
        summary = summary.replace('  ', ' ')
        # sentences are detected and extracted #8 and 200 is the length of the sentences
        receive = re.findall(r"[^.?!=]{14,195}[a-z]{2}[?!.]", summary)
        #print("receive: "+"\n"+ str(receive))
        result = "\n".join(receive)
        x = 0
        # Replace Whitespace and punctuation mark at begin and end
        while (x < 2):
            result = re.sub(r'(^ *| *$|^[,„“:-]*|^[\S]{,1} )', '', result, flags=re.M)
            x = x + 1
        return result


    def filter_sentence(self, sentence, args):
        sentence = re.sub(r'(\|\s?\w+)','', sentence, flags=re.M) # select one for poodle (emty|full)
        sentence = re.sub(r'[()%]|(^\\.+)*|(^#+\s?.*)', '', sentence, flags=re.M) # for poodle
        sentence = re.sub(r'(#+\s?.*)|(^[,.: ]*)', '', sentence, flags=re.M)
        sentence = sentence.replace('|', ' ').replace('  ', ' ')

        return sentence


    def writing_sentence(self, sentence, args):
        fobj_out = open("prompts"+"/"+args.file, "a")
        fobj_out.write(str(sentence) + "\n")
        num_lines = sum(1 for line in open("prompts"+"/"+args.file))
        print("writing data: ""\n"+sentence+"\n"+str(num_lines))
        fobj_out.close()
        return num_lines


    def num_worker(self, line, lang, args):
        if args.disable_num_worker is "False":
            num = ""
            number = ""
            # print("line bevor"+"\n"+line)
            num = extract_numbers(line, short_scale=True, ordinals=False,
                        lang="en-us")
            num = re.sub(r'(\.0)', '', str(num))
            num = re.findall(r'\d+', num)
            if not num is False:
                for item in num:
                    print("item #"+item)
                    number = pronounce_number(int(item), lang=lang, places=2,
                            short_scale=True, scientific=False)
                    line = line.replace(str(item), number)
            # print("line after"+"\n"+line)
        return line

    def poodle_loader(self, lang, args):
        data = requests.get("https://translate.mycroft.ai/export/?path=/"+lang+"/mycroft-skills/")
        data.encoding = 'utf-8'
        #print(data.encoding)
        sentence = "\n".join(re.findall(r'(msgstr ".*")', data.text)).replace("msgstr", "")
        sentence = re.sub(r'["\d]|{\n.*}\n', '', sentence).replace('\n \n','\n').replace('\n \n','\n')
        sentence = sentence.replace('\n \n','\n').replace('\n \n','\n').replace('\n \n','\n')
        summary = sentence
        sentence = self.filter_sentence(sentence, args) # filter data
        self.writing_sentence(sentence, args)
        #print(sentence)

    def voice_web_loader(self, lang, args):
        url = "https://raw.githubusercontent.com/mozilla/voice-web/master/server/data/"+lang+"/sentence-collector.txt"
        data = requests.get(url)
        data.encoding = 'utf-8'
        print(data.text)
        sentence = data.text
        sentence = self.filter_sentence(sentence, args) # filter data
        self.writing_sentence(sentence, args)
        #print(sentence)



    def check_file(self, args, lang):
        print("check file")
        # self.poodle_loader(lang, args)
        # self.voice_web_loader(lang, args)
        fobj_in = open("prompts"+"/"+args.file)
        fobj_out = open("prompts"+"/"+"corpus_"+args.file, "w")
        i = 1
        for line in fobj_in:
            line = line.replace('\n', '')
            line = line.replace('  ', ' ')
            # Replace Whitespace and punctuation mark at begin and end, recalculate length
            x = 0
            # print("line bevor"+"\n"+line)
            while (x < 2):
                line = re.sub(r'(^ *| ?\t[0-9]+|^[,„“:-]*)', '', line)
                x = x + 1
            line = self.filter_sentence(line, args) # filter data
            line = self.num_worker(line, lang, args)
            if len(line) <= 1: #delete sentense with one or zero word
                continue
            print("line "+str(i)+" "+line+"\t"+str(len(line)))
            fobj_out.write(str(line)+"\t"+str(len(line))+"\n")
            i = i + 1
        fobj_in.close()
        fobj_out.close()


if __name__ == "__main__":
    objName = Name()

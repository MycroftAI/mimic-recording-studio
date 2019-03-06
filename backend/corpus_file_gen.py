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

        args = parser.parse_args()
      #  print("args: ""\n"+str(args))

        if args.prepare_file is "3":
            self.check_file(args)
        else:
            num_lines = 0
            while (num_lines < 35000): # edit to set the length of the file
                random_art = self.lookup(lang, wiki.random(pages=1))
                if random_art is None:
                    continue
                else:
                    sentence = self.edit_sentences(random_art)
                    num_lines = self.writing_sentence(sentence, args)
            if args.prepare_file is "1":
                self.check_file(args)
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
          #  print("summary 1: ""\n"+str(summary))

            # Now clean up the text and for speaking.  Remove words between
            # parenthesis and brackets.  Wikipedia often includes birthdates
            # in the article title, which breaks up the text badly.
            summary = re.sub(r'\([^)]*\)|/[^/]*/', '', summary)
            # print("the answer is: ""\n"+ str(summary))
            return summary

        except Exception as e:
            print("Error: {0}".format(e))


    def edit_sentences(self, random_art):
       # print("before processing: ""\n"+str(random_art))
        random_art = random_art.replace('\n', '')
        # sentences are detected and extracted #8 and 200 is the length of the sentences
        receive = re.findall(r"[\s\w,„“:-]{14,200}[a-z][?!.]", random_art)
      #  print("receive: " "\n"+ str(receive))
        result = "\n".join(receive)
        return result


    def writing_sentence(self, sentence, args):
        fobj_out = open("prompts"+"/"+args.file, "a")
        fobj_out.write(str(sentence) + "\n")
        num_lines = sum(1 for line in open("prompts"+"/"+args.file))
        print("writing data: ""\n"+sentence+"\n"+str(num_lines))
        fobj_out.close()
        return num_lines


    def check_file(self, args):
        print ("check file")
        fobj_in = open("prompts"+"/"+args.file)
        fobj_out = open("prompts"+"/"+"corpus_"+args.file,"w")
        i = 1
        for line in fobj_in:
            line = line.replace('\n', '')
            line = line.replace('  ', ' ')
            # Replace Whitespace and punctuation mark at begin and end, recalculate length
            x = 0
            while (x < 2):
                line = re.sub(r'(^ *| ?\t[0-9]+|^[,„“:-]*de)', '', line)
                x = x + 1
            print("line "+str(i)+" "+line+"\t"+str(len(line)))
            fobj_out.write(str(line)+"\t"+str(len(line))+"\n")
            i = i + 1
        fobj_in.close()
        fobj_out.close()


if __name__ == "__main__":
    objName = Name()

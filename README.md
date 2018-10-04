# Mimic Recording Studio

![demo](demo.gif)

Mycroft's open source Mimic technologies are Text-to-Speech engines, which take a piece of written text and convert it into spoken audio. The latest generation of this technology, [Mimic 2](https://github.com/MycroftAI/mimic2), uses machine learning techniques to create a model, which can speak a specific language, sounding like the voice on which it was trained.

The Mimic Recording Studio simplifies the collection of training data from individuals, each of which can be used to produce a distinct voice for Mimic.

## Quick Start

### Dependencies

* [Docker](https://docs.docker.com/) (community edition is fine)
* [Docker Compose](https://docs.docker.com/compose/install/)

Why docker? To make this super easy to set up and run cross platforms.

### Build and Run

* `git clone https://github.com/MycroftAI/mimic-recording-studio.git`
* `cd mimic-recording-studio`
* `docker-compose up` to build and run
  * Alternatively, you can build and run seperately. `docker-compose build`, `docker-compose up`
* In browser, go to `http://localhost:3000`

**Note**
First `docker-compose up` will take a while as this command will also build the docker containers. Subsequent `docker-compose up` should be quicker to boot.

## Data

### Audios

#### wav files

Audios can be found in the `backend/audio_file/{uuid}/` directory. The backend automatically trims the beginning and ending silence for all wav files using [ffmpeg](https://www.ffmpeg.org/).

#### {uuid}-metadata.txt

Can also be found in `backend/audio_file/{uuid}/`. This file maps the wav file name to the phrase spoken. This along with the wav files are what you needed to get started on training [Mimic 2](https://github.com/MycroftAI/mimic2).

### Corpus

Right now, we have an english corpus, `english_corpus.csv` made available which can be found in `backend/prompt/`. To use your own corpus follow these steps.

1. create a csv file in the same format as `english_corpus.csv` using tabs (`\t`) as the delimitter.
2. change the `CORPUS` environment variable in `docker-compose.yml` to your corpus name.

## Technologies

### Frontend

The web UI is built using javascript and [React](https://reactjs.org/) and [create-react-app](https://github.com/facebook/create-react-app) as a scaffolding tool.

#### Functions

* Record and play audio
* Display audio visualization
* Calculate and display metrics

### Backend

The web service is built using python, [Flask](http://flask.pocoo.org/) as the backend framework, [gunicorn](https://gunicorn.org/) as a http webserver, and [sqlite](https://www.sqlite.org/index.html) as the database.

#### Functions

* Process audio
* Serves corpus and metrics data
* Record info in database

### Docker

Docker is used to containerized both applications. By default, frontend uses network port `3000` while the backend uses networking port `5000`. You can configure these in the `docker-compose.yml` file.

## Contributions

PR's are accepted!

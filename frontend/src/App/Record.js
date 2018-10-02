import React, { Component } from "react";
import { ReactMic as Visualizer } from "react-mic";
import Recorder from "./components/Recorder";
import hark from "hark";
import Wave from "./components/Wave";

// import microphoneSVG from './assets/microphone.svg'
import spacebarSVG from "./assets/space.svg";
import PSVG from "./assets/P.svg";
import rightSVG from "./assets/right.svg";

import {
  postAudio,
  getPrompt,
  getUser,
  createUser,
  getAudioLen
} from "./api";
import { getUUID, getName } from "./api/localstorage";

class Record extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userCreated: false,
      shouldRecord: false,
      displayWave: false,
      blob: undefined,
      play: false,
      prompt: "...error loading prompt...",
      language: "",
      promptNum: 0,
      totalTime: 0,
      totalCharLen: 0,
      audioLen: 0
    };

    this.uuid = getUUID()
    this.name = getName()
  }

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown, false);
    this.requestUserDetails(this.uuid);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyDown, false);
  }

  render() {
    return (
      <div id="PageRecord">
        <h1>Mimic Recording Studio</h1>
        <TopContainer
          userName={this.name}
          promptNum={this.state.promptNum}
        />
        <Metrics
          totalTime={this.state.totalTime}
          totalChar={this.state.totalCharLen}
          promptNum={this.state.promptNum}
        />
        <div id="phraseBox">
          {/* <div className="recordBox">
						<p>Click
							<img id="record" src={microphoneSVG} alt="" onClick={this.recordHandler} />
							and say this phrase:
						</p>
					</div> */}
          <div id="phrase">
            {this.renderFeedback()}
            {this.state.prompt}
          </div>
        </div>

        <div id="container ">
          {this.state.displayWav ? this.renderWave() : this.renderVisualizer()}
          <Recorder
            command={this.state.shouldRecord ? "start" : "stop"}
            onStart={() => this.shouldDisplayWave(false)}
            onStop={this.processBlob}
            gotStream={this.silenceDetection}
          />
        </div>

        <div id="controls">
          <a id="btn_Play" className="btn btn-play" onClick={this.playWav}>
            <i className="fas fa-play ibutton" />
            play
          </a>
          <a id="btn_Next" className="btn-next" onClick={this.onNext}>
            <i className="fas fa-forward ibutton-next" />
            next
          </a>
        </div>
      </div>
    );
  }

  requestPrompts = uuid => {
    getPrompt(uuid)
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          this.setState({
            prompt: res.data.prompt
          });
        }
      });
  };

  requestUserDetails = uuid => {
    getUser(uuid)
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          this.setState({
            userName: res.data.user_name,
            language: res.data.language,
            promptNum: res.data.prompt_num,
            totalTime: res.data.total_time_spoken,
            totalCharLen: res.data.len_char_spoken
          });
          this.requestPrompts(this.uuid);
        } else {
          if (this.uuid){
            createUser(this.uuid, this.name)
              .then(res => res.json())
              .then(res => {
                if (res.success) {
                  this.setState({userCreated: true})
                  this.requestPrompts(this.uuid);
                } else {
                  alert("sorry there is in error creating user")
                }
              })
          } else {
            alert("sorry there is in error creating user")
          }
        }
      });
  };

  renderFeedback = () => {
    if (this.state.promptNum < 10 || this.state.audioLen === 0) {
      return <div className="feedback-ball-grey"></div>
    }
    else {
      const speechRate = this.state.prompt.length / this.state.audioLen
      const avgSpeechRate = (this.state.totalCharLen / this.state.totalTime).toFixed(1)
      if ((avgSpeechRate * 0.9) < speechRate && speechRate < (avgSpeechRate * 1.1)) {
        return <div className="feedback-ball-green"></div>
      } else {
        return <div className="feedback-ball-red"></div>
      }
    }
  }

  renderWave = () => (
    <Wave
      className="wavedisplay"
      waveColor={"#FD9E66"}
      blob={this.state.blob}
      play={this.state.play}
      onFinish={this.stopWav}
    />
  );

  renderVisualizer = () => (
    <Visualizer
      className="wavedisplay"
      record={this.state.shouldRecord}
      backgroundColor={"#222222"}
      strokeColor={"#FD9E66"}
    />
  );

  processBlob = blob => {
    getAudioLen(this.uuid, blob)
      .then(res => res.json())
      .then(res => this.setState({
        audioLen: res.data.audio_len
      }))

    this.setState({
      blob: blob
    });
    this.shouldDisplayWave(true);
  };

  shouldDisplayWave = bool => this.setState({ displayWav: bool });

  playWav = () => this.setState({ play: true });

  stopWav = () => this.setState({ play: false });

  handleKeyDown = event => {
    // space bar code
    if (event.keyCode === 32) {
      if (!this.state.shouldRecord) {
        event.preventDefault();
        this.recordHandler();
      }
    }

    // play wav
    if (event.keyCode === 80) {
      event.preventDefault();
      this.playWav();
    }

    // next prompt
    if (event.keyCode === 39) {
      this.onNext();
    }
  };

  recordHandler = () => {
    this.setState((state, props) => {
      return {
        shouldRecord: !state.shouldRecord,
        play: false
      };
    });
  };

  onNext = () => {
    if (this.state.blob !== undefined) {
      postAudio(this.state.blob, this.state.prompt, this.uuid)
        .then(res => res.json())
        .then(res => {
          if (res.success) {
            this.setState({ displayWav: false });
            this.requestPrompts(this.uuid);
            this.requestUserDetails(this.uuid);
            this.setState({ blob: undefined });
          } else {
            alert("There was an error in saving that audio");
          }
        })
        .catch(err => console.log(err));
    }
  };

  silenceDetection = stream => {
    const options = {};
    const speechEvents = hark(stream, options);

    speechEvents.on("stopped_speaking", () => {
      this.setState({
        shouldRecord: false
      });
    });
  };
}

class TopContainer extends Component {
  render() {
    return (
      <div className="top-container">
        <div className="instructions2">
          <i className="fas fa-info-circle" />
          <h2>hints</h2>
          <ul className="hints">
            <li>
              <img src={spacebarSVG} className="key-icon" alt="space" /> will
              start recording
            </li>
            <li>Recording will auto-stop after you speak</li>
            <li>
              <img src={PSVG} className="key-icon" alt="p" /> will play recorded
              audio
            </li>
            <li>
              <img src={rightSVG} className="key-icon" alt="->" /> will go to
              next prompt
            </li>
          </ul>
        </div>
        <div className="session-info">
          <div className="top-info">
            <div>
              Recorder:&nbsp;
              <span id="sessionName">{this.props.userName}</span>
            </div>
            <div className="btn-restart">
            </div>
          </div>
          <hr />
          <p>
            It is very important that the recorded words{" "}
            <span className="highlight">
              match the text in the script exactly
            </span>
            . If you accidentally deviate from the script or are unsure, please
            record the prompt again.
          </p>
        </div>
      </div>
    );
  }
}

class Metrics extends Component {
  render() {
    return (
      <div className="metrics-container">
        <div className="total-hours">
          <h4>Progress</h4>
          <div>Phrase: {this.props.promptNum} / 23320</div>
          <div>Time Recorded: {Math.round(this.props.totalTime)} seconds</div>
        </div>
        <div className="speech-rate">
          <h4>Speech Rate</h4>
          <div>Average: {(this.props.totalChar / this.props.totalTime).toFixed(1)} characters per seconds</div>
        </div>
      </div>
    );
  }
}

export default Record;

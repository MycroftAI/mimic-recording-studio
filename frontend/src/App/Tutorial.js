import React, { Component } from "react";
import PhraseBox from "./components/PhraseBox";
import { ReactMic as Visualizer } from "react-mic";
import spacebarSVG from "./assets/space.svg";
import PSVG from "./assets/P.svg";
import rightSVG from "./assets/right.svg";

class Tutorial extends Component {
  render() {
    return (
      <div className="App">
        <h1>Tutorial</h1>
        <div className="tutorial">
            The Mimic Recording Studio was made to simplify the process of
            creating your own text to speech corpus. This tutorial will help you
            get started.
            <br />
            <br />
            <div>
            <h2>Recording Box</h2>
            <PhraseBox
                prompt="The human voice is the most perfect instrument of all."
                promptNum={0}
                audioLen={0}
                totalCharLen={0}
                totalTime={0}
            />
            <Visualizer
                className="wavedisplay"
                record={false}
                backgroundColor="#222222"
                strokeColor="#FD9E66"
            />
            <p>
                In the middle, you can see the phrase to record. To start the
                recording press the &nbsp;
                <img src={spacebarSVG} className="key-icon" alt="space" /> &nbsp;
                bar. The recording should automatically stop when it detects
                silence. To replay the recording press the &nbsp;
                <img src={PSVG} className="key-icon" alt="p" /> &nbsp;
                key. You may re-record
                that same phrase as many times as you like. <b>It is essential that the
                recorded words match the text in the script exactly. </b> If you
                accidentally deviate from the script or are unsure, please record
                the prompt again. Once saved you may not be able to go back. Press
                the &nbsp;
                <img src={rightSVG} className="key-icon" alt="->" />&nbsp;
                key to keep the recording and move on to the next phrase.
            </p>
          </div>
          <div>
              <h2>Feedback</h2>
              <p>
              When recording stops, you may notice a feedback indicator appearing in the top right corner of the Recording Box. This indicator will tell you if you are speaking to fast, to slow, or at a good pace.
              </p>
              <div className="grid-layout">
                <div className="feedback-ball-green-t">Good Pace</div>
                <div className="feedback-ball-red-t">Too Slow</div>
                <div className="feedback-ball-red-t">Too Fast</div>
              </div>
              <p><b>The indicator is determined using your average speech rate. The indicator will only start appearing after 100 recorded samples.
              </b>
            </p>
          </div>
          <div>
              <button className="btn" onClick={this.handleClick}>Record</button>
          </div>
        </div>
      </div>
    );
  }

  handleClick = () => {
      this.props.history.push("/record")
  }

}

export default Tutorial;

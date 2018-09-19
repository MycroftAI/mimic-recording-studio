import React, { Component } from 'react';
import microphoneSVG from './microphone.svg'

class Record extends Component {
    render(){
        return(
            <div id="PageRecord">
			<h1>Mimic Recording Studio</h1>
			<div className="top-container">
				<div className="instructions2">
					<i className="fas fa-info-circle"></i>
					<h2>hints</h2>
					<ul className="hints">
						<li>Spacebar will start recording</li>
						<li>Recording will auto-stop after you speak</li>
						<li>Spacebar will advance</li>
					</ul>
				</div>

				<div className="session-info">
					<div className="top-info">
						<div>
						Phrase: <span id="phraseNo">##</span>&nbsp;of&nbsp;<span id="phraseCnt">##</span><br/>Trainer:&nbsp;<span id="sessionName">Name</span>
						</div>
						<div className="btn-restart">
							<a href="https://freeassociation.mycroft.ai/mimic2/#" id="btn_newSession" className="btn-next">restart session</a>
						</div>
					</div>
					<hr/>
					<p>It is very important that the recorded words <span className="highlight">match the text
							in the script exactly</span>. If you accidentally deviate from the script or are unsure, please record the prompt again.</p>
				</div>
			</div>

			<div id="phraseBox">
				<div className="recordBox">
					<p>Click <img id="record" src={microphoneSVG} onClick="toggleRecording(this);" alt=""/>and say this phrase:</p>
				</div>
				<div id="phrase">Phrase to speak.</div>
			</div>

			<div id="container">
		    {/* <canvas id="analyser"></canvas> */}
		    <canvas id="wavedisplay"></canvas>
			</div>

			<div id="controls">
				<a href="https://freeassociation.mycroft.ai/mimic2/#" id="btn_Play" className="btn"><i className="fas fa-play ibutton"></i>play</a>
				<a href="https://freeassociation.mycroft.ai/mimic2/#" id="btn_Next" className="btn-next"><i className="fas fa-forward ibutton-next"></i>next</a>
			</div>

		</div>
        )
    }
}

export default Record;
import React, { Component } from 'react';
import { ReactMic as Visualizer } from 'react-mic';
import Recorder from './components/Recorder';
import hark from 'hark';
import Wave from './components/Wave';

import microphoneSVG from './assets/microphone.svg'
import spacebarSVG from './assets/space.svg';
import PSVG from './assets/P.svg';
import rightSVG from './assets/right.svg'

class Record extends Component {
	constructor(props) {
		super(props)

		this.state = {
			"shouldRecord": false,
			"displayWave": false,
			"blob": undefined,
			"play": false
		}
	}

	componentDidMount() {
		document.addEventListener("keydown", this.handleKeyDown, false);
	}

	componentWillUnmount() {
		document.removeEventListener("keydown", this.handleKeyDown, false);
	}

	render() {
		return (
			<div id="PageRecord">
				<h1>Mimic Recording Studio</h1>
				<TopContainer />
				<div id="phraseBox">
					{/* <div className="recordBox">
						<p>Click
							<img id="record" src={microphoneSVG} alt="" onClick={this.recordHandler} />
							and say this phrase:
						</p>
					</div> */}
					<div id="phrase">This is an example phrase that you will speak.</div>
				</div>

				<div id="container ">
					{
						this.state.displayWav ? this.renderWave() : this.renderVisualizer()
					}
					<Recorder
						command={this.state.shouldRecord ? "start" : "stop"}
						onStart={(data) => this.shouldDisplayWave(false)}
						onStop={(blob) => this.processBlob(blob)}
						gotStream={this.silenceDetection}
					/>
				</div>

				<div id="controls">
					<a id="btn_Play" className="btn btn-play" onClick={this.playWav}>
						<i className="fas fa-play ibutton"></i>
						play
					</a>
					<a id="btn_Next" className="btn-next">
						<i className="fas fa-forward ibutton-next"></i>
						nex
					t</a>
				</div>

			</div>
		)
	}

	renderWave = () => <Wave
		className="wavedisplay"
		waveColor={"#FD9E66"}
		blob={this.state.blob}
		play={this.state.play}
		onFinish={this.stopWav}
	/>

	renderVisualizer = () => <Visualizer
		className="wavedisplay"
		record={this.state.shouldRecord}
		backgroundColor={"#222222"}
		strokeColor={'#FD9E66'} />

	processBlob = (blob) => {
		this.setState({
			"blob": blob
		})
		this.shouldDisplayWave(true)
	}

	shouldDisplayWave = (bool) => this.setState({ "displayWav": bool })

	playWav = () => this.setState({ "play": true })

	stopWav = () => this.setState({ "play": false })

	handleKeyDown = (event) => {

		// space bar code
		if (event.keyCode === 32) {
			event.preventDefault()
			this.recordHandler()
		}

		// play wav
		if (event.keyCode === 80) {
			event.preventDefault()
			this.playWav()
		}

		// TODO: next prompt
	}

	recordHandler = () => {
		this.setState((state, props) => {
			return {
				"shouldRecord": !state.shouldRecord,
				"play": false
			}
		})
	}

	silenceDetection = (stream) => {
		const options = {};
		const speechEvents = hark(stream, options);

		speechEvents.on('stopped_speaking', () => {
			this.setState({
				"shouldRecord": false
			})
		});
	}
}

class TopContainer extends Component {
	render() {
		return (
			<div className="top-container">
				<div className="instructions2">
					<i className="fas fa-info-circle"></i>
					<h2>hints</h2>
					<ul className="hints">
						<li><img src={spacebarSVG} className="key-icon" /> will start recording</li>
						<li>Recording will auto-stop after you speak</li>
						<li><img src={PSVG} className="key-icon" /> will play recorded audio</li>
						<li><img src={rightSVG} className="key-icon" /> will go to next prompt</li>
					</ul>
				</div>

				<div className="session-info">
					<div className="top-info">
						<div>
							Phrase: <span id="phraseNo">##</span>&nbsp;of&nbsp;<span id="phraseCnt">##</span><br />Trainer:&nbsp;<span id="sessionName">Name</span>
						</div>
						<div className="btn-restart">
							<a href="https://freeassociation.mycroft.ai/mimic2/#" id="btn_newSession" className="btn-next">restart session</a>
						</div>
					</div>
					<hr />
					<p>It is very important that the recorded words <span className="highlight">match the text
					in the script exactly</span>. If you accidentally deviate from the script or are unsure, please record the prompt again.</p>
				</div>
			</div>

		)
	}
}

export default Record;
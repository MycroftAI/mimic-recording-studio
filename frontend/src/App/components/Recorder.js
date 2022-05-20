/* 
This code was modified to work with the lastest React Version.
Original code can be found here 
https://github.com/agrasley/react-recorder/blob/master/src/Recorder.js

The MIT License (MIT)

Copyright (c) 2016 Alexander Grasley

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

import React from 'react'
import PropTypes from 'prop-types';

class Recorder extends React.Component {

	start () {
		this.mediaRecorder.start()
	}

	stop () {
		this.mediaRecorder.stop()
	}

	pause () {
		this.mediaRecorder.pause()
	}

	resume () {
		this.mediaRecorder.resume()
	}

	componentDidMount () {
		navigator.getUserMedia = (navigator.getUserMedia ||
			navigator.mozGetUserMedia ||
			navigator.msGetUserMedia ||
			navigator.webkitGetUserMedia);

		if (navigator.getUserMedia && window.MediaRecorder) {
			const constraints = {
				audio: {
					echoCancellation: false,
					autoGainControl: false,
					noiseSuppression: false,
				}
			};
			this.chunks = [];
			const { blobOpts, onStop, onError, mediaOpts, onPause, onResume, onStart, gotStream } = this.props;

			const onErr = err => {
				console.warn(err);
				if (onError) onError(err)
			};

			const onSuccess = stream => {
                
				this.mediaRecorder = new window.MediaRecorder(stream, mediaOpts || {});

				this.mediaRecorder.ondataavailable = e => {
					this.chunks.push(e.data)
				};

				this.mediaRecorder.onstop = e => {
					const blob = new window.Blob(this.chunks, blobOpts || {type: 'audio/wav'});
					this.chunks = [];
					onStop(blob)
				};

				this.mediaRecorder.onerror = onErr;
				if (onPause) this.mediaRecorder.onpause = onPause;
				if (onResume) this.mediaRecorder.onresume = onResume;
				if (onStart) this.mediaRecorder.onstart = onStart;
				this.stream = stream;
				if (gotStream) gotStream(stream)
			};

			navigator.getUserMedia(constraints, onSuccess, onErr)
		} else {
			console.warn('Audio recording APIs not supported by this browser');
			const { onMissingAPIs } = this.props;
			if (onMissingAPIs) {
				onMissingAPIs(navigator.getUserMedia, window.MediaRecorder)
			} else {
				window.alert('Your browser doesn\'t support native microphone recording. For best results, we recommend using Google Chrome or Mozilla Firefox to use this site.')
			}
		}
	}

	componentDidUpdate (prevProps) {
		if (this.props.command && this.props.command !== 'none' && prevProps.command !== this.props.command) {
			this[this.props.command]()
		}
	}

	componentWillUnmount () {
		if (this.props.onUnmount) this.props.onUnmount(this.stream)
	}

	render () {
		return false
	}
}

Recorder.propTypes = {
	command: PropTypes.oneOf(['start', 'stop', 'pause', 'resume', 'none']),
	onStop: PropTypes.func.isRequired,
	onMissingAPIs: PropTypes.func,
	onError: PropTypes.func,
	onPause: PropTypes.func,
	onStart: PropTypes.func,
	onResume: PropTypes.func,
	onUnmount: PropTypes.func,
	gotStream: PropTypes.func,
	blobOpts: PropTypes.object,
	mediaOpts: PropTypes.object
};

export default Recorder

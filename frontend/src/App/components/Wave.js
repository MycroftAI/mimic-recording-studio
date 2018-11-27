import React, { Component } from "react";
import WaveSurfer from "wavesurfer.js";
import PropTypes from 'prop-types';

class Wave extends Component {
    componentDidMount() {
        document.addEventListener("keydown", this.handleKeyDown, false);

        const { waveColor, blob } = this.props;
        this.wavesurfer = WaveSurfer.create({
            container: "#waveform",
            waveColor: waveColor ? waveColor : "#FD9E66"
        });
        this.loadWaveForm(blob);
        this.wavesurfer.on("finish", () => {
            this.wavesurfer.pause();
            this.props.onFinish();
        });
    }

    componentDidUpdate() {
        if (this.props.play) {
            console.log("play")
            this.wavesurfer.play();
        } else {
            console.log("pausing")
            this.wavesurfer.pause();
        }
    }

    handleKeyDown = (event) => {
        if (event.keyCode === 27) {
            this.wavesurfer.pause()
        }
    }

    render() {
        const cssClass = this.props.className ? this.props.className : "";
        return (
            <div
                id="waveform"
                className={cssClass}
            />
        );
    }

    loadWaveForm = blob => {
        this.wavesurfer.loadBlob(blob);
    };
}

Wave.propTypes = {
    className: PropTypes.string,
    waveColor: PropTypes.string,
    blob: PropTypes.blob,
    play: PropTypes.bool,
    onFinish: PropTypes.func
}

export default Wave;

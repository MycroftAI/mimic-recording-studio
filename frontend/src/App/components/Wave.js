import React, { Component } from "react";
import WaveSurfer from "wavesurfer.js";

class Wave extends Component {
    componentDidMount() {
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
            this.wavesurfer.play();
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

export default Wave;

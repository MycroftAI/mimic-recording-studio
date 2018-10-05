import React, { Component } from "react";
import PropTypes from 'prop-types';

class Metrics extends Component {
    render() {
        let charPerSec = (this.props.totalCharLen / this.props.totalTime).toFixed(1);
        charPerSec = isNaN(charPerSec) ? 0 : charPerSec;
        return (
            <div className="metrics-container">
                <div className="total-hours">
                    <h2>PROGRESS</h2>
                    <div>
                        Phrase: {this.props.promptNum} / {this.props.totalPrompt}
                    </div>
                    <div>
                        Time Recorded: {this.secondsToHms(Math.round(this.props.totalTime))}
                    </div>
                </div>
                <div className="speech-rate">
                    <h2>SPEECH RATE</h2>
                    <div>Overall Average: {charPerSec} characters per second</div>
                </div>
            </div>
        );
    }

    secondsToHms = d => {
        d = Number(d);
        var h = Math.floor(d / 3600);
        var m = Math.floor((d % 3600) / 60);
        var s = Math.floor((d % 3600) % 60);

        var hDisplay = h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : "";
        var mDisplay = m > 0 ? m + (m === 1 ? " minute, " : " minutes, ") : "";
        var sDisplay = s > 0 ? s + (s === 1 ? " second" : " seconds") : "";
        return hDisplay + mDisplay + sDisplay;
    };
}

Metrics.propTypes = {
    promptNum: PropTypes.number,
    totalCharLen: PropTypes.number,
    totalTime: PropTypes.number,
    totalPrompt: PropTypes.number
}

export default Metrics;

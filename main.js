/* Copyright 2013 Chris Wilson

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = new AudioContext();
var audioInput = null,
    realAudioInput = null,
    inputPoint = null,
    audioRecorder = null;
var rafID = null;
var analyserContext = null;
var canvasWidth, canvasHeight;
var recIndex = 0;
var lastRecording = null;
var lastRecordingZIP = null;


////////////////////////////////////////////////////////////////////////
// Playback Utilities

function PlaySound(audioID, vol) {
    vol = Default(vol, 1.0);
    DebugLog("PlaySound: " + audioID);
    var sound = document.getElementById(audioID);
    sound.volume = vol;
    sound.play();
}

function StopSound(audioID) {
    DebugLog("StopSound: '" + audioID + "'");
    var sound = document.getElementById(audioID);
    sound.pause();
}

///////////////////////////////////////
// logging support

function HHMMSSmmm() {
    var now = new Date();
    var MS = "000" + now.getMilliseconds();
    return now.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1") + "." + MS.substr(MS.length - 3);
}

var debuggingCategories = [
];

function AddDebugCategory(cat) {
    if (!IsDebugging(cat))
        debuggingCategories.push(cat);
}
function RemoveDebugCategory(cat) {
    var index = debuggingCategories.indexOf(cat);    // <-- Not supported in <IE9
    if (index !== -1) {
        debuggingCategories.splice(index, 1);
    }
}

function setDebugging(aCats) {
    debuggingCategories = aCats;
}

function IsDebugging(category) {
    return !(debuggingCategories.indexOf(category) === -1);
}

function DebugLog(str, category) {
    if (IsDefined(category)) {
        // See if this is a category that we are looking for right now
        if (debuggingCategories.indexOf(category) === -1)
            return;		// ignore this message, we aren't debugging this category right now
    }

    if (!(typeof str === 'string' || str instanceof String))
        str = JSON.stringify(str);

    console.log(HHMMSSmmm() + " - " + str + "\n");
}

////////////////////////////////////////////////////////////////////////
// General Utilities

function Default(parameter, defaultValue) {
    if (typeof (parameter) === "undefined")
        return defaultValue;
    else
        return parameter;
}

function IsDefined(parameter)
{
	return !(typeof(parameter) === "undefined");
}

function setCookie(cookie_name, cookie_value, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires=" + d.toGMTString();
    document.cookie = cookie_name + "='" + cookie_value + "';" + expires + ";path=/";
}

function getCookie(cookie_name) {
    var name = cookie_name + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            var value = c.substring(name.length, c.length);
            if ((value[0] == '"' || value[0] == "'") && value[value.length-1] == value[0])
                return value.substring(1, value.length-1);
            return value;
        }
    }
    return "";
}

function isInt(value) {
  return !isNaN(value) && 
         parseInt(Number(value)) == value && 
         !isNaN(parseInt(value, 10));
}

function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
          tmp = item.split("=");
          if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

// Taken from:  http://www.html5rocks.com/en/tutorials/es6/promises/#toc-javascript-promises
// Added the optional respType parameter

function get(url, respType) {
	return doXHR("GET", url, respType, null);
}

// Ex: post("createAcct.php", "fname=Henry&lname=Ford");
//     post("compactDbase.php");
function post(url, data, datatype=null) {
    // datatype can be:  
    //  * null or "application/x-www-form-urlencoded"
    //    Good for general form submission (e.g. data = FormData object)
    //  * "multipart/form-data"
    //    Good for sending blob data (e.g. data = blob(s))
    //  * "text/plain"
    //    Not currently implemented
    
	return doXHR("POST", url, data, datatype);
}

function doXHR(method, url, param, datatype) {
	// DebugLog("XHR "+method+": "+url, "XHR");
	
	// Return a new promise.
	return new Promise(function(resolve, reject) {
		// Do the usual XHR stuff
		var req = new XMLHttpRequest();
		
		if (method === "GET" && IsDefined(param))
		{
			var respType = param;
			if (respType === "blob" || respType === "arrayBuffer" || respType === "document" || respType === "json" || respType === "text")
				req.responseType = respType;
		}
		req.open(method, url);

		req.onload = function() {
			// This is called even on 404 etc
			// so check the status
			if (req.status === 200) {
				// Resolve the promise with the response text
				resolve(req.response);
			}
			else {
				// Otherwise reject with the status text
				// which will hopefully be a meaningful error
				reject(Error(req.statusText+": "+url));
			}
		};

		// Handle network errors
		req.onerror = function() {
			reject(Error("Network Error"));
		};

		// Make the request
		if (method === "POST" && IsDefined(param))
		{
            if (datatype == "multipart/form-data")
            {
/*                // Construct the whole shebang the hard way...
                var sBoundary = "---------------------------" + Date.now().toString(16);
                req.setRequestHeader("Content-Type", "multipart\/form-data; boundary=" + sBoundary);
                
                // Assume data is a blob or array of blobs
                var aBlobs = (param.constructor === Array) ? param : [param];
                var segments = []
                for (i=0; i < aBlobs.length; i++)
                {
                    // TODO: SSP Not complete yet ...
                    segments.push('Content-Disposition: form-data; ' +
                                 'name="blob' + i + '"; ' + 
                                'filename="file' + i + '.bin"\r\n ' +
                                'Content-Type: ' + aBlobs[i].type + '\r\n\r\n');
                }
                
                req.sendAsBinary("--" + sBoundary + "\r\n" +
                                 segments.join("--" + sBoundary + "\r\n") +
                                 "--" + sBoundary + "--\r\n");*/
                var blobOrFile = param;
                req.send(blobOrFile);
            }
            else
            {
                var data = param;
                req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                req.send(data);
            }
		}
		else
			req.send();
	});
}

////////////////////////////////////////////////////////////////////////
// Audio Helpers

function saveAudio() {
    // Convert the audio into a WAV buffer
    audioRecorder.exportWAV( doneEncodingWAV );
    
    // could get mono instead by saying
    // audioRecorder.exportMonoWAV( doneEncodingWAV );
}

function gotBuffers( buffers ) {
    var canvas = document.getElementById( "wavedisplay" );

    drawBuffer( canvas.width, canvas.height, canvas.getContext('2d'), buffers[0] );

    // the ONLY time gotBuffers is called is right after a new recording is completed - 
    // so here's where we should set up the download.
    audioRecorder.exportWAV( doneEncodingWAV );
}

function doneEncodingWAV( blob ) {
    lastRecording = blob;
    
    // Kick off compression of the WAV to minimize the upload
    beginZipping(blob);

    // TODO: Is this needed anymore?
    Recorder.setupDownload( blob, "myRecording" + ((recIndex<10)?"0":"") + recIndex + ".wav" );
    recIndex++;
    stage = 2;
}

function beginZipping( blob ) {
    var zip = new JSZip();
    
    zip.file("recording.wav", blob);
    zip.generateAsync({type:"blob", compression:"DEFLATE", compressionOptions:{ level: 9}}).then( function(content) {
            lastRecordingZIP = content;
        }
    );
}

function toggleRecording( e ) {
    if (e.classList.contains("recording")) {
        // stop recording
        audioRecorder.stop();
        e.classList.remove("recording");
        audioRecorder.getBuffers( gotBuffers );
    } else {
        // start recording
        if (!audioRecorder)
            return;
        
        e.classList.add("recording");
        document.getElementById("wavedisplay").style.display = "none";
        document.getElementById("analyser").style.display = "block";
        
        audioRecorder.clear();
        hasSpoken = false;
        stillTalking = 100;
        audioRecorder.record();
        setRecordingAutostop();
    }
}

function convertToMono( input ) {
    var splitter = audioContext.createChannelSplitter(2);
    var merger = audioContext.createChannelMerger(2);

    input.connect( splitter );
    splitter.connect( merger, 0, 0 );
    splitter.connect( merger, 0, 1 );
    return merger;
}

function cancelAnalyserUpdates() {
    window.cancelAnimationFrame( rafID );
    rafID = null;
}


var runningAvgData = null;
var hasSpoken = false;
var stillTalking = 100;


function updateAnalysers(time) {
    if (!analyserContext) {
        var canvas = document.getElementById("analyser");
        canvasWidth = canvas.width;
        canvasHeight = canvas.height;
        analyserContext = canvas.getContext('2d');
    }

    // analyzer draw code here
    {
        var SPACING = 3;
        var BAR_WIDTH = 1;
        var numBars = Math.round(canvasWidth / SPACING);
        var freqByteData = new Uint8Array(analyserNode.frequencyBinCount);

        analyserNode.getByteFrequencyData(freqByteData); 
        
        analyserContext.clearRect(0, 0, canvasWidth, canvasHeight);
        analyserContext.fillStyle = '#F6D565';
        analyserContext.lineCap = 'round';
        var multiplier = analyserNode.frequencyBinCount / numBars;

        // Draw rectangle for each frequency bin.
        for (var i = 0; i < numBars; ++i) {
            var magnitude = 0;
            var offset = Math.floor( i * multiplier );
            // gotta sum/average the block, or we miss narrow-bandwidth spikes
            for (var j = 0; j< multiplier; j++)
                magnitude += freqByteData[offset + j];
            magnitude = magnitude / multiplier;
            var magnitude2 = freqByteData[i * multiplier];
            
            if (stillTalking > 0)
                l = "50%";
            else
                l = "10%";  // dim once talking has stopped
            analyserContext.fillStyle = "hsl( " + Math.round((i*360)/numBars) + ", 100%, "+l+")";
            analyserContext.fillRect(i * SPACING, canvasHeight, BAR_WIDTH, -magnitude);
        }
        
        
        // When not recording establish what "quiet" sounds like
        var bufferLength= analyserNode.frequencyBinCount;
        if (!audioRecorder || !audioRecorder.isRecording())
        {
            if (!runningAvgData)
            {
                // Allocate and initialize audio buffers to zero
                runningAvgData = new Uint8Array(bufferLength);        
            }

            // Raise immediately, decay slowly (1/8th)
            for(var i = 0; i < bufferLength; i++)
            {
                if (freqByteData[i] > runningAvgData[i])
                    runningAvgData[i] = freqByteData[i];
                else
                    runningAvgData[i] = (runningAvgData[i]*7 + freqByteData[i])/8;
            }
        }
        else
        {
            // Currently recording -- check if we should auto-stop
            var cExceeding = 0;
            var iIgnoreRumble = bufferLength/8;		// discount the low-end (basically just rumbling)
            for(var i = 0; i < bufferLength; i++)
            {
                if (i > iIgnoreRumble)
                {
                    if (freqByteData[i] > 32 && freqByteData[i] > runningAvgData[i]*1.3)
                        cExceeding++;
                }
                else
                {
                    if (freqByteData[i] > 32 && freqByteData[i] > runningAvgData[i]*(1.3 + 1.3*Math.pow(5/6, iIgnoreRumble-i)))
                        cExceeding++;
                }
            }
            
            isNoisy = (cExceeding > bufferLength/8);
            
            if (hasSpoken)
            {
                if (isNoisy)
                    stillTalking = 100; // takes 100 samples to go "quiet"
                else
                {
                    stillTalking--;
                    if (stillTalking < 0)
                    {
                        // Auto-stop when quiet
                        toggleRecording(document.getElementById( "record" ));
                    }
                }
            }
            else
            {
                hasSpoken = isNoisy;
                stillTalking = 100; // takes 100 samples to go "quiet"
            }
        }
    }
    
    rafID = window.requestAnimationFrame( updateAnalysers );
}

function toggleMono() {
    if (audioInput != realAudioInput) {
        audioInput.disconnect();
        realAudioInput.disconnect();
        audioInput = realAudioInput;
    } else {
        realAudioInput.disconnect();
        audioInput = convertToMono( realAudioInput );
    }

    audioInput.connect(inputPoint);
}

function gotStream(stream) {
    inputPoint = audioContext.createGain();

    // Create an AudioNode from the stream.
    realAudioInput = audioContext.createMediaStreamSource(stream);
    audioInput = realAudioInput;
    audioInput.connect(inputPoint);

//    audioInput = convertToMono( input );

    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;
    inputPoint.connect( analyserNode );

    audioRecorder = new Recorder( inputPoint );

    zeroGain = audioContext.createGain();
    zeroGain.gain.value = 0.0;
    inputPoint.connect( zeroGain );
    zeroGain.connect( audioContext.destination );
    updateAnalysers();
}

function initAudio() {
        if (!navigator.getUserMedia)
            navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        if (!navigator.cancelAnimationFrame)
            navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
        if (!navigator.requestAnimationFrame)
            navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

    navigator.getUserMedia(
        {
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            },
        }, gotStream, function(e) {
            alert('Error getting audio');
            console.log(e);
        });
}



////////////////////////////////////////////////////////////////////////
// Program flow



window.addEventListener('load', initAudio );


/* Globals */
var timeoutRecording = null;
var timeout_record_autostop_ms = 15000;  // 15 secs max recording time

var timeoutNoInteraction = null;
var timeout_interaction_ms = 60000;  // one minute
var stage = 0;   // 0 = registering, 1 = hasn't started recording, 2 = recording has completed, 3 = doing a playback

function setRecordingAutostop() {
  // Clear last interval
  clearTimeout(timeoutRecording);
  // Start a new interval
  timeoutRecording = setTimeout(function(){
    // Automatically stop the recording process
    if (audioRecorder.isRecording())
    {
        toggleRecording(document.getElementById( "record" ));
    }
  }, timeout_record_autostop_ms);
}

// Call this function to add a user interaction and clear the last interval
function refreshIfNoInteraction() {
    return;  // Not using this mechanism for now.
    
  // Clear last interval
  clearTimeout(timeoutNoInteraction);
  // Start a new interval
  timeoutNoInteraction = setTimeout(function(){
    // Check if isn't on the first page
    if (document.querySelector("#PageIntro").style.display == "none") {
      console.log("RELOAD");
      onButtonPage5();
    }
  }, timeout_interaction_ms);
}

function drawBuffer( width, height, context, data ) {
    var step = Math.ceil( data.length / width );
    var amp = height / 2;
    context.fillStyle = "silver";
    context.clearRect(0,0,width,height);
    for(var i=0; i < width; i++){
        var min = 1.0;
        var max = -1.0;
        for (j=0; j<step; j++) {
            var datum = data[(i*step)+j]; 
            if (datum < min)
                min = datum;
            if (datum > max)
                max = datum;
        }
        context.fillRect(i,(1+min)*amp,1,Math.max(1,(max-min)*amp));
    }
}

function init()
{
    // Attach user interface elements
    document.getElementById("btn_PageIntro").onclick = onButtonLetsGo;
    document.getElementById("btn_Next").onclick = onButtonNextRecording;
    document.getElementById("btn_Play").onclick = onButtonPlayRecording;
    document.getElementById("btn_StartOver").onclick = onButtonNewSession;
    document.getElementById("btn_newSession").onclick = onButtonNewSession;


    // register keyboard shortcuts
    document.addEventListener('keyup', doc_keyUp, false);


    document.getElementById("yourname").value = getCookie("yourname");

    var phraseNo = findGetParameter("phraseNo");
    if (phraseNo != null)
    {
        // User requested a specific page, jump to it...
        setCookie("phraseNo", phraseNo, 5*365);
        onButtonLetsGo();
    }
    else
    {
        // first visit?
    }
 
    refreshIfNoInteraction();
}

// Keyboard shortcut
function doc_keyUp(e)
{
    if (e.keyCode == 32)
    {
        // SPACEBAR = next step based on stage
        if (stage == 1) {
            // Give it 500ms to not catch the sound of the keyboard
            setTimeout(function () { toggleRecording(document.getElementById("record")); }, 
                       500);
        }
        else if (stage == 2)
            onButtonNextRecording();
        else if (stage == 3)
            pauseSound();
    }
    else
        DebugLog("KeyCode: " + e.keyCode);
}


function prepPage(name)
{
    document.getElementById("PageIntro").style.display = "none";
    document.getElementById("PageRecord").style.display = "none";
    document.getElementById("PageDone").style.display = "none";
    
    document.getElementById("Page"+name).style.display = "block";
    if (document.getElementById("btn_Page"+name))
        document.getElementById("btn_Page"+name).classList.add("disabled");

    document.getElementById("wavedisplay").style.display = "none";
    document.getElementById("analyser").style.display = "block";
    document.getElementById("container").style.display = "inline";
    
    // Touch the interaction timer
    refreshIfNoInteraction();
}

function onButtonLetsGo()
{
    var name = document.getElementById("yourname").value;
    if (!name || name == "") {
        alert("You must enter a session name!");
        document.getElementById("yourname").focus();
        return;
    }

    document.getElementById("PageIntro").style.display = "none";

    // Save the user's name in a cookie for 5 years
    setCookie("yourname", name, 5*365);

    var phraseNo = getCookie("phraseNo");
    if (!isInt(phraseNo) || phraseNo < 1) {
        phraseNo = 1;
        setCookie("phraseNo", phraseNo, 5 * 365);
    }

    // Show progress and session name
    document.getElementById("phraseNo").innerHTML = "<sup><font size='-1'>#</font></sup>" + phraseNo;

    var sessionName = getCookie("yourname");
    document.getElementById("sessionName").innerHTML = '<a href="browse.html#voices%2F' + encodeURIComponent(sessionName) + '" target="_blank">' + sessionName + '</a>';
    
    get("data.php?phraseNo="+phraseNo, "json").then(
        function(result){
            if (result['phrase'] != null) {
                document.getElementById("phrase").innerHTML = result['phrase'];
                document.getElementById("phraseCnt").innerHTML = result['total'];
            }
            else
                prepPage("Done");
        },
        function (err){
            alert("Error contacting server: "+err);
        }
    );
    
    // Prep page 2
    document.getElementById("btn_Next").classList.add("disabled");
    document.getElementById("btn_Play").classList.add("disabled");
    prepPage("Record");
    stage = 1;

    return;
}

function onButtonNextRecording()
{
    if (!lastRecording)
    {
        alert("ERROR, no lastRecording blob!")
        return;
    }
    
    document.getElementById("btn_Next").style.backgroundColor = "yellow";
    document.getElementById("btn_Next").style.color = "black";
    document.getElementById("btn_Next").innerHTML = ">&nbsp;>&nbsp;>";
    
    var formData = new FormData();
    formData.append("user", getCookie("yourname"));
    formData.append("phraseNo", getCookie("phraseNo"));
    // formData.append("theWAV", lastRecording);    // uncompressed version
    formData.append("theWAV", lastRecordingZIP);    // compressed version

    // Send the recording to the remote server
    post('data.php', formData, "multipart/form-data").then(
        function (result) {
            document.location = document.location.origin + document.location.pathname + "?phraseNo="+(parseInt(getCookie("phraseNo")) + 1);
        },
        function (err) {
            alert("Upload Error: "+err);
        }
    );
}

var player = null;
var playing = false;

function onButtonPlayRecording() {
    if (playing) {
        document.getElementById("btn_Play").innerHTML = "Play";
        player.stop();
        playing = false;
        stage = 2;  // ready to move to next recording again
        return;
    }

    if (!lastRecording)
        return;

    player = soundManager.createSound({
        url: URL.createObjectURL(lastRecording),
//        type: blobType,
        autoLoad: true,
        stream: false,
        autoPlay: true,
        onfinish: function () {
            if (playing)
                onButtonPlayRecording();
        },
    });

    document.getElementById("btn_Play").innerHTML = "Stop";
    player.setVolume(50);
    playing = true;
    stage = 3;  // during playback, spacebar == pause.
}

function onButtonNewSession()
{
    if (!confirm("Are you sure?  This will stop your progress in your current recording session and start over a phrase #1."))
        return;

    setCookie("phraseNo", 1, 5*365);
    setCookie("yourname", "", 5*365);
    document.location = document.location.origin + document.location.pathname;
}

function recordingCallback(blobURL)
{
    // blobURL is data for the recording WAV
    // 
    // alert(blobURL);

    // TODO: Save this for POSTing later

    //x document.getElementById("analyser").style.visibility = "visible";
    //x document.getElementById("wavedisplay").style.visibility = "visible";
    
    document.getElementById("wavedisplay").style.display = "block";
    document.getElementById("analyser").style.display = "none";
    
    document.getElementById("btn_Next").classList.remove("disabled");
    document.getElementById("btn_Play").classList.remove("disabled");
}


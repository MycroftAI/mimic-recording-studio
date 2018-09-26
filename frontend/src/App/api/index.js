const apiRoot = "http://localhost:5000/";

export const postAudio = (audio, prompt, uuid) => {
    fetch(apiRoot + `api/audio/?uuid=${uuid}&prompt=${prompt}`, {
        method: "POST",
        body: audio,
        headers: {
            "Content-Type": "audio/wav"
        }
    })
        .then(res => res.json())
        .then(res => console.log(res))
        .catch(err => console.log(err));
};

export const getPrompt = uuid => {
    return fetch(apiRoot + `api/prompt/?uuid=${uuid}`, {
        method: "GET"
    });
};

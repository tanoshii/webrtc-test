'use strict';

const video = document.querySelector('video');
const constraints = { audio: false, video: true };
const offerOptions = { offerToReceiveAudio: 1, offerToReceiveVideo: 1 };
const socket = io.connect();
const room = "qweqwe";

let localStream;
let peerConnection;

function grabWebCamVideo() {
    console.log("Obtaining local stream");
	navigator
		.mediaDevices
		.getUserMedia(constraints)
		.then(createPeerConnection)
		.catch(console.error);
}

function createPeerConnection(stream) {
    console.log("Creating peer connection");
    localStream = stream;
    peerConnection = new RTCPeerConnection();
    peerConnection.addEventListener("icecandidate", onIceCandidate);
    
    localStream
        .getTracks()
        .forEach((track) => {
            console.log("Adding track", track);
            peerConnection.addTrack(track, localStream);
        });
        
    console.log("Creating offer");
    peerConnection
        .createOffer(offerOptions)
        .then((offer) => peerConnection.setLocalDescription(offer))
        .then(() => socket.emit("offer", peerConnection.localDescription))
        .catch(console.error);
}

function onIceCandidate(event) {
	if (event.candidate) {
		console.log("Sending ICE candidate")
		socket.emit("candidate", {
			type: 'candidate',
			label: event.candidate.sdpMLineIndex,
			id: event.candidate.sdpMid,
			candidate: event.candidate.candidate
		});
	}
}

function handleAnswer(message) {
    console.log("Handling answer");
    peerConnection
        .setRemoteDescription(new RTCSessionDescription(message))
        .catch(console.error);
}

function addIceCandidate(message) {
    console.log("Adding ICE candidate");
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: message.label,
        candidate: message.candidate
    });
    
    peerConnection
        .addIceCandidate(candidate)
        .catch(console.error);
}

socket.emit("create", room);
socket.on("joined", grabWebCamVideo);
socket.on("answer", handleAnswer);
socket.on("candidate", addIceCandidate);


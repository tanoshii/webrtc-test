'use strict';

const video = document.querySelector('video');
const offerOptions = { offerToReceiveAudio: 1, offerToReceiveVideo: 1 };
const socket = io.connect();
const room = "qweqwe";

let remoteStream;
let peerConnection;

function createPeerConnection() {
    console.log("Creating peer connection");
    peerConnection = new RTCPeerConnection();
    peerConnection.addEventListener("icecandidate", onIceCandidate);
    peerConnection.addEventListener("track", onTrack);

    console.log("Creating offer");
    peerConnection
        .createOffer(offerOptions)
        .then((offer) => peerConnection.setLocalDescription(offer))
        .then(() => socket.emit("offer", peerConnection.localDescription))
        .catch(console.error);
}

function handleAnswer(message) {
    console.log("Handling answer");
    peerConnection
        .setRemoteDescription(new RTCSessionDescription(message))
        .catch(console.error);
}

function onTrack(event) {
    console.log("Remote stream added", event);
    remoteStream = event.streams[0];
    video.srcObject = remoteStream;
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

socket.emit("join", room);
socket.on("joined", createPeerConnection);
socket.on("answer", handleAnswer);
socket.on("candidate", addIceCandidate);
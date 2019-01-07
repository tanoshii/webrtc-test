'use strict';

const video = document.querySelector('video');
const constraints = { audio: false, video: true };
const offerOptions = { offerToReceiveAudio: 1, offerToReceiveVideo: 1 };
const socket = io.connect();
const room = "qweqwe";

let remoteStream;
let peerConnection;

function createPeerConnection(message) {
    console.log("Creating peer connection");
    peerConnection = new RTCPeerConnection();
    peerConnection.addEventListener("icecandidate", onIceCandidate);
    peerConnection.addEventListener("track", onTrack);
 
    console.log("Creating answer");
    peerConnection
        .setRemoteDescription(new RTCSessionDescription(message))
        .then(() => peerConnection.createAnswer())
        .then((answer) => peerConnection.setLocalDescription(answer))
        .then(() => socket.emit("answer", peerConnection.localDescription))
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
socket.on("offer", createPeerConnection);
socket.on("candidate", addIceCandidate);


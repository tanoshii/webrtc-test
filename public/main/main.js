'use strict';

const constraints = { audio: false, video: true };
const offerOptions = { offerToReceiveAudio: 1, offerToReceiveVideo: 1 };
const configuration = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

const socket = io.connect();
const room = "qweqwe";

let localStream;
let peerConnection;

function grabWebCamVideo() {
    console.log("Obtaining local stream");
    navigator
        .mediaDevices
        .getUserMedia(constraints)
        .then((stream) => {
            localStream = stream;
            socket.emit("main", room);
        })
        .catch(console.error);
}

function createPeerConnection(offer) {
    console.log("Creating peer connection");
    peerConnection = new RTCPeerConnection(configuration);
    peerConnection.addEventListener("icecandidate", onIceCandidate);
    
    localStream
        .getTracks()
        .forEach((track) => {
            console.log("Adding track", track);
            peerConnection.addTrack(track, localStream);
        });
        
    console.log("Creating answer");
    peerConnection
        .setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => peerConnection.createAnswer())
        .then((answer) => peerConnection.setLocalDescription(answer))
        .then(() => socket.emit("answer", peerConnection.localDescription))
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

grabWebCamVideo();
socket.on("offer", createPeerConnection);
socket.on("candidate", addIceCandidate);
socket.on("reconnect", () => {
    console.log("reconnected");
    socket.emit("main", room);
});
'use strict';

const video = document.querySelector('video');
const offerOptions = { offerToReceiveAudio: 1, offerToReceiveVideo: 1 };
const configuration = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

let deviceId = "qweqwe";

const socket = io.connect();
function getDeviceId() {
    deviceId = prompt("Please enter your device id");
    if (deviceId) {
        document.getElementById("deviceId").innerHTML =
            "Receiver " + deviceId;
    }
}
getDeviceId();

let remoteStream;
let peerConnection;

function createPeerConnection() {
    console.log("Creating peer connection");
    peerConnection = new RTCPeerConnection(configuration);
    peerConnection.addEventListener("icecandidate", onIceCandidate);
    peerConnection.addEventListener("track", onTrack);

    console.log("Creating offer");
    peerConnection
        .createOffer(offerOptions)
        .then((offer) => peerConnection.setLocalDescription(offer))
        .then(() => {
            let offer = {
                deviceId: deviceId,
                message: peerConnection.localDescription
            };
            socket.emit("offer", offer);
        }).catch(console.error);
}

function handleAnswer(message) {
    console.log("Handling answer");
    peerConnection
        .setRemoteDescription(new RTCSessionDescription(message.message))
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
            deviceId: deviceId,
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

socket.emit("join", deviceId);
socket.on("joined", createPeerConnection);
socket.on("answer", handleAnswer);
socket.on("main-candidate", addIceCandidate);
socket.on("reconnect", () => {
    console.log("reconnected");
    socket.emit("join", deviceId);
});
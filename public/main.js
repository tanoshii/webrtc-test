'use strict';

const video = document.querySelector('video');
const configuration = { sdpSemantics: "unified-plan" };
const constraints = { audio: false, video: true };
const offerOptions = { offerToReceiveAudio: 1, offerToReceiveVideo: 1 };

let localStream;
let localPeer;
let remotePeer;

function gotLocalStream(stream) {
	localStream = stream;
	doCall();
}

function getStream() {
	navigator
		.mediaDevices
		.getUserMedia(constraints)
		.then(gotLocalStream)
		.catch(console.error);
}

function onIceCandidate(event, peerConnection) {
	peerConnection
		.addIceCandidate(event.candidate)
		.then(console.log)
		.catch(console.error);
}

function onIceChange(event, peerConnection) {
	peerConnection
		.addIceCandidate(event.candidate)
		.then(console.log)
		.catch(console.error);
}

function doCall() {
	localPeer = new RTCPeerConnection(configuration);
	remotePeer = new RTCPeerConnection(configuration);

	localPeer.addEventListener('icecandidate', (event) => onIceCandidate(event, remotePeer));
	remotePeer.addEventListener('icecandidate', (event) => onIceCandidate(event, localPeer));
	remotePeer.addEventListener('track', (event) => video.srcObject = event.streams[0]);

	localStream
		.getTracks()
		.forEach((track) => localPeer.addTrack(track, localStream));

	localPeer
		.createOffer(offerOptions)
		.then((offer) => localPeer.setLocalDescription(offer))
		.then(() => remotePeer.setRemoteDescription(localPeer.localDescription))
		.then(() => remotePeer.createAnswer())
		.then((answer) => remotePeer.setLocalDescription(answer))
		.then(() => localPeer.setRemoteDescription(remotePeer.localDescription))
		.catch(console.error);
}

getStream();

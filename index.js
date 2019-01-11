const express = require('express');
const fs = require('fs');
const app = express();
const https = require('https');
const socketIO = require('socket.io');

// Certificate
const privateKey = fs.readFileSync('/etc/letsencrypt/live/webrtc-test.tk/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/webrtc-test.tk/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/webrtc-test.tk/chain.pem', 'utf8');

const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};

app.use(express.static('public', { dotfiles: 'allow' }));

const httpsServer = https.createServer(credentials, app);
httpsServer.listen(443, function () {
  console.log('HTTPS Server running on port 443!');
});

const io = socketIO.listen(httpsServer);
io.sockets.on('connection', (socket) => {

  socket.on("main", (room) => {
    console.log('Received request to create main ' + room);
    socket.join(room);

    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    console.log("Creating room", numClients);

    if (numClients > 1) {
    	socket.broadcast.emit('joined');
    }
  });

  socket.on("join", (room) => {
    console.log('Received request to join ' + room);
    socket.join(room);
    socket.emit('joined');
  });

  socket.on("offer", (message) => {
    console.log('Client said offer: ', message);
    socket.broadcast.emit("offer", message);
  });

  socket.on("answer", (message) => {
    console.log('Client said answer: ', message);
    socket.broadcast.emit("answer", message);
  });

  socket.on("candidate", (message) => {
    console.log('Client said candidate: ', message);
    socket.broadcast.emit("candidate", message);
  });
});

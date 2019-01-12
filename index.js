const express = require('express');
const fs = require('fs');
const app = express();
const https = require('https');
const socketIO = require('socket.io');

const auth = require('./auth');

app.use(auth);

const devices = new Map();

// Certificate
const privateKey = fs.readFileSync('/home/ubuntu/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/home/ubuntu/cert.pem', 'utf8');
const ca = fs.readFileSync('/home/ubuntu/chain.pem', 'utf8');

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

  socket.on("main", (deviceId) => {
    console.log(`Received request to create a room for device ${JSON.stringify(deviceId)}`);
    socket.join(deviceId);
    let clientsInRoom = io.sockets.adapter.rooms[deviceId];
    let numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    console.log(`Creating room for device ${deviceId} with ${numClients} clients`);

    if (numClients > 1) {
      io.to(deviceId).emit("joined");
    }
    devices.set(deviceId, socket);
  });

  socket.on("join", (deviceId) => {
    if (deviceId) {
      console.log(`Received request to join ${JSON.stringify(deviceId)}`);
      socket.join(deviceId);
      const senderSocket = devices.get(deviceId);
      if (senderSocket) {
        socket.emit('joined');
      }
    }
  });

  socket.on("offer", (message) => {
    console.log(`Client said offer: ${JSON.stringify(message)}`);
    const senderSocket = devices.get(message.deviceId);
    if (senderSocket) {
      senderSocket.emit("offer", message.message);
    }
  });

  socket.on("answer", (message) => {
    console.log(`Client said answer: ${JSON.stringify(message)}`);
    io.to(message.deviceId).emit("answer", message);
  });

  socket.on("main-candidate", (message) => {
    console.log(`Client said main candidate: ${JSON.stringify(message)}`);
    io.to(message.deviceId).emit("main-candidate", message);
  });


  socket.on("candidate", (message) => {
    console.log(`Client said candidate: ${JSON.stringify(message)}`);
    io.to(message.deviceId).emit("candidate", message);
  });
});

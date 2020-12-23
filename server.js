// Dependencies
const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.Server(app);
const io = socketIO(server);

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({
  limit: '50mb'
}));

app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));
app.use(express.static(__dirname + '/client/build'));


// Routing
app.get("*", function (request, response) {
  // response.sendFile(path.join(__dirname, 'index.html'));
  response.sendFile(path.join(__dirname, '/client/build/index.html'));
});




// Starts the server.
const port = process.env.PORT || 5000
server.listen(port, function () {
  console.log('Starting server on port 5000');
});


// Add the WebSocket handlers
io.on('connection', function (socket) {
  console.log("new connection!")
  // socket.join("AAAA")
  // console.log("Rooms: ", socket.rooms)

  // io.to(socket.id).emit("message", "only you see this " + socket.id)
  // io.to("AAAA").emit("message", "you all see this")

  // socket.emit("message", "hi")


  socket.on('disconnect', function () {
    console.log(socket.id + " disconnected")
  })

  socket.on("createRoom", function (state) {
    // console.log("from server: " + playerName)
    // io.sockets.emit("playerName", playerName + " has joined!")
    playerName = state.playerName;
    roomCode = state.roomCode;

    socket.join(roomCode)

    console.log(playerName + " has joined room " + roomCode)
  })

});


// setInterval(function () {
//   io.sockets.emit('message', 'wassup!');
// }, 1000);



// setInterval(function () {
//   io.sockets.emit('state', players); // send state message to all clients 60 times a second
// }, 1000 / 60);


// Dependencies
const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.Server(app);
const io = socketIO(server);

app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));


// Routing
app.get('/', function (request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});


// Starts the server.
const port = process.env.PORT || 5000
server.listen(port, function () {
  console.log('Starting server on port 5000');
});


// Add the WebSocket handlers
let players = {};
let colours = ["red", "orange", "yellow", "green", "blue", "purple", "grey", "black", "pink", "lightblue"]
io.on('connection', function (socket) {

  // handle players
  const colourId = Object.keys(players).length % 10

  socket.on('new player', function () { // if server receives a new player message from client
    players[socket.id] = {
      x: 300,
      y: 300,
      colour: colours[colourId]
    };

  });

  socket.on('movement', function (data) { // if server receives a movement message from client
    var player = players[socket.id] || {};
    if (data.left) {
      player.x -= 5;
    }
    if (data.up) {
      player.y -= 5;
    }
    if (data.right) {
      player.x += 5;
    }
    if (data.down) {
      player.y += 5;
    }
  });

  socket.on('disconnect', function() {
    delete players[socket.id]
  })

});


setInterval(function () {
  io.sockets.emit('message', 'hi!');
}, 1000);



setInterval(function () {
  io.sockets.emit('state', players); // send state message to all clients 60 times a second
}, 1000 / 60);
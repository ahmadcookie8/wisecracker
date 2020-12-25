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

//WisecrackerBackend functions
const { apiCreateRoom } = require("./static/WisecrackerBackend")
const { apiJoinRoom } = require("./static/WisecrackerBackend")
const { apiLeftRoom } = require("./static/WisecrackerBackend")
const { apiRemoveRoom } = require("./static/WisecrackerBackend")


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

const serverInfo = {}

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
    const playerName = state.playerName.toUpperCase();
    // roomCode = state.roomCode;
    const roomCode = apiCreateRoom(playerName)

    socket.join(roomCode)

    // let player = {}
    // player[playerName] = socket.id
    if (Object.keys(serverInfo).includes(roomCode)) { //if roomCode exists in serverInfo, add player to it
      serverInfo[roomCode][playerName] = { "socketId": socket.id, "host": true }//serverInfo[roomCode].push(player)
    } else { //if roomCode doesn't exist in serverInfo, initialize it with player
      serverInfo[roomCode] = {}
      serverInfo[roomCode][playerName] = { "socketId": socket.id, "host": true }//[player]
    }

    socket.emit("roomCreated", roomCode)

    console.log("serverInfo: ", serverInfo)
    console.log(playerName + " has joined room " + roomCode)

  })

  socket.on("joinRoom", function (state) {
    const playerName = state.playerName
    const roomCode = state.roomCode.toUpperCase();

    const players = apiJoinRoom(playerName, roomCode)

    if (typeof players !== "string") {//no error in joining
      console.log("players: ", players)

      socket.join(roomCode)

      // let player = {}
      // player[playerName] = socket.id
      if (Object.keys(serverInfo).includes(roomCode)) { //if roomCode exists in serverInfo, add player to it
        serverInfo[roomCode][playerName] = { "socketId": socket.id, "host": false }//serverInfo[roomCode].push(player)
      } else { //if roomCode doesn't exist in serverInfo, initialize it with player
        serverInfo[roomCode] = {}
        serverInfo[roomCode][playerName] = { "socketId": socket.id, "host": true }//[player]
      }

      io.to(roomCode).emit("roomJoined", players) //let everyone in the room know that playerName has connected

      console.log("serverInfo: ", serverInfo)
      console.log(playerName + " has joined room " + roomCode + " with players: ", players)
    } else { //error in joining
      const errorMessage = players
      socket.emit("roomJoined", errorMessage) //let person trying to join know that joining failed
    }



  })


  socket.on("disconnect", function (state) {
    const rooms = Object.keys(serverInfo) //get all rooms from serverInfo

    rooms.every(room => { //go through all rooms //every is like map, but if something falsey is returned, it breaks out
      const players = Object.keys(serverInfo[room])
      return players.every((playerName, index) => {//go through all players //return b/c may need to break out if false
        const socketId = serverInfo[room][playerName].socketId //get socketId from serverInfo
        if (socketId === socket.id) { //if this socketId matches the socket.id of the person disconnecting
          const isHost = serverInfo[room][playerName].host

          delete serverInfo[room][playerName] //remove this player from it's room in serverInfo
          console.log("playerName: ", playerName, "room: ", room)//TODO DELETE THIS
          const playersRemaining = apiLeftRoom(playerName, room) // let game know that they left
          console.log("playersRemaining: ", playersRemaining)//TODO DELETE THIS
          io.to(room).emit("roomLeft", playersRemaining) //let others in room know they left

          if (isHost) { //if player leaving was a host, decimate the room and kick everyone out
            apiRemoveRoom(room) //let game know the room should be removed
            io.to(room).emit("removeRoom") //let everyone in room know the room is being removed
            delete serverInfo[room] //delete room from serverInfo
          }

          return false //breaks out of every call
        }
        return true //keep going through every call
      })
    })
    console.log(serverInfo)
  })

});


// setInterval(function () {
//   io.sockets.emit('message', 'wassup!');
// }, 1000);



// setInterval(function () {
//   io.sockets.emit('state', players); // send state message to all clients 60 times a second
// }, 1000 / 60);


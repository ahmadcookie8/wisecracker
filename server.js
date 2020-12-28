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

//to bypass cors errors
const cors = require("cors")

app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));
app.use(express.static(__dirname + '/client/build'));

//WisecrackerBackend functions
const { apiCreateRoom } = require("./static/WisecrackerBackend")
const { apiJoinRoom } = require("./static/WisecrackerBackend")
const { apiLeavingRoom } = require("./static/WisecrackerBackend")
const { apiRemoveRoom } = require("./static/WisecrackerBackend")
const { apiStartGame } = require("./static/WisecrackerBackend")
const { apiGetRandomPrompt } = require("./static/WisecrackerBackend")
const { apiGetChooser } = require("./static/WisecrackerBackend")
const { apiGetTypers } = require("./static/WisecrackerBackend")
const { apiSetPrompt } = require("./static/WisecrackerBackend")
const { apiGetPrompt } = require("./static/WisecrackerBackend")
const { apiSetPlayerAnswer } = require("./static/WisecrackerBackend")
const { apiGetRandomizedPlayerAnswers } = require("./static/WisecrackerBackend")
const { apiSetRoundWinner } = require("./static/WisecrackerBackend")
const { apiGetRoundWinner } = require("./static/WisecrackerBackend")
const { apiGetScores } = require("./static/WisecrackerBackend")
const { apiNextRound } = require("./static/WisecrackerBackend")
const { apiGetMaxScore } = require("./static/WisecrackerBackend")
const { apiSetMaxScore } = require("./static/WisecrackerBackend")
const { apiReturnToLobby } = require("./static/WisecrackerBackend")




// Routing
app.get("*", function (request, response) {
  // response.sendFile(path.join(__dirname, 'index.html'));
  response.sendFile(__dirname + '/client/build/index.html');
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


  // socket.on('disconnect', function () {
  //   console.log(socket.id + " disconnected")
  // })

  socket.on("createRoom", function (state) {
    // console.log("from server: " + playerName)
    // io.sockets.emit("playerName", playerName + " has joined!")
    const playerName = state.playerName;
    // roomCode = state.roomCode;
    const roomCode = apiCreateRoom(playerName)
    // console.log("ZZZZ", roomCode)

    if (roomCode.length === 4) {//no error in creating room

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
    } else { //error in creating
      const errorMessage = roomCode
      socket.emit("roomCreated", errorMessage) //let person trying to join know that joining failed
    }

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


  socket.on("startGame", function (roomCode) {
    console.log("Game has started for room " + roomCode)
    const playersAndRoles = apiStartGame(roomCode)
    console.log(playersAndRoles)

    if (typeof playersAndRoles === "string") { //error
      const errorMessage = playersAndRoles
      socket.emit("gameStarted", errorMessage) //let host know about the error
    } else { //successfully started game
      io.to(roomCode).emit("gameStarted", playersAndRoles) //let everyone know their roles
    }

  })


  socket.on("getNewPrompt", function () {
    console.log("getNewPrompt")
    const prompt = apiGetRandomPrompt()

    socket.emit("getNewPrompt", prompt) //give player the prompt they requested

  })

  socket.on("getChooser", function (roomCode) {
    console.log("getChooser")
    const chooser = apiGetChooser(roomCode)

    socket.emit("getChooser", chooser) //give player the prompt they requested

  })

  socket.on("getTypers", function (roomCode) {
    console.log("getTypers")
    const typers = apiGetTypers(roomCode)
    console.log("typers: ", typers)

    socket.emit("getTypers", typers) //give player the prompt they requested

  })

  socket.on("setPrompt", state => {
    const numAnswersExpected = apiSetPrompt(state.roomCode, state.prompt)
    console.log("numAnswersExpected: ", numAnswersExpected)
    io.to(state.roomCode).emit("promptSet", numAnswersExpected) //everyone gets numAnswersExpected
  });

  socket.on("getPrompt", roomCode => {
    const prompt = apiGetPrompt(roomCode)
    io.to(roomCode).emit("promptGotten", prompt)
  });

  socket.on("submitAnswer", state => {
    const typersRemaining = apiSetPlayerAnswer(state.roomCode, state.playerName, state.answer)
    io.to(state.roomCode).emit("answerSubmitted", typersRemaining)
  });

  socket.on("getAllAnswers", roomCode => {
    const playersAndAnswers = apiGetRandomizedPlayerAnswers(roomCode)
    io.to(roomCode).emit("allAnswersGotten", playersAndAnswers)
  });

  socket.on("answerRevealed", state => {
    const roomCode = state.roomCode
    const numAnswersRevealed = state.numAnswersRevealed
    io.to(roomCode).emit("answerRevealed", numAnswersRevealed)
  });

  socket.on("setRoundWinner", state => {
    const roomCode = state.roomCode
    const playerName = state.playerName
    apiSetRoundWinner(roomCode, playerName)
  });

  socket.on("getRoundWinner", roomCode => {
    const winnerAndAnswer = apiGetRoundWinner(roomCode)
    io.to(roomCode).emit("roundWinnerGotten", winnerAndAnswer)
  });

  socket.on("getScores", roomCode => {
    const playersAndScores = apiGetScores(roomCode)
    io.to(roomCode).emit("scoresGotten", playersAndScores)
  });

  socket.on("startNextRound", roomCode => {
    const playersAndRoles = apiNextRound(roomCode) //e.g.{"joey": "typer", "henry": "chooser", "josh": ""}
    console.log("playersAndRoles: ", playersAndRoles)
    io.to(roomCode).emit("nextRoundStarted", playersAndRoles)
  });

  socket.on("getMaxSore", roomCode => {
    const maxScore = apiGetMaxScore(roomCode)
    console.log("maxScore: ", maxScore)
    io.to(roomCode).emit("maxScoreGotten", maxScore)
  });

  socket.on("setMaxScore", state => {
    const roomCode = state.roomCode
    const maxScore = state.maxScore
    apiSetMaxScore(roomCode, maxScore)
    io.to(roomCode).emit("maxScoreSet", maxScore)
  });

  socket.on("returnToLobby", roomCode => {
    // const playersAndRoles = apiNextRound(roomCode) //e.g.{"joey": "typer", "henry": "chooser", "josh": ""}
    const playersAndRoles = apiReturnToLobby(roomCode)
    apiReturnToLobby(roomCode)
    io.to(roomCode).emit("returnToLobby", playersAndRoles)
  });


  socket.on("disconnect", function (state) {
    const rooms = Object.keys(serverInfo) //get all rooms from serverInfo
    console.log("server disconnect()")

    rooms.every(room => { //go through all rooms //every is like map, but if something falsey is returned, it breaks out
      const players = Object.keys(serverInfo[room])
      return players.every((playerName, index) => {//go through all players //return b/c may need to break out if false
        const socketId = serverInfo[room][playerName].socketId //get socketId from serverInfo
        if (socketId === socket.id) { //if this socketId matches the socket.id of the person disconnecting
          const isHost = serverInfo[room][playerName].host

          delete serverInfo[room][playerName] //remove this player from it's room in serverInfo
          console.log("playerName: ", playerName, "room: ", room)//TODO DELETE THIS
          const playersRemaining = apiLeavingRoom(playerName, room) // let game know that they left
          console.log("playersRemaining: ", playersRemaining)//TODO DELETE THIS
          io.to(room).emit("roomLeft", playersRemaining) //let others in room know they left

          if (isHost) { //if player leaving was a host, decimate the room and kick everyone out
            //handles lobby logic
            // apiRemoveRoom(room) //let game know the room should be removed
            // io.to(room).emit("removeRoom") //let everyone in room know the room is being removed
            // delete serverInfo[room] //delete room from serverInfo

            //handles roundPlaying logic
            //return to lobby and change hostmanship to next person from serverInfo
            const players = Object.keys(serverInfo[room])
            return players.every((player) => {
              if (!serverInfo[room][player].host) { //this is the first player that isn't a host
                serverInfo[room][player].host = true //set to host in serverInfo
                const hostToBeSocketId = serverInfo[room][player].socketId
                io.to(hostToBeSocketId).emit("triggerReturnToLobbyFromDisconnectingHost")  //let host-to-be know to return to lobby since someone left and to set itself to host
                io.to(room).emit("triggerReturnToLobbyFromDisconnectingHostAlert", { oldHost: playerName, newHost: player })//trigger an alert for everyone in the room
                return false
              }
            })

          } else { //person that disconnected is not a host
            //go to new round and alert everyone
            //handles roundPlaying logic
            const players = Object.keys(serverInfo[room])

            if (players.length >= 3) { //if still 3 people in the room, continue game
              players.map((player) => {
                if (serverInfo[room][player].host) { //if player is host
                  const hostSocketId = serverInfo[room][player].socketId
                  io.to(hostSocketId).emit("triggerNewRoundFromDisconnection")  //let host know to trigger a new round since someone left
                  io.to(room).emit("triggerNewRoundFromDisconnectionAlert", playerName)//trigger an alert for everyone in the room
                }
              })
            } else { //if theres less than 3 people in the room, kick to lobby
              players.map((player) => {
                if (serverInfo[room][player].host) { //if player is host
                  const hostSocketId = serverInfo[room][player].socketId
                  io.to(hostSocketId).emit("triggerReturnToLobbyFromDisconnection")  //let host know to trigger a return to lobby since < 3 players left now
                  io.to(room).emit("triggerReturnToLobbyFromDisconnectionAlert", playerName)//trigger an alert for everyone in the room
                }
              })
            }

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


// Dependencies
const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.Server(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({
  limit: '50mb'
}));

const cors = require("cors")
app.use(cors());

app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));

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
const { apiGetPlayersAndRoles } = require("./static/WisecrackerBackend")
const { apiSetPendingPrompt } = require("./static/WisecrackerBackend")
const { apiGetPendingPrompt } = require("./static/WisecrackerBackend")




// Health check endpoint
app.get("/health", function (request, response) {
  response.json({ status: "ok" });
});

// Root — confirms the API is alive
app.get("/", function (request, response) {
  response.json({ message: "WiseCracker API is running. Frontend is served separately." });
});




// Starts the server.
const port = process.env.PORT || 5000
server.listen(port, '0.0.0.0', function () {
  console.log('Starting server on port 5000');
  console.log('Server is accessible at:');
  console.log('  - http://localhost:5000 (this computer)');
  console.log('  - http://192.168.68.77:5000 (other devices on WiFi)');
});

const serverInfo = {}
const disconnectionTimers = {} // Track pending disconnections with grace period

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


  socket.on("startGame", function (state) {
    const roomCode = state.roomCode
    const maxScore = state.maxScore
    console.log("ZZZZZ startGame maxScore:", maxScore)
    apiSetMaxScore(roomCode, maxScore)
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


  socket.on("getNewPrompt", function (roomCode) {
    console.log("getNewPrompt for room:", roomCode)
    const prompt = apiGetRandomPrompt()

    // Store pending prompt so it can be restored if chooser disconnects
    if (roomCode) {
      apiSetPendingPrompt(roomCode, prompt)
    }

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
    const playersAndRoles = apiReturnToLobby(roomCode)

    // Build response with host status for each player and players list
    const players = Object.keys(serverInfo[roomCode] || {})
    const playersWithHostStatus = {}
    players.forEach(player => {
      playersWithHostStatus[player] = {
        isHost: serverInfo[roomCode][player].host
      }
    })

    io.to(roomCode).emit("returnToLobby", { playersAndRoles, playersWithHostStatus, players })
  });

  socket.on("requestGameState", state => {
    const { playerName, roomCode } = state;
    console.log(`Player ${playerName} requesting game state for room ${roomCode}`);

    try {
      // Get current game state from backend
      const playersAndRoles = apiGetPlayersAndRoles(roomCode) || {};
      const inGame = playersAndRoles[playerName] !== undefined && playersAndRoles[playerName] !== "";

      // Only get game-specific data if player is in an active game
      let prompt, pendingPrompt, chooser, typers, playersAndAnswers, winnerAndAnswer, playersAndScores, maxScore;

      if (inGame) {
        prompt = apiGetPrompt(roomCode);
        pendingPrompt = apiGetPendingPrompt(roomCode);
        chooser = apiGetChooser(roomCode);
        typers = apiGetTypers(roomCode);
        playersAndAnswers = apiGetRandomizedPlayerAnswers(roomCode);

        // These might fail if no round has started yet, so wrap in try-catch
        try {
          winnerAndAnswer = apiGetRoundWinner(roomCode);
        } catch (e) {
          winnerAndAnswer = {};
        }

        try {
          playersAndScores = apiGetScores(roomCode);
        } catch (e) {
          playersAndScores = {};
        }

        maxScore = apiGetMaxScore(roomCode);
      }

      const gameState = {
        role: playersAndRoles[playerName],
        prompt,
        pendingPrompt,
        chooser,
        typers,
        playersAndAnswers,
        winnerAndAnswer,
        playersAndScores,
        maxScore,
        inGame
      };

      socket.emit("gameStateReceived", gameState);
    } catch (error) {
      console.error(`Error getting game state for ${playerName} in ${roomCode}:`, error);
      // Send empty game state to prevent client from hanging
      socket.emit("gameStateReceived", { inGame: false });
    }
  });

  socket.on("reconnect_player", function (state) {
    const { playerName, roomCode } = state;
    console.log(`Player ${playerName} attempting to reconnect to room ${roomCode}`);

    // Check if room exists in serverInfo
    if (!serverInfo[roomCode]) {
      console.log(`Reconnection failed: room ${roomCode} does not exist`);
      socket.emit("reconnection_failed", { reason: "Room no longer exists" });
      return;
    }

    // Check if player exists in the room
    if (!serverInfo[roomCode][playerName]) {
      console.log(`Reconnection failed: player ${playerName} not in room ${roomCode}`);
      socket.emit("reconnection_failed", { reason: "Player not found in room" });
      return;
    }

    // Check if there's a pending disconnection for this player
    const timerKey = `${roomCode}-${playerName}`;
    if (disconnectionTimers[timerKey]) {
      clearTimeout(disconnectionTimers[timerKey]);
      delete disconnectionTimers[timerKey];
      console.log(`Reconnection successful for ${playerName} in ${roomCode}`);

      // Update socket ID and rejoin room
      serverInfo[roomCode][playerName].socketId = socket.id;
      socket.join(roomCode);
      socket.emit("reconnection_success", { playerName, roomCode });
    } else {
      console.log(`Reconnection failed: no pending disconnection for ${playerName} in ${roomCode}`);
      socket.emit("reconnection_failed", { reason: "Session expired" });
    }
  });

  socket.on("disconnect", function () {
    const rooms = Object.keys(serverInfo) //get all rooms from serverInfo
    console.log("server disconnect()")

    rooms.every(room => { //go through all rooms
      const players = Object.keys(serverInfo[room])
      return players.every((playerName) => {//go through all players
        const socketId = serverInfo[room][playerName].socketId
        if (socketId === socket.id) { //if this socketId matches the socket.id of the person disconnecting
          const isHost = serverInfo[room][playerName].host

          // Instead of immediately kicking, set a 300-second grace period
          const timerKey = `${room}-${playerName}`;
          console.log(`Player ${playerName} disconnected from ${room}, starting 300s grace period`);

          disconnectionTimers[timerKey] = setTimeout(() => {
            console.log(`Grace period expired for ${playerName} in ${room}, kicking...`);
            delete disconnectionTimers[timerKey];

            // Original kick logic
            if (serverInfo[room] && serverInfo[room][playerName]) {
              delete serverInfo[room][playerName];
              const playersRemaining = apiLeavingRoom(playerName, room);
              io.to(room).emit("roomLeft", playersRemaining);

              const players = Object.keys(serverInfo[room])
              if (players.length === 0) {
                apiRemoveRoom(room);
                delete serverInfo[room];
              } else if (isHost) {
                const players = Object.keys(serverInfo[room])
                return players.every((player) => {
                  if (!serverInfo[room][player].host) {
                    serverInfo[room][player].host = true;
                    const hostToBeSocketId = serverInfo[room][player].socketId;
                    io.to(hostToBeSocketId).emit("triggerReturnToLobbyFromDisconnectingHost");
                    io.to(room).emit("triggerReturnToLobbyFromDisconnectingHostAlert", { oldHost: playerName, newHost: player });
                    return false;
                  }
                });
              } else {
                const players = Object.keys(serverInfo[room])
                if (players.length >= 3) {
                  players.map((player) => {
                    if (serverInfo[room][player].host) {
                      const hostSocketId = serverInfo[room][player].socketId;
                      io.to(hostSocketId).emit("triggerNewRoundFromDisconnection");
                      io.to(room).emit("triggerNewRoundFromDisconnectionAlert", playerName);
                    }
                  });
                } else {
                  players.map((player) => {
                    if (serverInfo[room][player].host) {
                      const hostSocketId = serverInfo[room][player].socketId;
                      io.to(hostSocketId).emit("triggerReturnToLobbyFromDisconnection");
                      io.to(room).emit("triggerReturnToLobbyFromDisconnectionAlert", playerName);
                    }
                  });
                }
              }
            }
          }, 300000); // 300 second grace period

          return false;
        }
        return true;
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


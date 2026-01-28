import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Redirect } from 'react-router-dom';

import '../../App.css';


// const { testCall } = require("../../test")
// const { apiCreateRoom } = require("../../WisecrackerBackend")
// const { apiJoinRoom } = require("../../WisecrackerBackend")



function LobbyPage(props) {
  const location = useLocation();

  // Handle refresh: restore state from sessionStorage if useLocation().state is null
  const initialState = location.state || {
    playerName: sessionStorage.getItem('playerName') || '',
    roomCode: sessionStorage.getItem('roomCode') || '',
    players: [],
    goToLobby: '',
    maxScore: '3'
  };

  const [state, setState] = useState(initialState);
  const socket = props.appState.socket

  useEffect(() => {
    if (!socket) return; // Guard against null socket

    // If we restored from sessionStorage, we need to rejoin the room
    if (!location.state && state.roomCode && state.playerName) {
      console.log('Restoring lobby session after refresh...');
      // The socket will auto-reconnect via App.js reconnect_player event
    }

    socket.on("message", data => {
      // setResponse(data);
      console.log(data)
    });

    socket.on("playerName", data => {
      console.log(data)
    });

    socket.on("roomCode", roomCode => {
      const newRoomCode = roomCode
      setState(prevState => ({ ...prevState, roomCode: newRoomCode }))
      console.log(roomCode)
    });


    socket.on("roomJoined", players => { //someone has joined the lobby
      console.log("new player has joined!")
      const newPlayers = players
      setState(prevState => ({ ...prevState, players: newPlayers }))
    });

    socket.on("roomLeft", players => {
      console.log("a player has left")
      const newPlayers = players
      setState(prevState => ({ ...prevState, players: newPlayers }))
    });

    socket.on("removeRoom", () => {
      console.log("this room is being removed")
      setState(prevState => ({ ...prevState, deleteRoom: true }))
    });

    socket.on("gameStarted", playersAndRoles => {
      if (typeof playersAndRoles === "string") { //error
        const errorMessage = playersAndRoles
        console.log(errorMessage)
        // window.alert(errorMessage)
      } else { //game started succesfully
        // TODO: find your role and redirect to page and pass your role with it
        const role = playersAndRoles[state.playerName]
        console.log("Game is now starting as role " + role)
        setState(prevState => ({ ...prevState, startGame: role })) //this triggers a redirect to the lobby page

        // console.log("ZZZZZ LobbyPage#gameStarted: ", state.roomCode)
        socket.emit("getNewPrompt") //request prompt so we can get it after the redirect we triggered above
        socket.emit("getChooser", state.roomCode) //request chooser so we can get it after the redirect we triggered above
        socket.emit("getTypers", state.roomCode) //request typers so we can get it after the redirect we triggered above
      }
    });

    socket.on("triggerReturnToLobbyFromDisconnectingHost", () => {
      setState(prevState => ({ ...prevState, goToLobby: "host" }))
    });


    // CLEAN UP THE EFFECT
    // return () => socket.disconnect();

  }, [socket]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;

    console.log("ZZZZZ name:", name, "value:", value)
    setState(prevState => ({ ...prevState, [name]: value }))
  }

  function displayStartGameButton(isHost) {
    console.log("ZZZZZ displayStartGameButton:", state.maxScore)
    if (isHost === "host") {
      return (
        <div>
          <button className="button1" onClick={() => { socket.emit("startGame", { roomCode: state.roomCode, maxScore: state.maxScore }) }}>Start Game</button>
        </div>
      ) 
    }
  }

  function checkIfRoomNeedsToBeRemoved() {
    if (state.deleteRoom) {
      console.log("Kicked out of room due to host leaving")
      window.alert("Kicked out of room due to host leaving")
      return (
        <Redirect to="/" />
      )
    }
  }

  function displayPlayerNames() {
    // socket.emit("getPlayers", )
    return <div>
      <h3 className="player-name text-colour-1">Players (minimum 3 required): </h3>
      {console.log("displayPlayerNames()", state.players)}
      {state.players.map(player => {
        if (player.toUpperCase() === state.playerName.toUpperCase()) { //if displaying this player name, be green
          return (<h4 className="this-player-name text-colour-2">{player}</h4>)
        } else { //else display other player names normally
          return (<h4 className="player-name text-colour-3">{player}</h4>)
        }
      })}
    </div>
  }

  function redirectToRoundPlaying() {
    const stateToSend = state
    stateToSend.prompt = ""
    stateToSend.chooser = ""
    stateToSend.typers = []
    stateToSend.numAnswersExpected = 0
    stateToSend.answer = []
    stateToSend.playersAndAnswers = []
    stateToSend.numAnswersRevealed = -1
    stateToSend.winnerAndAnswer = {}
    stateToSend.playerAndScores = {}
    stateToSend.returnToLobby = false
    if (state.startGame === "chooser") {
      return (
        <Redirect to={{ pathname: "/roundPlaying", role: "chooser", state: stateToSend }} />
      )
    } else if (state.startGame === "typer") {
      return (
        <Redirect to={{ pathname: "/roundPlaying", role: "typer", state: stateToSend }} />
      )
    }
  }

  function displayMaxScoreChanger(isHost) {
    if (isHost === "host") {
      return (<div>
        <p style={{ color: "white", "font-size": "18px" }}>Max Score Needed To Win:</p>
        <input type="number" min="1" max="50" className="max-score-input" name="maxScore" value={state.maxScore} onChange={handleChange} />
      </div>)
    }
  }

  return (
    <div id="background" className="background-colour-1">
      <div className="page">
        {/* <h1 className="title title-colour-1">Lobby</h1> */}
        <h2 className="room-code title-colour-1">Room Code: {state.roomCode}</h2>
        {displayPlayerNames()}
        {displayStartGameButton(state.goToLobby)}
        {displayMaxScoreChanger(state.goToLobby)}
        {/* useLocation().host)} */}
        {console.log(state)}

        {redirectToRoundPlaying()}
        {checkIfRoomNeedsToBeRemoved()}
      </div>
    </div>
  )
}

export default LobbyPage;

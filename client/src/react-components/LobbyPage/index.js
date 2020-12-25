import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import socketIOClient from "socket.io-client";
import { Redirect } from 'react-router-dom';

import '../../App.css';


// const { testCall } = require("../../test")
// const { apiCreateRoom } = require("../../WisecrackerBackend")
// const { apiJoinRoom } = require("../../WisecrackerBackend")

const ENDPOINT = "http://localhost:5000";


function LobbyPage(props) {
  const [state, setState] = useState(useLocation().state)//({ playerName: "", roomCode: "", players: [] })
  const [socket, setSocket] = useState(props.appState.socket)

  useEffect(() => {
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

    socket.on("roomLeft", players => { //someone has joined the lobby
      console.log("a player has left")
      const newPlayers = players
      setState(prevState => ({ ...prevState, players: newPlayers }))
    });

    socket.on("removeRoom", () => { //someone has joined the lobby
      console.log("this room is being removed")
      setState(prevState => ({ ...prevState, deleteRoom: true }))
    });

    // CLEAN UP THE EFFECT
    // return () => socket.disconnect();

  }, []);

  function handleChange(event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;


    setState(prevState => ({ ...prevState, [name]: value }))
  }

  function displayStartGameButton(isHost) {
    if (isHost) {
      return (
        <div>
          <button className="button1">Start Game</button>
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
      <h2 className="player-name">Players: </h2>
      {console.log("displayPlayerNames()", state.players)}
      {state.players.map(player => {
        if (player.toUpperCase() === state.playerName.toUpperCase()) { //if displaying this player name, be green
          return (<h4 className="this-player-name">{player}</h4>)
        } else { //else display other player names normally
          return (<h4 className="player-name">{player}</h4>)
        }
      })}
    </div>
  }

  return (
    <div id="background">
      <div className="page">
        <h1 className="title">Lobby</h1>
        <h2 className="room-code">Room Code: {state.roomCode}</h2>
        {displayPlayerNames()}
        {displayStartGameButton(useLocation().host)}
        {console.log(state)}

        {checkIfRoomNeedsToBeRemoved()}
      </div>
    </div>
  )
}

export default LobbyPage;

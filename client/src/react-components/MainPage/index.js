import React, { useState, useEffect } from 'react';
import socketIOClient from "socket.io-client";
import { Link, Redirect } from 'react-router-dom';

import '../../App.css';


// const { testCall } = require("../../test")
// const { apiCreateRoom } = require("../../WisecrackerBackend")
// const { apiCreateRoomWithRoomCode } = require("../../WisecrackerBackend")
// const { apiJoinRoom } = require("../../WisecrackerBackend")

const ENDPOINT = "http://localhost:5000";


function MainPage(props) {
  const [response, setResponse] = useState("");
  const [state, setState] = useState({ playerName: "", roomCode: "", players: [], goToLobby: "" })
  console.log("ZZZZ", props.appState)
  const [socket, setSocket] = useState(props.appState.socket)

  useEffect(() => {
    socket.on("message", data => {
      // setResponse(data);
      console.log(data)
    });

    socket.on("playerName", data => {
      console.log(data)
    });

    // socket.on("createRoom", data => {
    //   const playerName = data[0]
    //   const roomCode = data[1]
    //   apiCreateRoomWithRoomCode(playerName, roomCode)
    // });

    socket.on("roomCreated", roomCode => {
      if (typeof roomCode === "string") {
        const errorMessage = roomCode
        console.log(errorMessage)
      } else {

        const newRoomCode = roomCode.toUpperCase()
        setState(prevState => ({ ...prevState, roomCode: newRoomCode }))
        setState(prevState => ({ ...prevState, goToLobby: "host" })) //this triggers a redirect to the lobby page

        props.setAppState(prevAppState => ({ ...prevAppState, loggedIn: true }))
      }



    });

    socket.on("roomJoined", players => {
      if (typeof players === "string") {
        const errorMessage = players
        //TODO: display errorMessage on screen
        console.log(errorMessage)
      } else { //we're gucci
        // state.players = players
        const newPlayers = players
        setState(prevState => ({ ...prevState, players: newPlayers }))
        setState(prevState => ({ ...prevState, goToLobby: "nonHost" })) //this triggers a redirect to the lobby page

        props.setAppState(prevAppState => ({ ...prevAppState, loggedIn: true }))
      }

    });

    // CLEAN UP THE EFFECT
    // return () => socket.disconnect();

  }, []);

  // state = {
  //   gabagoo: false,
  //   playerName: "",
  //   roomCode: ""
  // }

  function handleChange(event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;

    // this.setState({
    //   [name]: value
    // })
    if (name === "roomCode") {
      setState(prevState => ({ ...prevState, [name]: value.toUpperCase() }))

    } else {

      setState(prevState => ({ ...prevState, [name]: value }))
    }
  }

  function createRoom() {
    console.log("Room Created as " + state.playerName + "!")
    setState(prevState => ({ ...prevState, players: [state.playerName] }))
    socket.emit("createRoom", state)
    // console.log(testCall())
    // console.log(response)

    // //call WisecrackerBackend.js#createRoom(state.playerName) and expect roomCode back 
    // let roomCode = apiCreateRoom(state.playerName)
    // state.roomCode = roomCode

    // const socket = socketIOClient(ENDPOINT);
    // socket.emit("createRoom", state)

    // console.log(props.appState)
    // // props.appState.loggedIn = true
    // props.setAppState(prevAppState => ({ ...prevAppState, loggedIn: true }))
    // console.log(props.appState)
  }

  function joinRoom() {
    console.log("Joined Room " + state.roomCode + "!")
    socket.emit("joinRoom", state)

    // let players = apiJoinRoom(state.playerName, state.roomCode)

    // if (typeof players === "string") {
    //   const errorMessage = players
    //   //display errorMessage on screen
    //   console.log(errorMessage)
    // } else { //we're gucci

    //   state.players = players

    //   // const socket = socketIOClient(ENDPOINT);
    //   socket.emit("joinRoom", state)

    //   props.appState.loggedIn = true
    //   console.log(props.appState)
    // }

  }

  function redirectToLobby() {
    if (state.goToLobby === "host") {
      return (
        <Redirect to={{ pathname: "/lobby", host: true, state: state }} />
      )
    } else if (state.goToLobby === "nonHost") {
      return (
        <Redirect to={{ pathname: "/lobby", host: false, state: state }} />
      )
    }
  }

  return (
    <div id="background">
      <div className="page">
        <h1 className="title">Wise Cracker</h1>

        <input className="player-name-input" name="playerName" placeholder="Player Name" onChange={handleChange} />
        <div>
          {/* <Link to={{ pathname: "/lobby", host: true, state: state }}> */}
          <button className="button1" onClick={() => createRoom()}>Create Room</button>
          {/* </Link> */}
        </div>

        <input className="player-name-input" name="roomCode" placeholder="Room Code" onChange={handleChange} />
        <div>
          {/* <Link to={{ pathname: "/lobby", host: false, state: state }}> */}
          <button className="button1" onClick={() => joinRoom()}>Join Room</button>
          {/* </Link> */}
        </div>

        {redirectToLobby()}

      </div>
    </div>

  )
}

export default MainPage;

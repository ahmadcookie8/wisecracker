import React, { useState, useEffect } from 'react';
import socketIOClient from "socket.io-client";


// import { Route, Switch, BrowserRouter } from 'react-router-dom';
// import { uid } from 'react-uid';
import './App.css';


const { testCall } = require("./test")
const { apiCreateRoom } = require("./test") //TODO replace with WisecrackBackend

const ENDPOINT = "http://localhost:5000";

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }






function App() {
  const [response, setResponse] = useState("");
  const [state, setState] = useState({ playerName: "", roomCode: "" })

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT);
    socket.on("message", data => {
      // setResponse(data);
      console.log(data)
    });

    socket.on("playerName", data => {
      console.log(data)
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

    setState(prevState => ({ ...prevState, [name]: value }))
  }

  function createRoom() {
    console.log("Room Created as " + state.playerName + "!")
    console.log(testCall())
    // console.log(response)

    //call WisecrackerBackend.js#createRoom(state.playerName) and expect roomCode back 
    let roomCode = apiCreateRoom(state.playerName)
    state.roomCode = roomCode
    
    const socket = socketIOClient(ENDPOINT);
    socket.emit("createRoom", state)
  }

  function joinRoom() {
    console.log("Joined Room " + state.roomCode + "!")
  }

  return (
    <div id="background">
      <div className="page">
        <h1 className="title">Wise Cracker</h1>

        <input className="player-name-input" name="playerName" placeholder="Player Name" onChange={handleChange} />
        <div>
          <button className="create-room" onClick={() => createRoom()}>Create Room</button>
        </div>

        <input className="player-name-input" name="roomCode" placeholder="Room Code" onChange={handleChange} />
        <div>
          <button className="create-room" onClick={() => joinRoom()}>Join Room</button>
        </div>

      </div>
    </div>

  )
}

export default App;

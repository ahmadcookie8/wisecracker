import React, { useState, useEffect } from 'react';
import socketIOClient from "socket.io-client";


import { Route, Switch, BrowserRouter } from 'react-router-dom';
// import { uid } from 'react-uid';
import './App.css';


//import pages
import MainPage from "./react-components/MainPage"
import LobbyPage from "./react-components/LobbyPage"


const ENDPOINT = "https://thawing-ocean-59152.herokuapp.com/"
// const ENDPOINT = "http://localhost:5000";


function App() {
  const [state, setState] = useState({ loggedIn: false, socket: null }) //socket is created here and assigned to socket

  function initializeSocket() {
    if (state.socket === null) { //only create socket if it hasn't been created yet
      setState(prevState => ({ ...prevState, socket: socketIOClient(ENDPOINT) }))
    }
  }



  function setAppState(value) {
    console.log("AYO", value)
    setState(value)
    console.log(state)
  }

  return (
    <div>
      {initializeSocket()}
      <BrowserRouter>
        <Switch>
          {/* routes */}
          <Route exact path="/" render={() => <MainPage appState={state} setAppState={setAppState} />} />
          <Route path="/lobby" render={() => {
            console.log(state);
            if (state.loggedIn) { return <LobbyPage appState={state} setAppState={setAppState} /> } else { return <MainPage appState={state} setAppState={setAppState} /> }
            // return <LobbyPage appState={state} />
          }} />

          {/* 404 if URL isn't expected */}
          <Route render={() => <div>404: Bro where even are you???</div>} />
        </Switch>
      </BrowserRouter>
    </div>

  )
}

export default App;

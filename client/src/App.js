import React, { useState, useEffect } from 'react';
import socketIOClient from "socket.io-client";


import { Route, Switch, BrowserRouter, Redirect } from 'react-router-dom';
// import { uid } from 'react-uid';
import './App.css';


//import pages
import MainPage from "./react-components/MainPage"
import LobbyPage from "./react-components/LobbyPage"
import RoundPlayingPage from "./react-components/RoundPlayingPage"


const ENDPOINT = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";


function App() {
  const [state, setState] = useState({ loggedIn: false, socket: null })
  const [serverConnected, setServerConnected] = useState(false)

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity
    });

    socket.on('connect', () => {
      console.log('Connected to server');
      setServerConnected(true);

      // Try to restore session if we were previously logged in
      const savedPlayerName = sessionStorage.getItem('playerName');
      const savedRoomCode = sessionStorage.getItem('roomCode');

      if (savedPlayerName && savedRoomCode) {
        console.log('Attempting to reconnect player session...');
        socket.emit('reconnect_player', { playerName: savedPlayerName, roomCode: savedRoomCode });
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setServerConnected(false);
    });

    socket.on('connect_error', () => {
      console.log('Connection error - server may be starting...');
    });

    socket.on('reconnection_success', (data) => {
      console.log('Reconnection successful:', data);
    });

    setState(prevState => ({ ...prevState, socket: socket }));

    return () => {
      socket.disconnect();
    };
  }, []);



  function setAppState(value) {
    console.log("AYO", value)
    setState(value)
    console.log(state)
  }

  return (
    <div>
      {!serverConnected && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            fontSize: '24px',
            color: 'white',
            marginBottom: '20px'
          }}>
            The server is starting...
          </div>
          <div style={{
            width: '50px',
            height: '50px',
            border: '5px solid rgba(255, 255, 255, 0.3)',
            borderTop: '5px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      <BrowserRouter>
        <Switch>
          {/* routes */}
          <Route exact path="/" render={() => <MainPage appState={state} setAppState={setAppState} />} />
          <Route path="/lobby" render={() => {
            console.log(state);
            // if (state.loggedIn) { return <LobbyPage appState={state} setAppState={setAppState} /> } else { return <MainPage appState={state} setAppState={setAppState} /> }

            if (state.loggedIn) { return <LobbyPage appState={state} setAppState={setAppState} /> } else { return <Redirect to="/" /> }
            // return <LobbyPage appState={state} />
          }} />

          <Route path="/roundPlaying" render={() => {
            console.log(state);
            if (state.loggedIn) { return <RoundPlayingPage appState={state} setAppState={setAppState} /> } else { return <Redirect to="/" /> }
          }} />
          {/* <Route path="/roundPlaying" render={() => <RoundPlayingPage appState={state} setAppState={setAppState} />} /> */}

          {/* 404 if URL isn't expected */}
          <Route render={() => <div>404: Bro where even are you???</div>} />
        </Switch>
      </BrowserRouter>
    </div>

  )
}

export default App;

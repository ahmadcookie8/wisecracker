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
    console.log('App useEffect - Initial sessionStorage:', {
      playerName: sessionStorage.getItem('playerName'),
      roomCode: sessionStorage.getItem('roomCode')
    });

    const socket = socketIOClient(ENDPOINT, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity
    });

    socket.on('connect', () => {
      console.log('Connected to server');
      setServerConnected(true);

      // Try to restore session only if we're not on the main page
      const savedPlayerName = sessionStorage.getItem('playerName');
      const savedRoomCode = sessionStorage.getItem('roomCode');
      console.log('On connect - sessionStorage:', { savedPlayerName, savedRoomCode, pathname: window.location.pathname });

      if (savedPlayerName && savedRoomCode && window.location.pathname !== '/') {
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
      // Restore loggedIn state
      setState(prevState => ({ ...prevState, loggedIn: true }));
      // Request current game state to sync up
      const savedPlayerName = sessionStorage.getItem('playerName');
      const savedRoomCode = sessionStorage.getItem('roomCode');
      if (savedPlayerName && savedRoomCode) {
        socket.emit('requestGameState', { playerName: savedPlayerName, roomCode: savedRoomCode });
      }
    });

    socket.on('reconnection_failed', (data) => {
      console.log('Reconnection failed:', data.reason);
      // Clear invalid session data
      sessionStorage.removeItem('playerName');
      sessionStorage.removeItem('roomCode');
      // Redirect to main page if not already there
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
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
            // Check if user has valid session (either logged in or has sessionStorage data)
            const savedPlayerName = sessionStorage.getItem('playerName');
            const savedRoomCode = sessionStorage.getItem('roomCode');
            const hasValidSession = state.loggedIn || (savedPlayerName && savedRoomCode);
            console.log('Lobby route check:', { loggedIn: state.loggedIn, savedPlayerName, savedRoomCode, hasValidSession });
            if (hasValidSession) { return <LobbyPage appState={state} setAppState={setAppState} /> } else { return <Redirect to="/" /> }
          }} />

          <Route path="/roundPlaying" render={() => {
            // Check if user has valid session (either logged in or has sessionStorage data)
            const savedPlayerName = sessionStorage.getItem('playerName');
            const savedRoomCode = sessionStorage.getItem('roomCode');
            const hasValidSession = state.loggedIn || (savedPlayerName && savedRoomCode);
            console.log('RoundPlaying route check:', { loggedIn: state.loggedIn, savedPlayerName, savedRoomCode, hasValidSession });
            if (hasValidSession) { return <RoundPlayingPage appState={state} setAppState={setAppState} /> } else { return <Redirect to="/" /> }
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

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Redirect } from 'react-router-dom';
import { uid } from 'react-uid';

import '../../App.css';




function RoundPlayingPage(props) {
  const location = useLocation();

  // Handle refresh: restore basic state from sessionStorage if useLocation().state is null
  const initialState = location.state || {
    playerName: sessionStorage.getItem('playerName') || '',
    roomCode: sessionStorage.getItem('roomCode') || '',
    players: [],
    prompt: '',
    chooser: '',
    typers: [],
    numAnswersExpected: 0,
    answer: [],
    playersAndAnswers: [],
    numAnswersRevealed: -1,
    winnerAndAnswer: {},
    playerAndScores: {},
    returnToLobby: false,
    maxScore: '3'
  };

  const [state, setState] = useState(initialState);
  const socket = props.appState.socket

  useEffect(() => {
    if (!socket) return; // Guard against null socket

    // Request game state on mount to sync up (handles refresh and backgrounding)
    const savedPlayerName = sessionStorage.getItem('playerName');
    const savedRoomCode = sessionStorage.getItem('roomCode');
    if (savedPlayerName && savedRoomCode) {
      socket.emit('requestGameState', { playerName: savedPlayerName, roomCode: savedRoomCode });
    }

    // Handle page visibility changes (detect backgrounding/returning)
    const handleVisibilityChange = () => {
      if (!document.hidden && savedPlayerName && savedRoomCode) {
        console.log('Page became visible, syncing game state...');
        socket.emit('requestGameState', { playerName: savedPlayerName, roomCode: savedRoomCode });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listen for game state updates from server
    socket.on("gameStateReceived", (gameState) => {
      console.log('Received game state:', gameState);

      if (!gameState.inGame) {
        // Player is not in an active game, redirect to lobby
        setState(prevState => ({ ...prevState, returnToLobby: true }));
        return;
      }

      // Determine what phase we're in and set numAnswersExpected accordingly
      let numAnswersExpected = 0;
      if (gameState.prompt) {
        // Count underscores in prompt to determine expected answers
        const underscoreCount = (gameState.prompt.match(/_/g) || []).length;
        numAnswersExpected = underscoreCount || 1; // Default to 1 if no underscores
      }

      // Initialize answer array if we're a typer and haven't submitted yet
      let answerArray = [];
      if (gameState.role === 'typer' && gameState.typers && gameState.typers.includes(state.playerName)) {
        // Still need to answer - initialize blank answer array
        for (let i = 0; i < numAnswersExpected; i++) {
          answerArray.push("");
        }
      }

      // Determine numAnswersRevealed for the reveal phase
      let numAnswersRevealed = state.numAnswersRevealed;
      if (gameState.playersAndAnswers && Object.keys(gameState.playersAndAnswers).length > 0) {
        // We're in the reveal/choosing phase
        if (gameState.winnerAndAnswer && Object.keys(gameState.winnerAndAnswer).length > 0) {
          // Winner already chosen - reveal all answers
          numAnswersRevealed = Object.keys(gameState.playersAndAnswers).length - 1;
        } else if (state.numAnswersRevealed < 0 && gameState.role !== 'chooser') {
          // Non-chooser rejoining during reveal phase - show all answers so they can see what's happening
          // (Chooser should be able to reveal answers one by one even if they rejoin)
          numAnswersRevealed = Object.keys(gameState.playersAndAnswers).length - 1;
        }
      }

      // Update state with server's current game state
      // Use nullish coalescing to preserve falsy values like empty arrays/strings
      // If chooser had a pending prompt (viewed but not confirmed), restore it
      const promptToRestore = gameState.prompt || (gameState.role === 'chooser' ? gameState.pendingPrompt : null);

      setState(prevState => ({
        ...prevState,
        startGame: gameState.role,
        prompt: promptToRestore ?? prevState.prompt,
        chooser: gameState.chooser ?? prevState.chooser,
        typers: gameState.typers ?? prevState.typers,
        playersAndAnswers: gameState.playersAndAnswers ?? prevState.playersAndAnswers,
        winnerAndAnswer: gameState.winnerAndAnswer ?? prevState.winnerAndAnswer,
        playerAndScores: gameState.playersAndScores ?? prevState.playerAndScores,
        maxScore: gameState.maxScore ?? prevState.maxScore,
        numAnswersExpected: numAnswersExpected > 0 ? numAnswersExpected : prevState.numAnswersExpected,
        answer: answerArray.length > 0 ? answerArray : prevState.answer,
        numAnswersRevealed
      }));

      console.log('State synced to phase:', {
        hasPrompt: !!gameState.prompt,
        typersRemaining: gameState.typers?.length || 0,
        hasAnswers: !!gameState.playersAndAnswers,
        hasWinner: !!gameState.winnerAndAnswer,
        role: gameState.role
      });
    });

    socket.on("getNewPrompt", (prompt) => {
      const newPrompt = prompt
      console.log(newPrompt)
      // Don't reset startGame - it should persist throughout the round
      setState(prevState => ({ ...prevState, prompt: newPrompt, returnToLobby: false }))
    });

    socket.on("getChooser", (chooser) => {
      const newChooser = chooser
      console.log(newChooser)
      setState(prevState => ({ ...prevState, chooser: newChooser }))
    });

    socket.on("getTypers", (typers) => {
      const newTypers = typers
      console.log(newTypers)
      setState(prevState => ({ ...prevState, typers: newTypers.slice() }))
      console.log(state.typers)
    });

    socket.on("promptSet", (num) => {
      const numAnswersExpected = num
      setState(prevState => ({ ...prevState, numAnswersExpected: numAnswersExpected }))

      //prep answer array
      const blankAnswer = []//state.answer
      for (let i = 0; i < numAnswersExpected; i++) {
        blankAnswer.push("")
      }
      setState(prevState => ({ ...prevState, answer: blankAnswer }))

    });

    socket.on("promptGotten", (prompt) => {
      const newPrompt = prompt
      setState(prevState => ({ ...prevState, prompt: newPrompt }))
    });

    socket.on("answerSubmitted", (typersRemaining) => {
      const newTypers = typersRemaining
      console.log("newTypers:", newTypers)
      console.log("state.typers:", state.typers)
      setState(prevState => ({ ...prevState, typers: newTypers.slice() }))

      if(newTypers.length === 0){//everyone has answered
        socket.emit("getAllAnswers", state.roomCode)
      }
    });

    socket.on("allAnswersGotten", (list) => {
      const playersAndAnswers = list
      console.log("playersAndAnswers:", playersAndAnswers)
      setState(prevState => ({ ...prevState, playersAndAnswers: playersAndAnswers }))
    });

    socket.on("answerRevealed", (newNumAnswersRevealed) => {
      // Only update if we're not the chooser (typers only)
      // Use prevState to avoid stale closure bug
      setState(prevState => {
        if (prevState.playerName !== prevState.chooser) {
          return { ...prevState, numAnswersRevealed: newNumAnswersRevealed };
        }
        return prevState;
      });
    });

    socket.on("roundWinnerGotten", (winnerAndAnswer) => {
      setState(prevState => ({ ...prevState, "winnerAndAnswer": winnerAndAnswer }))
      console.log("winnerAndAnswer", winnerAndAnswer)
    });

    socket.on("scoresGotten", (playersAndScores) => {
      setState(prevState => ({ ...prevState, "playersAndScores": playersAndScores }))
      console.log("playersAndScores", playersAndScores)
    });

    socket.on("nextRoundStarted", (playersAndRoles) => {
      console.log("playersAndRoles", playersAndRoles)
        


      if (typeof playersAndRoles === "string") { //error
        const errorMessage = playersAndRoles
        console.log(errorMessage)
      } else { //next round started succesfully
        const role = playersAndRoles[state.playerName]
        console.log("New Round is starting as role " + role)

        setState(prevState => ({ ...prevState, prompt: "",
          chooser: "",
          typers: [],
          answer: [],
          playersAndAnswers: [],
          numAnswersRevealed: -1,
          winnerAndAnswer: {},
          playerAndScores: {},
          returnToLobby: false,
          numAnswersExpected: 0, //last b/c this triggers the prompt choosing
          startGame: role
        }))

        // restartRoundPlaying(role)

        socket.emit("getNewPrompt", state.roomCode) //request prompt so we can get it after the redirect we triggered above
        socket.emit("getChooser", state.roomCode) //request chooser so we can get it after the redirect we triggered above
        socket.emit("getTypers", state.roomCode) //request typers so we can get it after the redirect we triggered above
      }
    });

    socket.on("maxScoreGotten", (maxScore) => {
      setState(prevState => ({ ...prevState, "maxScore": maxScore }))
      console.log("maxScore", maxScore)
    });

    socket.on("maxScoreSet", (maxScore) => {
      setState(prevState => ({ ...prevState, "maxScore": maxScore }))
      console.log("maxScore", maxScore)
    });

    socket.on("returnToLobby", (data) => {
      console.log("returnToLobby data", data)

      if (typeof data === "string") { //error
        const errorMessage = data
        console.log(errorMessage)
      } else {
        const { playersWithHostStatus, players } = data

        // Determine if this player is the host
        const isHost = playersWithHostStatus[state.playerName]?.isHost
        const goToLobbyValue = isHost ? "host" : "nonHost"

        console.log("returnToLobby - isHost:", isHost, "goToLobby:", goToLobbyValue)

        setState(prevState => ({
          ...prevState,
          returnToLobby: true,
          goToLobby: goToLobbyValue,
          players: players,
          prompt: "",
          chooser: "",
          typers: [],
          answer: [],
          playersAndAnswers: [],
          numAnswersRevealed: -1,
          winnerAndAnswer: {},
          playerAndScores: {},
          numAnswersExpected: 0,
          startGame: ""
        }))
      }
    });

    socket.on("triggerNewRoundFromDisconnection", () => {
      startNextRound()
    });

    socket.on("triggerNewRoundFromDisconnectionAlert", (personWhoLeft) => {
      window.alert("Restarting round due to " + personWhoLeft + " leaving")
    });

    socket.on("roomLeft", players => {
      console.log("a player has left")
      const newPlayers = players
      setState(prevState => ({ ...prevState, players: newPlayers }))
    });

    socket.on("triggerReturnToLobbyFromDisconnection", () => {
      socket.emit("returnToLobby", state.roomCode)
    });

    socket.on("triggerReturnToLobbyFromDisconnectionAlert", (personWhoLeft) => {
      window.alert("There are less than 3 people since " + personWhoLeft + " left, returning to lobby.")
    });

    socket.on("triggerReturnToLobbyFromDisconnectingHost", () => {
      setState(prevState => ({ ...prevState, goToLobby: "host" }))
      socket.emit("returnToLobby", state.roomCode)
    });

    socket.on("triggerReturnToLobbyFromDisconnectingHostAlert", (hosts) => {
      const oldHost = hosts.oldHost
      const newHost = hosts.newHost
      console.log("Host " + oldHost + " left so everyone is returning to lobby with " + newHost + " as the new host.")
      window.alert("Host " + oldHost + " left so everyone is returning to lobby with " + newHost + " as the new host.")
    });

    // CLEAN UP THE EFFECT
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };

  }, [socket]); // eslint-disable-line react-hooks/exhaustive-deps



  function handleChange(event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;

    if (name.slice(-1) === "]") { //handle the case of array editing
      const index = name.slice(-2, -1);
      const arrayName = name.slice(0, -3);
      // console.log(index)
      // console.log(arrayName)

      const array = state[arrayName];
      array[index] = value;
      // console.log(value)
      // console.log(array)

      setState(prevState => ({ ...prevState, [arrayName]: array }))
    } else {
      setState(prevState => ({ ...prevState, [name]: value }))
    }
  }

  function displayPromptChoosing(role) {
    if (state.numAnswersExpected === 0 && !state.returnToLobby) { //prompt is not set yet
      if (role === "chooser") {
        return (
          <div>
            <h6 style={{ color: "var(--text-colour-1)" }}>Prompt (Generate one or create one yourself):</h6>
            <textarea className="choosing-prompt" value={state.prompt} name="prompt" onChange={handleChange} />
            <div><button className="button1" onClick={() => { socket.emit("getNewPrompt", state.roomCode) }}>Get New Prompt</button></div>
            <div><button className="button1" onClick={() => { socket.emit("setPrompt", state); socket.emit("getPrompt", state.roomCode) }}>Use This Prompt</button></div>
          </div>
        )
      } else if (role === "typer") {
        return (
          <div>
            <p className="white-text">{state.chooser} is choosing the prompt...</p>
          </div>
        )
      }
    }
  }

  function displayAnswerWriting(role) {
    if (state.numAnswersExpected !== 0 && state.typers.length > 0) { //prompt has been set and people are still typing answers
      if (role === "chooser") {
        return (
          <div>
            {/* <h4>Answers are being written right now...</h4> */}
            {state.typers.map(typer => {
              return (<p className="typer-still-typing">{typer} is still writing their answer...</p>)
            })}
          </div>
        ) 
      } else if (role === "typer") {
        return (
          <div>
            {state.typers.includes(state.playerName) ? //only display the answering UI if playerName is still answering
            <div>
              <h3 style={{ color: "var(--text-colour-1)" }}>{state.chooser + "'s "}prompt:</h3>
              <p name="prompt" className="prompt">{state.prompt}</p>
              {displayAnswerInputs()}
            </div>
            : <div></div>}

            {state.typers.map(typer => {
              if (typer !== state.playerName) {
                return (<p className="typer-still-typing">{typer} is still writing their answer...</p>)
              }

              if (state.typers.length === 1) { // if we're here then this is playerName and no other player is typing
                return (<p className="typer-still-typing">You're the only one still answering, speed it up!</p>)
              }
              return null
            })}
          </div>
        )
      }
    }
  }

  function displayAnswerChoosing(role) {
    let buttonText = ""
    console.log("numAnswersRevealed: ", state.numAnswersRevealed, "Object.keys(state.playersAndAnswers).length: ", Object.keys(state.playersAndAnswers).length)
    if (state.numAnswersRevealed >= Object.keys(state.playersAndAnswers).length - 1){
      buttonText = "Choose Favourite Answer"
    } else {
      buttonText = "Reveal An Answer"
    }

    // Only show the answer choosing UI when:
    // 1. All typers have submitted (typers.length === 0)
    // 2. No winner has been chosen yet
    // 3. playersAndAnswers has been populated (length > 0)
    if (state.typers.length === 0 && Object.keys(state.winnerAndAnswer).length === 0 && Object.keys(state.playersAndAnswers).length > 0){ //everyone is done typing and no winner has been chosen for the round
      console.log(state.playersAndAnswers)
      return (
        <div>
          {role === "chooser" ? <p className="white-text">Choose your favourite answer (read aloud):</p> : <p className="white-text">{state.chooser + " "}is choosing their favourite answer:</p>}
          {/* <p name="prompt" className="prompt">{state.prompt}</p> */}
          {Object.keys(state.playersAndAnswers).map((playerName, index) => {
            if(index <= state.numAnswersRevealed){
              return (
              <div><button className="button2" onClick={() => {socket.emit("setRoundWinner", {"playerName": playerName, "roomCode": state.roomCode}); socket.emit("getScores", state.roomCode); socket.emit("getRoundWinner", state.roomCode);}}disabled={role === "typer" || (role === "chooser" && state.numAnswersRevealed < Object.keys(state.playersAndAnswers).length - 1)}>
                {state.playersAndAnswers[playerName].map((answerSegment, i) => {
                  if (i % 2 === 0){
                    return answerSegment
                  } else {
                    return <b>{answerSegment}</b>
                  }
                })}
              </button></div>
              )
            }
            return null
          })}
          {role === "chooser" && buttonText === "Reveal An Answer" ? //the && acts like a ternary ? : but without the : part
          <button className="button1" onClick={() => {
              socket.emit("answerRevealed", {roomCode: state.roomCode, numAnswersRevealed: state.numAnswersRevealed+1});
              setState(prevState => ({ ...prevState, numAnswersRevealed: state.numAnswersRevealed+1 }));
            }}>{buttonText}
          </button> : (role === "chooser" && <p className="white-text">{buttonText}</p>)
          }
        </div>
      )

    }
    
  }

  function displayAnswerInputs() {
    console.log("displayAnswerInputs(). answer: ", state.answer)
    return <div>
      {state.answer.map((anAnswer, index) => {
        return (<input key={uid(index)} className="answer-box" name={"answer[" + index + "]"} value={anAnswer} onChange={handleChange} />)
        // return (<h3 key={uid(index)}>AYO</h3>)
      })}
      <div><button className="button1" onClick={() => { socket.emit("submitAnswer", state)}} onChange={handleChange}>Submit Answer</button></div>
    </div>
  }

  function displayRoundResults(role) {
    const roundWinner = Object.keys(state.winnerAndAnswer)[0]
    const winningAnswer = state.winnerAndAnswer[roundWinner]
    const didTheyWinGame = state.winnerAndAnswer["winner"]
    const playersAndScores = state.playersAndScores
    if(Object.keys(state.winnerAndAnswer).length > 0){
      return (
        <div>
          {didTheyWinGame &&
          <h2 className="white-text" style={{"font-size": "24px"}}>{roundWinner.toUpperCase() + " "}HAS WON THE GAME!</h2>}
          <p className="white-text">{roundWinner + " "}got a point with:</p>
          <div className="white-text" style={{color: "var(--text-colour-1"}}>
            {winningAnswer.map((answerSegment, index) => {
              if (index % 2 === 0){
                return answerSegment
              } else {
                return <b>{answerSegment}</b>
              }
            })}
          </div>
          <p className="white-text" style={{"margin-bottom": "5px"}}>Current Score:</p>
          {Object.keys(playersAndScores).map((playerName) => {
            return (<p className="white-text" style={{"margin-bottom": "5px", "margin-top": "0px"}}>{playerName + ": " + playersAndScores[playerName]}</p>)
          })}

          
          {/*role === "chooser"*/state.goToLobby === "host" && !didTheyWinGame && <button className="button1" onClick={() => {startNextRound()}}>Start Next Round</button>}
          {/*role === "chooser"*/state.goToLobby === "host" && didTheyWinGame && <button className="button1" onClick={() => {socket.emit("returnToLobby", state.roomCode)}}>Return To Lobby</button>}
        </div>

      )
    }
  }

  function startNextRound(){
    socket.emit("startNextRound", state.roomCode)
  }

  function restartRoundPlaying() {
    if(state.startGame === "chooser" || state.startGame === "typer"){
      const stateToSend = state
      // stateToSend.prompt = ""
      // stateToSend.chooser = ""
      // stateToSend.typers = []
      // stateToSend.numAnswersExpected = 0
      // stateToSend.answer = []
      // stateToSend.playersAndAnswers = []
      // stateToSend.numAnswersRevealed = -1
      // stateToSend.winnerAndAnswer = {}
      // stateToSend.playerAndScores = {}

      return (<Redirect to={{ pathname: "/roundPlaying", role: state.startGame, state: stateToSend }} />)
    }
    
  }

  function returnToLobby() {
    console.log("returnToLobby()")
    if(state.returnToLobby){
      console.log("returnToLobby() in if with state.goToLobby of ", state.goToLobby)
      if(state.goToLobby === "host"){ // goToLobby holds whether they're a host or not
        return (<Redirect to={{ pathname: "/lobby", host: true, state: state }} />)
      } else if(state.goToLobby === "nonHost") {
        return (<Redirect to={{ pathname: "/lobby", host: false, state: state }} />)
      }
    }
  }


  return (
    <div id="background" className="background-colour-1">
      <div className="page">
        <h2 className="room-code title-colour-1">Room Code: {state.roomCode}</h2>
        {/* <h4>Role: {useLocation().role}</h4> */}
        <h4 className="text-colour-2" style={{ "margin-top": "-20px" }}> {state.playerName}</h4>
        {displayPromptChoosing(state.startGame)}
        {displayAnswerWriting(state.startGame)}
        {displayAnswerChoosing(state.startGame)}
        {displayRoundResults(state.startGame)}
        {restartRoundPlaying()}
        {returnToLobby()}
        {console.log(state)}
        {console.log(useLocation())}

      </div>
    </div>
  )
}

export default RoundPlayingPage;

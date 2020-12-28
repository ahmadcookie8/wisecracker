import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Redirect } from 'react-router-dom';
import socketIOClient from "socket.io-client";
import { uid } from 'react-uid';

import '../../App.css';




function RoundPlayingPage(props) {
  const [state, setState] = useState(useLocation().state)//({ playerName: "", roomCode: "", players: [] })
  const [socket, setSocket] = useState(props.appState.socket)

  useEffect(() => {


    // CLEAN UP THE EFFECT
    // return () => socket.disconnect();

    socket.on("getNewPrompt", (prompt) => {
      const newPrompt = prompt
      console.log(newPrompt)
      setState(prevState => ({ ...prevState, prompt: newPrompt, startGame: null, returnToLobby: false }))
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
      if(state.playerName !== state.chooser){ //if we're a typer
        setState(prevState => ({ ...prevState, numAnswersRevealed: newNumAnswersRevealed }))
      } 
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

        socket.emit("getNewPrompt") //request prompt so we can get it after the redirect we triggered above
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

    socket.on("returnToLobby", (playersAndRoles) => {
      console.log("playersAndRoles", playersAndRoles)

      if (typeof playersAndRoles === "string") { //error
        const errorMessage = playersAndRoles
        console.log(errorMessage)
      } else {
        const role = playersAndRoles[state.playerName]
          
        setState(prevState => ({ ...prevState, "returnToLobby": true }))
        console.log("returnToLobby", state.returnToLobby)

        setState(prevState => ({ ...prevState, prompt: "",
          chooser: "",
          typers: [],
          answer: [],
          playersAndAnswers: [],
          numAnswersRevealed: -1,
          winnerAndAnswer: {},
          playerAndScores: {},
          numAnswersExpected: 0, //last b/c this triggers the prompt choosing
          startGame: role
        }))

        socket.emit("getNewPrompt") //request prompt so we can get it after the redirect we triggered above
        socket.emit("getChooser", state.roomCode) //request chooser so we can get it after the redirect we triggered above
        socket.emit("getTypers", state.roomCode) //request typers so we can get it after the redirect we triggered above
      }
    });

    socket.on("triggerNewRoundFromDisconnection", () => {
      startNextRound()
    });

    socket.on("triggerNewRoundFromDisconnectionAlert", (personWhoLeft) => {
      window.alert("Restarting round due to " + personWhoLeft + " leaving")
    });

    

  }, []);



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
            <h6 style={{ color: "var(--text-colour-1)" }}>Prompt:</h6>
            <textarea className="choosing-prompt" value={state.prompt} name="prompt" onChange={handleChange} />
            <div><button className="button1" onClick={() => { socket.emit("getNewPrompt") }}>Get New Prompt</button></div>
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
              <h3 style={{ color: "var(--text-colour-1)" }}>Prompt:</h3>
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

    if (state.typers.length === 0 && Object.keys(state.winnerAndAnswer).length === 0){ //everyone is done typing and no winner has been chosen for the round
      console.log(state.playersAndAnswers)
      return (
        <div>
          {role === "chooser" ? <p className="white-text">Choose your favourite answer (read aloud):</p> : <p className="white-text">{state.chooser + " "}is choosing their favourite answer:</p>}
          {/* <p name="prompt" className="prompt">{state.prompt}</p> */}
          {Object.keys(state.playersAndAnswers).map((playerName, index) => {
            if(index <= state.numAnswersRevealed){
              // return (<p className="white-text">{state.playersAndAnswers[playerName].join(" // ")}</p>)
              // return (<div><button className="button1 ">{state.playersAndAnswers[playerName].join(" // ")}</button></div>)
              // return (<p className="white-text">{state.playersAndAnswers[playerName]}</p>)
              // return (<div><button className="button2" disabled={role === "typer" || (role === "chooser" && state.numAnswersRevealed < Object.keys(state.playersAndAnswers).length - 1)}>{state.playersAndAnswers[playerName]}</button></div>) //can only click if chooser and all the answers have been revealed
              return (
              <div><button className="button2" onClick={() => {socket.emit("setRoundWinner", {"playerName": playerName, "roomCode": state.roomCode}); socket.emit("getScores", state.roomCode); socket.emit("getRoundWinner", state.roomCode);}}disabled={role === "typer" || (role === "chooser" && state.numAnswersRevealed < Object.keys(state.playersAndAnswers).length - 1)}>
                {state.playersAndAnswers[playerName].map((answerSegment, index) => {
                  if (index % 2 == 0){
                    return answerSegment
                  } else {
                    return <b>{answerSegment}</b>
                  }
                })}
              </button></div>
              ) //can only click if chooser and all the answers have been revealed
            }
          })}
          {role === "chooser" && //the && acts like a ternary ? : but without the : part
          <button className="button1" onClick={() => {
              socket.emit("answerRevealed", {roomCode: state.roomCode, numAnswersRevealed: state.numAnswersRevealed+1});
              setState(prevState => ({ ...prevState, numAnswersRevealed: state.numAnswersRevealed+1 }));
            }}>{buttonText}
          </button>}
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
              if (index % 2 == 0){
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
        {displayPromptChoosing(useLocation().role)}
        {displayAnswerWriting(useLocation().role)}
        {displayAnswerChoosing(useLocation().role)}
        {displayRoundResults(useLocation().role)}
        {restartRoundPlaying()}
        {returnToLobby()}
        {console.log(state)}
        {console.log(useLocation())}

      </div>
    </div>
  )
}

export default RoundPlayingPage;

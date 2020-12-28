const { Console } = require("console")
const fs = require("fs")

//TODO MAKE METHOD TO REINITIALIZE ALL GLOBAL VARIABLES AT THE START OF ROUND E.G. chooserIndex
//Initialized Global Variables
// let underscoreCount = 0
let underscoreCountOfRoom = {}
// let listOfPlayers = []
//let listOfTypers = []
//let chooser = ""
// let chooserIndex = 0
chooserIndexOfRoom = {}
//let playerData = {}
let listOfPrompts = []
// let gamePrompt = ""
let gamePrompts = {}
// let playerWithHighestScore = ""
let allConnectedPlayers = {} //structured as allConnectedPlayers[roomCode][playerName]
let allDisconnectedPlayers = {} //structured as allDisconnectedPlayers[roomCode][playerName]
// let alreadyPrinted
// let maxScore = 0
let randomizedTypersAnswers = {}
let roundWinnerOfRoom = {}
let maxScoreOfRoom = {}
let gameWinner = {}

//Constants to refer to index of playerData
const ANSWERS = 0
const SCORE = 1
const ROLE = 2

//----CALLS FOR THE SERVER TO MAKE----//
// function apiGetChooser() {
//     return chooser
// }

// function apiGetTypers() {
//     return listOfTypers
// }

// function apiGetRoundWinner(roundWinnerIndex) {
//     return listOfTypers[alreadyPrinted[roundWinnerIndex]]
// }

// function apiScoreLimit(givenScoreLimit) {
//     if (isNaN(givenScoreLimit) || parseInt(givenScoreLimit) < 1) {
//         return false
//     } else {
//         maxScore = givenScoreLimit
//         return true
//     }
// }

// function apiAssigningAnswersToPlayers(givenName, givenAnswer1, givenAnswer2, givenRoomCode) {
//     playerData[givenName][ANSWER1] = givenAnswer1
//     playerData[givenName][ANSWER2] = givenAnswer2
// }

const apiSetMaxScore = (roomCode, givenMaxScore) => {
  maxScoreOfRoom[roomCode] = givenMaxScore
}

const apiGetMaxScore = (roomCode) => {
  return maxScoreOfRoom[roomCode]
}

const apiSetPlayerAnswer = (roomCode, playerName, answers) => {
  const listOfPlayers = Object.keys(allConnectedPlayers[roomCode])

  allConnectedPlayers[roomCode][playerName][ANSWERS] = answers

  const typersRemaining = listOfPlayers.filter((player) => {
    return allConnectedPlayers[roomCode][player][ROLE] === "typer" &&
      allConnectedPlayers[roomCode][player][ANSWERS].length === 0
  })

  //check when typersRemaining is empty and then call setRandomizedPlayerAnswers
  if (typersRemaining.length === 0) {
    setRandomizedPlayerAnswers(roomCode)
  }

  return typersRemaining
}

const setRandomizedPlayerAnswers = (roomCode) => {
  let listOfTypers = apiGetTypers(roomCode)
  let listOfAnswers = listOfTypers.map((player) => { if (allConnectedPlayers[roomCode][player][ROLE] === "typer") { return allConnectedPlayers[roomCode][player][ANSWERS] } })
  let listOfTypersAnswers = {}

  for (let i = 0; i < listOfTypers.length; i++) {
    listOfTypersAnswers[listOfTypers[i]] = listOfAnswers[i]
  }

  let listOfRandomizedTypersAnswers = {}
  let listOfRandomizedTypers = shuffle(listOfTypers)

  for (let i = 0; i < listOfTypers.length; i++) {
    // listOfRandomizedTypersAnswers[listOfRandomizedTypers[i]] = listOfTypersAnswers[listOfRandomizedTypers[i]]
    listOfRandomizedTypersAnswers[listOfRandomizedTypers[i]] = apiAssigningAnswerToPrompt(roomCode, listOfTypersAnswers[listOfRandomizedTypers[i]])
  }
  randomizedTypersAnswers[roomCode] = listOfRandomizedTypersAnswers
}

const apiGetRandomizedPlayerAnswers = (roomCode) => {
  return randomizedTypersAnswers[roomCode]
}

// function apiGetPrompt() {
const apiGetRandomPrompt = () => {
  let hasGeneratedPrompt = false

  if (!hasGeneratedPrompt) {
    promptListMaker()
    hasGeneratedPrompt = true
  }

  // console.log(listOfPrompts)
  let apiPrompt = listOfPrompts[Math.floor(Math.random() * listOfPrompts.length + 1)]

  gamePrompt = apiPrompt

  return apiPrompt
}

const apiGetPrompt = (roomCode) => {
  return gamePrompts[roomCode]
}

const apiGetChooser = (roomCode) => {
  // let listOfRoomCodes = Object.keys(allConnectedPlayers)

  // if (listOfRoomCodes.includes(roomCode)) {
  // console.log("ZZZZZ apiGetChooser()", roomCode, allConnectedPlayers)
  listOfPlayers = Object.keys(allConnectedPlayers[roomCode])


  for (let i = 0; i < listOfPlayers.length; i++) {
    if (allConnectedPlayers[roomCode][listOfPlayers[i]][ROLE] === "chooser") {
      return listOfPlayers[i]
    }
  }
  // }
  // return ""
}

const apiGetTypers = (roomCode) => {
  listOfPlayers = Object.keys(allConnectedPlayers[roomCode])
  currentylChosen = apiGetChooser(roomCode)
  listOfTypers = []

  for (let i = 0; i < listOfPlayers.length; i++) {
    if (allConnectedPlayers[roomCode][listOfPlayers[i]][ROLE] !== "chooser") {
      listOfTypers.push(listOfPlayers[i])
    }

  }
  return listOfTypers
}

const apiGetPlayersAndRoles = (roomCode) => {
  let listOfPlayers = Object.keys(allConnectedPlayers[roomCode])
  let listOfPlayersAndRoles = {}

  for (let i = 0; i < listOfPlayers.length; i++) {
    listOfPlayersAndRoles[listOfPlayers[i]] = allConnectedPlayers[roomCode][listOfPlayers[i]][ROLE]
  }
  return listOfPlayersAndRoles
}

// function apiAssigningAnswersToPrompts(givenName, prompt, givenRoomCode) {
//     fullAnswer = ""

//     answer1 = playerData[givenName][ANSWER1]
//     answer2 = playerData[givenName][ANSWER2]

//     //Counting underscores
//     for (let i = 0; i < prompt.length; i++) {
//         if (prompt[i] === "_") {
//             underscoreCount++
//         }
//     }

//     //Only works for single blanks
//     if (underscoreCount <= 1) {
//         if (prompt.includes("_")) {
//             fullAnswer = prompt.replace("_", answer1)
//         } else {
//             fullAnswer = prompt.strip() + " " + answer1 + "\n"
//         }
//         //For 2 blanks in a prompt
//     } else {
//         replacedPrompt = ""
//         let firstAnswerInputted = false

//         for (let i = 0; i < prompt.length; i++) {
//             if (prompt[i] === "_") {
//                 if (!firstAnswerInputted) {
//                     replacedPrompt += answer1
//                     firstAnswerInputted = true
//                 } else {
//                     replacedPrompt += answer2
//                 }
//             } else {
//                 replacedPrompt += prompt[i]
//             }
//         }
//         fullAnswer = replacedPrompt
//     }
//     return fullAnswer
// }

// function apiGetGameWinner() {
//     getHighestScore()
//     return playerWithHighestScore
// }

const apiAssigningAnswerToPrompt = (roomCode, answers) => {
  let fullAnswer = ""
  prompt = gamePrompts[roomCode]

  let underscoresReplaced = 0

  if (underscoreCountOfRoom[roomCode] === 0) {
    fullAnswer = prompt.trim() + " " + "<br>" + answers[0] + "<br>"
  } else {
    for (let i = 0; i < prompt.length; i++) {
      if (prompt[i] === "_") {
        prompt = prompt.replace("_", "<br>" + answers[underscoresReplaced] + "<br>")
        underscoresReplaced++
      }
      fullAnswer = prompt
    }
  }
  fullAnswer = fullAnswer.split("<br>")
  // console.log(fullAnswer)
  return fullAnswer
}

const apiSetRoundWinner = (roomCode, playerName) => {
  roundWinnerOfRoom[roomCode] = playerName
  allConnectedPlayers[roomCode][playerName][SCORE]++
}

const apiGetRoundWinner = (roomCode) => {
  let roundWinner = roundWinnerOfRoom[roomCode]
  let answers = allConnectedPlayers[roomCode][roundWinner][ANSWERS]

  let fullAnswer = apiAssigningAnswerToPrompt(roomCode, answers)

  let roundWinnerInfo = {}
  roundWinnerInfo[roundWinner] = fullAnswer

  if (apiGetScores(roomCode)[roundWinner] >= maxScoreOfRoom[roomCode]) {
    roundWinnerInfo["winner"] = true
  } else {
    roundWinnerInfo["winner"] = false
  }

  console.log(roundWinnerInfo)
  return roundWinnerInfo
}

const apiGetScores = (roomCode) => {
  listOfPlayers = Object.keys(allConnectedPlayers[roomCode])
  listOfPlayerScores = {}

  listOfPlayers.map((element) => { listOfPlayerScores[element] = allConnectedPlayers[roomCode][element][SCORE] })

  return listOfPlayerScores
}

// const apiAssigningAnswerToPromptAsList = (roomCode, answers) => {
//     let fullAnswer = []
//     prompt = gamePrompts[roomCode]

//     prompt = prompt.split("_")
//     // console.log(prompt)
//     let answerToAdd = 0

//     if (prompt[0] === "") {
//         console.log("????????????????")
//         prompt.map((element, index) => {
//             if (index % 2 === 1) {
//                 prompt.splice(index, 0, answers[answerToAdd])
//                 answerToAdd++
//             }
//         })
//     } else if (prompt.includes("_")) {
//         prompt.map((element, index) => {
//             if (index % 2 === 0) {
//                 prompt.splice(index, 0, answers[answerToAdd])
//                 answerToAdd++
//             }
//         })
//     } else if (!prompt.includes("_")) {
//         console.log("//////////////////////")
//         prompt.push(answers[answerToAdd])
//     }


//     console.log(prompt)
//     return prompt
// }

// const apiAssigningAnswerToPromptAsList = (roomCode, answers) => {
//     let fullAnswer = []
//     prompt = gamePrompts[roomCode]

//     // prompt = prompt.split("_")
//     prompt = prompt.split(" ")
//     // console.log(prompt)
//     let answerToAdd = 0

//     if (underscoreCountOfRoom[roomCode] === 0) {
//         prompt.push(answers[0])
//         fullAnswer = prompt
//     } else {
//         for (let i = 0; i < prompt.length; i++) {
//             if (prompt[i] === "_") {
//                 prompt[i] = answers[answerToAdd]
//                 answerToAdd++
//             }
//             fullAnswer = prompt
//         }
//     }

//     console.log(fullAnswer)
//     return fullAnswer
// }

const apiSetPrompt = (roomCode, prompt) => {
  prompt = cleanUpPrompt(prompt)
  gamePrompts[roomCode] = prompt

  underscoreCountOfRoom[roomCode] = 0

  for (let i = 0; i < prompt.length; i++) {
    if (prompt[i] === "_") {
      underscoreCountOfRoom[roomCode]++
    }
  }
  if (underscoreCountOfRoom[roomCode] === 0) {
    return 1
  } else {
    return underscoreCountOfRoom[roomCode]
  }
}

const cleanUpPrompt = (prompt) => {
  for (let i = 0; i < prompt.length; i++) {
    while (prompt[i] === "_" && prompt[i + 1] === "_") {
      prompt = removeByIndex(prompt, i + 1)
    }
  }
  return prompt
}

// tPrompt = "I like to eat ___________ and __ and __ on the day of __ because my cheeku is very fluffy and ____."
// console.log(apiSetPrompt(tPrompt))
// console.log(apiAssigningAnswerToPrompt(tPrompt, ["1", "2", "3", "4", "5"]))

// function apiJoinRoom(playerJoining, roomCode) {
const apiJoinRoom = (playerJoining, roomCode) => {
  roomCode = roomCode.toUpperCase()

  let listOfRoomCodes = Object.keys(allConnectedPlayers)

  if (listOfRoomCodes.includes(roomCode)) {
    let listOfDisconnectedPlayersInRoom = Object.keys(allDisconnectedPlayers[roomCode])
    let listOfPlayersInRoom = Object.keys(allConnectedPlayers[roomCode])

    //capitalize all names in listOfPlayersInRoom
    listOfPlayersInRoom = listOfPlayersInRoom.map(element => {
      return element.toUpperCase()
    });

    //capitalize all names in listOfDisconnectedPlayersInRoom
    listOfDisconnectedPlayersInRoom = listOfDisconnectedPlayersInRoom.map(element => {
      return element.toUpperCase()
    });

    if (playerJoining !== "") {
      let firstPersonInRoom = Object.keys(allConnectedPlayers[roomCode])
      firstPersonInRoom = firstPersonInRoom[0]
      if (allConnectedPlayers[roomCode][firstPersonInRoom][ROLE] === "") {
        //checks if disconnected player is rejoining
        if (listOfDisconnectedPlayersInRoom.includes(playerJoining.toUpperCase())) {
          allConnectedPlayers[roomCode][playerJoining] = allDisconnectedPlayers[roomCode][playerJoining]

          if (allConnectedPlayers[roomCode][playerJoining][ROLE] === "chooser") {
            listOfPlayersInRoom = Object.keys(allConnectedPlayers[roomCode])

            //get's the current choosers index
            chooserIndexOfRoom[roomCode] = listOfPlayersInRoom.indexOf(playerJoining)

            //chooses next person in line to be chooser and makes sure chooserIndex does not go out of bounds
            if (chooserIndexOfRoom[roomCode] < listOfPlayers.length - 1) {
              chooserIndexOfRoom[roomCode]++
            } else {
              chooserIndexOfRoom[roomCode] = 0
            }

            //prevents the person joining from staying as chooser and lets the next person in line become chooser
            roleAssigner(roomCode)
            rollCycler(roomCode)
          }

          return Object.keys(allConnectedPlayers[roomCode])
        } else {
          if (!listOfPlayersInRoom.includes(playerJoining.toUpperCase)) {
            allConnectedPlayers[roomCode][playerJoining] = [[], 0, ""]
            return Object.keys(allConnectedPlayers[roomCode])
          } else {
            return "Name Taken"
          }
        }
      } else {
        return "The game is still in progress. Wait until the game is finished"
      }
    } else {
      return "Enter a Valid Name"
    }
  } else {
    return "Room Code Doesn't Exist"
  }
}

//TODO MAKE THIS AGAIN BUT GIVEN ROOMCODE AS WELL AND I DONT HAVE TO GENERATE ONE
//function apiCreateRoom(playerCreating) {
const apiCreateRoom = (playerCreating) => {
  let allCharacters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  let roomCode = ""

  for (let i = 0; i < 4; i++) {
    let digit = Math.floor(Math.random() * 36)
    roomCode += allCharacters[digit]
  }
  roomCode = roomCode.toUpperCase()
  let listOfRoomCodes = Object.keys(allConnectedPlayers)

  while (listOfRoomCodes.includes(roomCode)) {
    roomCode = ""
    console.log("This room already exists :O")

    for (let i = 0; i < 4; i++) {
      let digit = Math.floor(Math.random() * 36)
      roomCode += allCharacters[digit]
    }
  }
  roomCode = roomCode.toUpperCase()

  allConnectedPlayers[roomCode] = {}
  allDisconnectedPlayers[roomCode] = {}
  gamePrompts[roomCode] = ""
  chooserIndexOfRoom[roomCode] = 0
  underscoreCountOfRoom[roomCode] = 0
  randomizedTypersAnswers[roomCode] = {}
  roundWinnerOfRoom[roomCode] = ""
  maxScoreOfRoom[roomCode] = 3 //TODO CHANGE BACK TO 3

  if (playerCreating !== "") {
    allConnectedPlayers[roomCode][playerCreating] = [[], 0, ""]
  } else {
    return "Enter a Valid Name"
  }

  return roomCode
}

const apiLeavingRoom = (playerLeaving, roomCode) => {
  let listOfRoomCodes = Object.keys(allConnectedPlayers)
  let listOfPlayers = Object.keys(allConnectedPlayers[roomCode])

  // if (listOfPlayers.length - 1 === chooserIndexOfRoom[roomCode]) {
  if (chooserIndexOfRoom[roomCode] !== 0) {
    chooserIndexOfRoom[roomCode]--
  }

  listOfPlayers = listOfPlayers.map(element => {
    return element.toUpperCase()
  });

  if (listOfPlayers.includes(playerLeaving.toUpperCase()) && listOfRoomCodes.includes(roomCode)) {
    allDisconnectedPlayers[roomCode][playerLeaving] = allConnectedPlayers[roomCode][playerLeaving]

    delete allConnectedPlayers[roomCode][playerLeaving]
    return Object.keys(allConnectedPlayers[roomCode])
  }
}

const apiRemoveRoom = (roomCode) => {
  let listOfRoomCodes = Object.keys(allConnectedPlayers)

  roomCode = roomCode.toUpperCase()

  if (listOfRoomCodes.includes(roomCode)) {
    delete allConnectedPlayers[roomCode]
    console.log("Rooms: " + allConnectedPlayers)
  }
}

const apiStartGame = (roomCode) => {
  let listOfPlayers = Object.keys(allConnectedPlayers[roomCode])

  //to reset everyone's score to 0
  listOfPlayers.map((element) => {
    allConnectedPlayers[roomCode][element][SCORE] = 0
  })

  if (listOfPlayers.length < 3) {
    return "You Need At Least 3 Players To Start The Game"
  } else {
    //checking first players role to see if blank (cuz everyone elses would be blank too)
    if (allConnectedPlayers[roomCode][listOfPlayers[0]][ROLE] === "") {
      roleAssigner(roomCode)
      rollCycler(roomCode)
    }
    return apiGetPlayersAndRoles(roomCode)
  }
}

//to reset roles to "" upon going back to lobby
const apiReturnToLobby = (roomCode) => {
  let listOfPlayers = Object.keys(allConnectedPlayers[roomCode])
  
  listOfPlayers.map((element) => {
    allConnectedPlayers[roomCode][element][ANSWERS] = []
    allConnectedPlayers[roomCode][element][ROLE] = ""
  })

  return apiGetPlayersAndRoles(roomCode)
}

// const apiNextGame = (roomCode) => {
//   let listOfPlayers = Object.keys(allConnectedPlayers[roomCode])

//   listOfPlayers.map((element) => {
//     allConnectedPlayers[roomCode][element][ANSWERS] = []
//   })

//   roleAssigner(roomCode)

//   return apiGetPlayersAndRoles(roomCode)
// }

const apiNextRound = (roomCode) => {
  listOfPlayers = Object.keys(allConnectedPlayers[roomCode])

  listOfPlayers.map((element) => {
    allConnectedPlayers[roomCode][element][ANSWERS] = []
  })

  roleAssigner(roomCode)
  rollCycler(roomCode)

  return apiGetPlayersAndRoles(roomCode)
}

module.exports = {
  apiGetRandomPrompt,
  apiJoinRoom,
  apiCreateRoom,
  apiGetChooser,
  apiGetTypers,
  apiGetPlayersAndRoles,
  apiLeavingRoom,
  apiRemoveRoom,
  apiStartGame,
  apiSetPrompt,
  apiGetPrompt,
  apiAssigningAnswerToPrompt,
  apiSetPlayerAnswer,
  apiGetRandomizedPlayerAnswers,
  apiSetRoundWinner,
  apiGetRoundWinner,
  apiGetScores,
  apiNextRound,
  apiSetMaxScore,
  apiGetMaxScore,
  apiReturnToLobby,
}

//
// tRoomCode = apiCreateRoom("john")
// console.log(apiGetMaxScore(tRoomCode))
// apiSetMaxScore(tRoomCode, 1)
// console.log(apiGetMaxScore(tRoomCode))
// apiJoinRoom("milly", tRoomCode)
// apiJoinRoom("dog", tRoomCode)
// apiJoinRoom("henry", tRoomCode)
// apiJoinRoom("joey", tRoomCode)
// apiJoinRoom("josh", tRoomCode)
// apiStartGame(tRoomCode)
// apiSetPrompt(tRoomCode, "hello, my name is _ and i like to eat _.")
// apiStartGame(tRoomCode)
// console.log(allConnectedPlayers)
// console.log(apiSetPlayerAnswer(tRoomCode, "john", ["john1", "john2"]))
// console.log(apiSetPlayerAnswer(tRoomCode, "milly", ["milly1", "milly2"]))
// console.log(apiSetPlayerAnswer(tRoomCode, "dog", ["dog1", "dog2"]))
// console.log(apiSetPlayerAnswer(tRoomCode, "henry", ["henry1", "henry2"]))
// console.log(apiSetPlayerAnswer(tRoomCode, "joey", ["joey1", "joey2"]))
// console.log(apiSetPlayerAnswer(tRoomCode, "josh", ["josh1", "josh2"]))
// console.log(apiSetRoundWinner(tRoomCode, "milly"))
// console.log(apiGetRoundWinner(tRoomCode))
// console.log(apiGetScores(tRoomCode))
// apiNextRound(tRoomCode)
// console.log(allConnectedPlayers)
// console.log(allConnectedPlayers)
// console.log(apiGetRandomizedPlayerAnswers(tRoomCode))
// console.log(allConnectedPlayers)
// console.log(allConnectedPlayers[tRoomCode]["john"][ANSWERS])

//TESTING apiStartGame
// tRoomCode = apiCreateRoom("john")
// apiJoinRoom("milly", tRoomCode)
// apiJoinRoom("dog", tRoomCode)
// console.log(allConnectedPlayers[tRoomCode])
// apiStartGame(tRoomCode)
// console.log(allConnectedPlayers[tRoomCode])

// TEST CODE TO CREATING AND JOINING A ROOM
// tRoomCode = apiCreateRoom("john")
// // console.log(Object.keys(allDisconnectedPlayers[tRoomCode]))
// console.log(allConnectedPlayers)
// apiJoinRoom("milly", tRoomCode)
// apiJoinRoom("dog", tRoomCode)
// apiStartGame(tRoomCode)
// // console.log(allConnectedPlayers)
// console.log(allConnectedPlayers[tRoomCode])
// console.log(apiLeavingRoom("john", tRoomCode))
// console.log(allDisconnectedPlayers)
// apiJoinRoom("john", tRoomCode)
// console.log(allConnectedPlayers[tRoomCode])
// apiStartGame(tRoomCode)
// console.log(allConnectedPlayers)
// console.log(apiLeavingRoom("dog", tRoomCode))
// apiStartGame(tRoomCode)
// console.log(allConnectedPlayers)
// apiStartGame(tRoomCode)
// console.log(allConnectedPlayers)
// apiRemoveRoom(tRoomCode)
// console.log(allConnectedPlayers)

// TESTING TO SEE IF BLANK NAMES ARE REJECTED
// console.log(apiCreateRoom(""))
// tRoomCode = apiCreateRoom("John")
// console.log(apiJoinRoom("", tRoomCode))
// console.log(apiJoinRoom("dog", tRoomCode))


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// function promptListMaker() {
//     //TODO RELOCATE TEXT FILE OF PROMPTS
//     let listOfPrompts = []
//     listOfPrompts = fs.readFile('listOfPrompts.txt', 'utf-8', (err, data) => {

//         if (err) throw err;

//         // Converting Raw Buffer to text 
//         // data using tostring function. 
//         // console.log(data); 
//         listOfPrompts = data.split("\n")
//         return listOfPrompts
//         // console.log(listOfPrompts)

//     })
//     console.log(listOfPrompts)
//     return listOfPrompts
// }

function promptListMaker() {
  //TODO RELOCATE TEXT FILE OF PROMPTS
  let _listOfPrompts = fs.readFileSync(__dirname + '/listOfPrompts.txt', 'utf8')
  listOfPrompts = _listOfPrompts.split("\n")
  // console.log(listOfPrompts)
}

// // function getPrompt() {
// //     apiPrompt = listOfPrompts[Math.floor(Math.random() * listOfPrompts.length)]

// //     gamePromp = apiPrompt

// //     return apiPrompt
// // }

// function addAnswerToPrompt(prompt, answer1, answer2) {
//     fullAnswer = ""

//     //Only works for single blanks
//     if (underscoreCount <= 1) {
//         if (prompt.includes("_")) {
//             fullAnswer = prompt.replace("_", answer1)
//         } else {
//             fullAnswer = prompt.strip() + " " + answer1 + "\n"
//         }
//         //For 2 blanks in a prompt
//     } else {
//         replacedPrompt = ""
//         firstAnswerInputted = false

//         for (let i = 0; i < prompt.length; i++) {
//             if (prompt[i] === "_") {
//                 if (!firstAnswerInputted) {
//                     replacedPrompt += answer1
//                     firstAnswerInputted = true
//                 } else {
//                     replacedPrompt += answer2
//                 }
//             } else {
//                 replacedPrompt += prompt[i]
//             }
//         }
//         fullAnswer = replacedPrompt
//     }
//     return fullAnswer
// }

// //arguments given by frontend
// function playerListMaker(nameInput) {
//     console.log("Clear screen")
//     console.log("Enter a name (0 to finish): ")
//     while (nameInput !== 0) {
//         if (!listOfPlayers.includes(nameInput) && nameInput !== "") {
//             listOfPlayers.push(nameInput)
//         } else {
//             console.log("Cannot use that name, try again:\n")
//             console.log("The above message is displayed if an inputted name is blank \"\" or if a duplicate name was inputted")
//         }
//         console.log("Enter a name (0 to finish)")
//     }
// }

// function roleAssigner() {
//     chooser = listOfPlayers[chooserIndex]
//     if (chooserIndex < listOfPlayers.length - 1) {
//         chooserIndex++
//     } else {
//         chooserIndex = 0
//     }

function removeByIndex(str, index) {
  return str.slice(0, index) + str.slice(index + 1);
}

function roleAssigner(roomCode) {
  listOfPlayers = Object.keys(allConnectedPlayers[roomCode])
  let toBeChosen = ""
  // let thereIsAChooser = false

  for (let i = 0; i < listOfPlayers.length; i++) {
    allConnectedPlayers[roomCode][listOfPlayers[i]][ROLE] = "typer"
  }

  toBeChosen = listOfPlayers[chooserIndexOfRoom[roomCode]]
  // console.log("ZZZZZ roleAssigner()", allConnectedPlayers[roomCode])
  // console.log("ZZZZZ roleAssigner()", toBeChosen)
  allConnectedPlayers[roomCode][toBeChosen][ROLE] = "chooser"

  // for (let i = 0; i < listOfPlayers.length; i++) {
  //   if (allConnectedPlayers[roomCode][listOfPlayers[i]][ROLE] !== "chooser") {
  //     allConnectedPlayers[roomCode][listOfPlayers[i]][ROLE] = "typer"
  //   }
  // }
}

const rollCycler = (roomCode) => {
  if (chooserIndexOfRoom[roomCode] < listOfPlayers.length - 1) {
    chooserIndexOfRoom[roomCode]++
  } else {
    chooserIndexOfRoom[roomCode] = 0
  }
}

//     for (let i = 0; i < listOfPlayers.length; i++) {
//         if (listOfPlayers[i] !== chooser) {
//             listOfTypers.push(listOfPlayers[i])
//         }
//     }
// }

// function basePlayerData() {
//     for (let i = 0; i < listOfPlayers.length; i++) {
//         playerData[listOfPlayers[i]] = ["", "", 0]
//     }
// }

// function assigningAnswersToPlayer(nameInput, answer1, answer2) {
//     playerData[nameInput][ANSWER1] = answer1
//     playerData[nameInput][ANSWER2] = answer2
// }


// //arguments given by frontend
// function promptFillingSequence(answer1, answer2) {
//     console.log("Clear screen")
//     console.log("(chooser) will be choosing the best answer!\nEnter to continue...")

//     for (let i = 0; i < listOfPlayers.length; i++) {
//         if (listOfTypers.includes(listOfPlayers[i])) {
//             console.log("Clear screen")
//             console.log("Prompt: (apiPrompt)")

//             //TODO MAKE GETTER FOR CURRENT PLAYER'S NAME
//             console.log("(listOfPlayers[i])'s Turn: ")

//             if (underscoreCount < 2) {
//                 console.log("Blank: ")
//             } else {
//                 console.log("First Blank: ")
//                 console.log("Second Blank: ")
//             }
//         }
//         assigningAnswersToPlayer(listOfPlayers[i], answer1, answer2)
//     }
// }
// //arguments given by frontend
// function choosingBestAnswerSequence(roundWinnerIndex) {
//     console.log("Clear screen")
//     console.log("(chooser)'s Choosing:\n")

//     alreadyPrinted = []
//     toBePrintedIndex = Math.floor(Math.random() * listOfPlayers.length + 1)
//     let i = 0

//     while (alreadyPrinted.length != listOfTypers.length) {
//         console.log("(i). ") //Prints the number of the answer being shown "1. ..." or "2. ..."
//         //TODO FIGURE OUT A WAY FOR FRONT END TO GET EACH INDIVIDUAL ANSWER
//         addAnswerToPrompt(gamePrompt, playerData[listOfTypers[toBePrintedIndex]][ANSWER1], playerData[listOfTypers[toBePrintedIndex]][ANSWER2])

//         alreadyPrinted.push(toBePrintedIndex)

//         while (alreadyPrinted.includes(toBePrintedIndex) && alreadyPrinted.length !== listOfTypers.length) {
//             toBePrintedIndex = Math.floor(Math.random() * listOfPlayers.length + 1)
//         }
//         i++
//     }
//     console.log("Choose a winner (Enter a #)")

//     //THE FOLLOWING CODE IS USELESS FOR THE FRONT END SINCE THE WEBSITE SHOULD ALWAYS GIVE A VALID ANSWER
//     while (isNaN(roundWinnerIndex) || parseInt(roundWinnerIndex) < 1 || parseInt(roundWinnerIndex) > listOfTypers.length) {
//         console.log("Enter a valid number: ")
//         console.log("I guess this would never happen since they'd be choosing from a box that would return a value but whatever")
//     }
//     //ONLY IMPLEMENT NEXT LINE IF THE WEBSITE RETURNS VALUES STARTING FROM 1 WHEN CHOOSING THE BEST ANSWER
//     //roundWinnerIndex = alreadyPrinted[parseInt(roundWinnerIndex) - 1]
// }



function shuffle(arr) {
  var rand, temp, i;

  for (i = arr.length - 1; i > 0; i -= 1) {
    rand = Math.floor((i + 1) * Math.random());//get random between zero and i (inclusive)
    temp = arr[rand];//swap i and the zero-indexed number
    arr[rand] = arr[i];
    arr[i] = temp;
  }
  return arr;
}

// //arguments given by frontend
// function scoreAssigner(roundWinnerIndex) {
//     console.log("Clear screen")
//     playerData[listOfTypers[roundWinnerIndex]][SCORE]++

//     console.log("(listOfTypers[roundWinnerIndex] has won the round!")
// }

// //[DONE] TODO MAKE THIS INTO GETTER WHICH RETURNS ANYONES SCORE BASED ON GIVEN INDEX, SO THE FRONTEND CAN USE IT PROPERLY
// function scoreDisplay(indexOfPlayer) {
//     return playerData[listOfPlayers[indexOfPlayer]][SCORE]

// }
// // //arguments given by frontend
// // //i don't really see the point of this returning the score limit that it was given, the front end can just use whatever variable it stored the scoreLimit in in the first place. I guess i should TODO change it so it just checks validity of scoreLimit given rather than being a validator and getter for the score limit
// // function scoreLimit(givenScoreLimit) {
// //     console.log("How many points will you like to play up to?")

// //     while (isNaN(givenScoreLimit) || parseInt(givenScoreLimit) < 1) {
// //         // console.log("Enter a valid max score: ")
// //         // console.log("I guess you'd make them put another max score and pass it through? i'm not sure tbh, i should prolly ask")
// //         return "Enter a valid max score!"
// //     }
// //     return givenScoreLimit
// // }

// function dataMaker() {
//     scoreLimit()
//     playerListMaker()
//     roleAssigner()
//     basePlayerData()
// }

// function getHighestScore() {
//     highestScore = 0

//     for (let i = 0; i < listOfPlayers.length; i++) {
//         currentScore = playerData[listOfPlayers[i]][SCORE]

//         if (currentScore > highestScore) {
//             highestScore = currentScore
//             playerWithHighestScore = listOfPlayers[i]
//         }
//     }
//     return highestScore
// }

// //TODO MIGHT HAVE TO MAKE GETTER OF WHO HAS HIGHEST SCORE CHECKING THRU EVERY PLAYERDATA SCORE AND COMPARING IT WITH HIGHEST SCORE

// function winnerDisplay() {
//     console.log("Congratulations! (playerWithHighestScore)! You have won the game!!")
// }

// //----------------------------------------------------
// function startGame() {
//     //conditions in order for the game to start
//     if (listOfPlayers.length < 3) {
//         console.log("Clear screen")
//         console.log("You need at least 3 players to play!\nYou currently have: (displays amount of players by showing length of listOfPlayers array)")
//     }
//     dataMaker()

//     while (getHighestScore() < parseInt(maxScore)) {
//         promptFillingSequence(answer1, answer2)
//         choosingBestAnswerSequence(roundWinnerIndex)
//         scoreAssigner(roundWinnerIndex)
//         scoreDisplay(indexOfPlayer)
//         roleAssigner() //to switch who the next chooser is for next round
//     }
//     winnerDisplay()
// }
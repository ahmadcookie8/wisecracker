const fs = require("fs")

//TODO MAKE METHOD TO REINITIALIZE ALL GLOBAL VARIABLES AT THE START OF ROUND E.G. chooserIndex
//Initialized Global Variables
let underscore_count = 0
// let listOfPlayers = []
//let listOfTypers = []
//let chooser = ""
let chooserIndex = 0
//let playerData = {}
let listOfPrompts = []
let gamePrompt = ""
let playerWithHighestScore = ""
let roomData = {}
let alreadyPrinted
let maxScore = 0


//Constants to refer to index of playerData
const ANSWER1 = 0
const ANSWER2 = 1
const SCORE = 2
const ROLE = 3

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

// function apiGetPrompt() {
const apiGetPrompt = () => {
    let hasGeneratedPrompt = false

    if (!hasGeneratedPrompt) {
        promptListMaker()
        hasGeneratedPrompt = true
    }

    console.log(listOfPrompts)
    let apiPrompt = listOfPrompts[Math.floor(Math.random() * listOfPrompts.length + 1)]

    gamePrompt = apiPrompt

    return apiPrompt
}

const apiGetChooser = (roomCode) => {
    listOfPlayers = Object.keys(roomData[roomCode])

    for (let i = 0; i < listOfPlayers.length; i++) {
        if (roomData[roomCode][listOfPlayers[i]][ROLE] === "chooser") {
            return listOfPlayers[i]
        }
    }
}

const apiGetTypers = (roomCode) => {
    listOfPlayers = Object.keys(roomData[roomCode])
    currentylChosen = apiGetChooser(roomCode)
    listOfTypers = []

    for (let i = 0; i < listOfPlayers.length; i++) {
        if (roomData[roomCode][listOfPlayers[i]][ROLE] !== "chooser") {
            listOfTypers.push(listOfPlayers[i])
        }

    }
    return listOfTypers
}

const apiGetPlayersAndRoles = (roomCode) => {
    listOfPlayers = Object.keys(roomData[roomCode])
    listOfPlayersAndRoles = {}

    for (let i = 0; i < listOfPlayers.length; i++) {
        listOfPlayersAndRoles[listOfPlayers[i]] = roomData[roomCode][listOfPlayers[i]][ROLE]
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
//             underscore_count++
//         }
//     }

//     //Only works for single blanks
//     if (underscore_count <= 1) {
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

// function apiJoinRoom(playerJoining, roomCode) {
const apiJoinRoom = (playerJoining, roomCode) => {
    roomCode = roomCode.toUpperCase()

    let listOfRoomCodes = Object.keys(roomData)

    if (listOfRoomCodes.includes(roomCode)) {
        let listOfPlayersInRoom = Object.keys(roomData[roomCode])

        listOfPlayersInRoom = listOfPlayersInRoom.map(element => {
            return element.toUpperCase()
        });

        if (playerJoining !== "") {
            if (!listOfPlayersInRoom.includes(playerJoining.toUpperCase)) {
                roomData[roomCode][playerJoining] = ["", "", 0, ""]
                return Object.keys(roomData[roomCode])
            } else {
                return "Name Taken"
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
    let listOfRoomCodes = Object.keys(roomData)

    while (listOfRoomCodes.includes(roomCode)) {
        roomCode = ""

        for (let i = 0; i < 4; i++) {
            let digit = Math.floor(Math.random() * 36)
            roomCode += allCharacters[digit]
        }
    }
    roomCode = roomCode.toUpperCase()

    roomData[roomCode] = {}
    if (playerCreating !== "") {
        roomData[roomCode][playerCreating] = ["", "", 0, ""]
    } else {
        return "Enter a Valid Name"
    }

    return roomCode
}

const apiLeftRoom = (playerLeaving, roomCode) => {
    let listOfRoomCodes = Object.keys(roomData)
    let listOfPlayers = Object.keys(roomData[roomCode])

    listOfPlayers = listOfPlayers.map(element => {
        return element.toUpperCase()
    });

    if (listOfPlayers.includes(playerLeaving.toUpperCase()) && listOfRoomCodes.includes(roomCode)) {
        delete roomData[roomCode][playerLeaving]
        return Object.keys(roomData[roomCode])
    }
}

const apiRemoveRoom = (roomCode) => {
    let listOfRoomCodes = Object.keys(roomData)

    roomCode = roomCode.toUpperCase()

    if (listOfRoomCodes.includes(roomCode)) {
        delete roomData[roomCode]
    }
}

module.exports = { apiGetPrompt, apiJoinRoom, apiCreateRoom, apiGetChooser, apiGetTypers, apiGetPlayersAndRoles, apiLeftRoom, apiRemoveRoom }

// TEST CODE TO CREATING AND JOINING A ROOM
tRoomCode = apiCreateRoom("john")
apiJoinRoom("milly", tRoomCode)
apiJoinRoom("dog", tRoomCode)
// console.log(roomData)
console.log(roomData[tRoomCode])
console.log(apiLeftRoom("milly", tRoomCode))
console.log(roomData[tRoomCode])
apiRemoveRoom(tRoomCode)
console.log(roomData)

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
    let _listOfPrompts = fs.readFileSync('listOfPrompts.txt', 'utf8')
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
//     if (underscore_count <= 1) {
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





function roleAssigner(roomCode) {
    listOfPlayers = Object.keys(roomData[roomCode])
    let toBeChosen = ""
    let thereIsAChooser = false

    for (let i = 0; i < listOfPlayers.length; i++) {
        roomData[roomCode][listOfPlayers[i]][ROLE] = "typer"
    }

    toBeChosen = listOfPlayers[chooserIndex]
    roomData[roomCode][toBeChosen][ROLE] = "chooser"

    for (let i = 0; i < listOfPlayers.length; i++) {
        if (roomData[roomCode][listOfPlayers[i]][ROLE] !== "chooser") {
            roomData[roomCode][listOfPlayers[i]][ROLE] = "typer"
        }
    }

    if (chooserIndex < listOfPlayers.length - 1) {
        chooserIndex++
    } else {
        chooserIndex = 0
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

//             if (underscore_count < 2) {
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

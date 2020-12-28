const callMe = () => {
  console.log("ayo?")
  return "ayo."
}

module.exports = { callMe }

socket.emit('new player'); // send a new player message to server
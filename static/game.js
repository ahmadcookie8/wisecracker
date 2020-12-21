var socket = io();
socket.on('message', function (data) {
  console.log(data);
});


//handle player movement

let movement = {
  up: false,
  down: false,
  left: false,
  right: false
}
document.addEventListener('keydown', function (event) {
  switch (event.keyCode) {
    case 65: // A
      movement.left = true;
      break;
    case 87: // W
      movement.up = true;
      break;
    case 68: // D
      movement.right = true;
      break;
    case 83: // S
      movement.down = true;
      break;
  }
});
document.addEventListener('keyup', function (event) {
  switch (event.keyCode) {
    case 65: // A
      movement.left = false;
      break;
    case 87: // W
      movement.up = false;
      break;
    case 68: // D
      movement.right = false;
      break;
    case 83: // S
      movement.down = false;
      break;
  }
});


socket.emit('new player'); // send a new player message to server

setInterval(function () {
  socket.emit('movement', movement); // set a movement message to server 60 times a second
}, 1000 / 60);


// draw game
const canvas = document.getElementById('canvas');
canvas.width = 800;
canvas.height = 600;
const context = canvas.getContext('2d');
socket.on('state', function (players) { // if this client receives a state message from the server
  context.clearRect(0, 0, 800, 600);
  for (let id in players) {
    const player = players[id];
    context.fillStyle = player.colour;
    context.beginPath();
    context.arc(player.x, player.y, 10, 0, 2 * Math.PI);
    context.fill();
  }
});
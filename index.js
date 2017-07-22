
// Setup a basic Express server
var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io')(server),
    port = process.env.PORT || 3000
    fs = require('fs'),
    numberOfUsers = 0,
    gameCollection;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
  fs.writeFile(__dirname + '/start.log', 'server started at ' + new Date());
});

// Setup routing
app.use(express.static(__dirname + '/public'));

// GameCollection object, that holds all games and info
gameCollection = new function () {
  this.totalGameCount = 0;
  this.gameList = {};
}

// Chatroom
io.on('connection', function (socket) {
  var addedUser = false;

  // When the client emits 'new message'
  socket.on('new message', function (data) {
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // When the client emits 'add user'
  socket.on('add user', function (username) {
    if (addedUser) {
      return;
    }

    socket.username = username;
    numberOfUsers += 1;
    addedUser = true;
    socket.emit('login', {
      numberOfUsers: numberOfUsers
    });

    // Echo to all clients (globally) that a user has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numberOfUsers: numberOfUsers
    });
  });

  // When the client emits 'typing'
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // When the client emits 'stop typing'
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // When the user disconnects
  socket.on('disconnect', function () {
    if (addedUser) {
      numberOfUsers -= 1;

      // Echo (globally) that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numberOfUsers: numberOfUsers
      });
    }
  });

  socket.on('makeGame', function () {
    var gameId = (Math.random() + 1).toString(36).slice(2, 18);
    console.log('Game created by ' + socket.username + ' w/' + gameId);
    gameCollection.gameList.gameId = gameId;
    gameCollection.gameList.gameId.playerOne = socket.username;
    gameCollection.gameList.gameId.open = true;
    gameCollection.totalGameCount += 1;

    io.emit('gameCreated' {
      username: socket.username,
      gameId: gameId
    });
  });
});

// Join a game
function joinGame(username, game) {
  if (game.playerTwo !== null) {
    game.playerTwo = username;
  } else {
    alert('Game ' + game.id + ' is full.');
  }
}

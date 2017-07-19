
// Setup a basic Express server
var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io')(server),
    port = process.env.PORT || 3000
    fs = require('fs'),
    numberOfUsers = 0;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
  fs.writeFile(__dirname + '/start.log', 'started');
});

// Setup routing
app.use(express.static(__dirname + '/public'));

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
});

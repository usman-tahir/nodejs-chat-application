$(function () {
  var FADE_TIME = 150,
      TYPING_TIMER_LENGTH = 400,
      COLORS = [
        '#e21400', '#91580f', '#f8a700', '#f78b00',
        '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
        '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
      ],
      $window = $(window),
      $usernameInput = $('.usernameInput'),
      $messages = $('.messages'),
      $inputMessage = $('.inputMessage'),
      $loginPage = $('.login.page'),
      $chatPage = $('.chat.page'),
      $createGame = $('.createGame'),
      $joinGame = $('.joinGame'),
      username,
      connected = false,
      typing = false,
      lastTypingTime,
      $currentInput = $usernameInput.focus(),
      socket = io();

  function addParticipantsMessage(data) {
    var message = '';

    if (data.numberOfUsers === 1) {
      message += 'There is currently 1 player logged in.';
    } else {
      message += 'There are currently ' + data.numberOfUsers + ' logged in.';
    }
    log(message);
  }

  // Sets the username for the client
  function setUsername () {
    username = cleanInput($usernameInput.val().trim());

    // If the username is valid
    if (username) {
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off('click');
      $currentInput = $inputMessage.focus();

      // Tell the server your username
      socket.emit('add user', username);
    }
  }

  // Send a chat message
  function sendMessage() {
    var message = $inputMessage.val();
    message = cleanInput(message);

    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({
        username: username,
        message: message
      });

      socket.emit('new message', message);
    }
  }

  // Log a message
  function log(message, options) {
    var $element = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  // Adds the visual chat message to the message list
  function addChatMessage(data, options) {
    var $typingMessages = getTypingMessages(data).
        $usernameDiv = $('<span class="username"/>'),
        $messageBodyDiv = $('<span class="messageBody">'),
        typingClass = data.typing ? 'typing' : '',
        $messageDiv = $('<li class="message"/>');

    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

    $usernameDiv
      .text(data.username)
      .css('color', getUsernameColor(data.username));

    $messageBodyDiv
      .text(data.message);

    $messageDiv
      .data('username', data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
  }

  // Adds the visual chat typing message
  function addChatTyping(data) {
    data.typing = true;
    data.message = 'is typing';

    addChatMessage(data);
  }

  // Remove the visual chat typing message
  function removeChatTyping(data) {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }

  // Adds a message element to the messages, and scrolls to the bottom element
  function addMessageElement(element, options) {
    var $element = $(element);

    if (!options) {
      options = {};
    }

    if (typeof options.fade === 'undefined') {

      options.fade = true;
    }

    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply the options
    if (options.fade) {
      $messages.prepend($element);
    } else {
      $messages.append($element);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  // Prevent the input from having injected markup
  function cleanInput(input) {
    return $('<div/>').text(input).text();
  }

  // Update the typing event
  function updateTyping() {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(function () {
        var typingTimer = (new Date()).getTime(),
            timeDifference = typingTimer - lastTypingTime;

        if (timeDifference >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  // Creates the 'X is typing' message for a user
  function getTypingMessages(data) {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }

  // Gets the color of a username through a hash function
  function getUsernameColor(username) {
    // Compute the hash code
    var hash = 7,
        index,
        i;

    for (i = 0; i < username.length; i += 1) {
      hash = username.charCodeAt(i) + (hash << 5) - hash;
    }

    // Calculate the color
    index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  /* Keyboard events */

  $window.keydown(function (event) {
    // Autofocus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }

    // When the client hits ENTER
    if (event.which === 13) {
      if (username) {
        sendMessage();
        socket.emit('stop typing');
        typing = false;
      } else {
        setUsername();
      }
    }
  });

  $inputMessage.on('input', function() {
    updateTyping();
  });

  /* Click events */

  // Focus input when clicking anywhere on the login page
  $loginPage.click(function () {
    $currentInput.focus();
  });

  // Focus input when clicking on the message input's border
  $inputMessage.click(function () {
    $inputMessage.focus();
  });

  $createGame.click(function () {
    sendGame();
  });

  /* Socket events */

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;

    // Display the welcome message
    var message = 'Welcome to the Game Server ';
    log(message, {
      prepend: true
    });
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    log(data.username + ' joined');
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', function (data) {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', function (data) {
    removeChatTyping(data);
  });

  // Upon creating a game
  socket.on('gameCreated', function (data) {
    console.log('Game Created. ID is: ' + data.gameId);
    log(data.username + ' created Game ' + data.gameId);
  });

  function sendGame() {
    socket.emit('makeGame');
  };
});

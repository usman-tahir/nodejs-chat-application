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
});

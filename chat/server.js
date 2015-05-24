var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var base = require('./server/base');
var HashMap = require('hashmap');

var clients = new HashMap();

app.set('port', (process.env.PORT || 5000));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/*', function(req, res) {
  res.sendFile(__dirname + '/public' + req.url);
});

io.on('connection', function(socket) {
  // Keeps track of all active users.
  socket.on('user-connect', function(data) {
    clients.set(socket, data);
    io.sockets.emit('update-online-users', clients.values());
    socket.broadcast.emit('user-send-chat',
            base.getTimeStamp() + data +
            ' has connected to the chat room.');
  });

  // Assembles data and relays chat to all active users.
  // The server should do as little computation as possible and
  // simply act as a relay.
  socket.on('user-send-chat', function(data) {
    io.sockets.emit('user-send-chat',
            base.getTimeStamp() + data.name + ': ' + data.message);
  });

  // Removes users once they disconnect.
  socket.on('disconnect', function() {
    if (clients.has(socket)) {
      clients.remove(socket);
      socket.broadcast.emit('update-online-users', clients.values());
    }
  });
});

http.listen(app.get('port'), function() {
  console.log("Listening on port " + app.get('port'));
});

var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port      = process.env.OPENSHIFT_NODEJS_PORT || 9000;

var WebSocketServer = require('ws').Server
var http = require('http');

var clients = [];

var server = http.createServer(function(request, response) {
    Log('Received request for ' + request.url);
});

server.listen( port, ipaddress, function() {
    Log('Server is listening on port ' + port);
});

wss = new WebSocketServer({
    server: server,
    autoAcceptConnections: false
});

wss.on('connection', function(ws) {
  Log("Connected: " + ws.origin);

  ws.on('message', function (message) {
     Log("New message received: " + message);
     message = JSON.parse(message);

     if (message.type === 'register') {
          Log("Registering user: " + message.id);
          clients.push({ id: message.id, connection: ws });
     } else {
          for (var i = 0; i < clients.length; i++) {
              if (clients[i].id === message.to || clients[i].id === message.from || message.to === 'all') {
                  if (clients[i].connection.readyState === 1) {
                      Log("Sending to: " + clients[i].id);
                      clients[i].connection.send(JSON.stringify(message));
                  } else {
                      clients.splice(clients.indexOf(clients[i]), 1);
                  }
              }
          }
     }
  });

});

wss.on('close', function (ws) {
   for (var i = 0; i < clients.length; i++) {
      if (clients[i].connection == ws) {
         Log("Killing connection with: " + clients[i].id);
         clients.splice(clients.indexOf(clients[i]), 1);
         Log('Disconnected: ' + ws);
      }
   }
});

function Log(message) {
    var date = new Date();
    var dateFormat = date.getFullYear() + "-" + fixZero(date.getMonth() + 1) + "-" + fixZero(date.getDay()) + " " +
        fixZero(date.getHours()) + ":" + fixZero(date.getMinutes()) + ":" + fixZero(date.getSeconds());

    console.log(dateFormat + ': ' + message);
}

function fixZero(i) {
    return i < 10 ? '0' + i : i;
}

console.log("Listening to " + ipaddress + ":" + port + "...");
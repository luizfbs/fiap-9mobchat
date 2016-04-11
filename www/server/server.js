var webSocketsServer = require('websocket').server;
var http = require('http');

var webSocketsServerPort = 8080;
var clients = [];

var server = http.createServer(function (request, response) {

});

server.listen(webSocketsServerPort, function () {
    Log("Server is listening on port " + webSocketsServerPort);
});

var wsServer = new webSocketsServer({
    httpServer: server
});

wsServer.on('request', function (request) {
    var connection = request.accept(null, request.origin);
    Log("Connected: " + request.origin);
   
    connection.on('message', function (message) {
        Log("New message: " + message.utf8Data);

        if (message.type === 'utf8') {
            var data = JSON.parse(message.utf8Data);

            if (data.type === 'register') {
                Log("Registering user: " + data.id);
                clients.push({ id: data.id, connection: connection });
            } else {
                for (var i = 0; i < clients.length; i++) {
                    if (clients[i].id === data.to || clients[i].id === data.from) {
                        Log("Sending message to: " + clients[i].id);
                        clients[i].connection.sendUTF(message.utf8Data);
                    }
                }
            }
        }
    });

    connection.on('close', function (connection) {
        for (var i = 0; i < clients.length; i++) {
            if (clients[i].connection == connection) {
                Log("Killing connection with: " + clients[i].id);
                clients.splice(clients[i]);
                Log('Disconnected: ' + connection);
            }
        }
    });
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
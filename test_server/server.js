/*jslint undef: true, unparam: true, sloppy: true, maxerr: 50, indent: 4 */


var io = require('socket.io').listen(1001);
io.configure(function () {
	io.set('transports', ['jsonp-polling']);
});



var express = require('express');

function broadcastMessage(project, message) {
	io.sockets.emit('pipe', {project: project, message: JSON.parse(message)});
}

io.sockets.on('connection', function (socket) {
	console.log("got connection: " + socket);
});


//Create the simple webserver
var app = express.createServer();
app.use(express.bodyParser());

app.post('/project/:project', function (req, res) {
	console.log(req);
	broadcastMessage(req.params.project, req.body.message);
	res.send('status: ok');
});

app.listen(1000);
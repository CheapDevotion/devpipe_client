/*jslint undef: true, unparam: true, sloppy: true, maxerr: 50, indent: 4 */
String.prototype.capitalize = function(){
   return this.replace( /(^|\s)([a-z])/g , function(m,p1,p2){ return p1+p2.toUpperCase(); } );
  };

String.prototype.addSpaces = function(){
   return this.replace(/([a-z])([A-Z])/g, '$1 $2');
  };

var io = require('socket.io').listen(1001);
io.configure(function () {
	io.set('transports', ['jsonp-polling']);
});



var express = require('express');

function broadcastMessage(project, message) {
	io.sockets.emit('pipe', {project: project, message: JSON.parse(message)});
}

//Create the simple webserver
var app = express.createServer();
app.use(express.bodyParser());

app.post('/project/:project', function (req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	var project = req.params.project.replace(/_/g, " ");
	project = project.capitalize();
	project = project.addSpaces();
	for (i in req.body){
			broadcastMessage(project, req.body[i]);
	}
	res.send('status: ok');
});

app.listen(1000);
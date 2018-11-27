const credentials = require('./credentials');
const express = require('express');
const app = express();
let broadcaster;
let server;
let port;
console.log('start')
if (credentials.key && credentials.cert) {
  const https = require('https');
  server = https.createServer(credentials, app);
  port = 4431;
} else {
  console.log('ss')
  const http = require('http');
  server = http.createServer(app);
  port = 3000;
}
const io = require('socket.io').listen(server);
const broadcasters = {};
app.use(express.static(__dirname + '/public'));
io.on('error', e => console.log(e));
io.on('connection', function (socket) {
  console.log('connect')
  socket.on('broadcaster', function () {
    console.log('connect')
    broadcaster = socket.id;
    broadcasters[socket.id] = socket.id;
    console.log(broadcasters)
    socket.broadcast.emit('broadcaster');
  });
  socket.on('watcher', function () {
    broadcaster && socket.to(broadcaster).emit('watcher', socket.id);
  });
  socket.on('offer', function (id /* of the watcher */, message) {
    socket.to(id).emit('offer', socket.id /* of the broadcaster */, message);
  });
  socket.on('answer', function (id /* of the broadcaster */, message) {
    socket.to(id).emit('answer', socket.id /* of the watcher */, message);
  });
  socket.on('candidate', function (id, message) {
    socket.to(id).emit('candidate', socket.id, message);
  });
  socket.on('disconnect', function () {
    console.log('bye!')
    delete broadcasters[socket.id]

    console.log(broadcasters)

    broadcaster && socket.to(broadcaster).emit('bye', socket.id);
    socket.broadcast.emit('bye', socket.id);
  });

  socket.on('torch',function(){
    console.log('torch')
    socket.broadcast.emit('torch');

  })
});
server.listen(port, () => console.log(`Server is running on port ${port}`));

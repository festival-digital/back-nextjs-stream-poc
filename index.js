const express = require('express');
const app = express()
const server = require('http').Server(app);
const path = require('path');
const io = require('socket.io')(server);

let clients = [];

app.get('/', (req, res) => {
  res.send(200);
});

console.log('clients:', clients)

io.on('connection', (socket) => {
  socket.on('room/set-visitant', ({ stream_id }) => {
    clients.push({ socket_id: socket.id, stream_id });
    socket.emit("room/update", clients.filter(st => st.socket_id !== socket.id));
  });
  socket.on("room/signal", payload => {
    console.log('\n\nroom/signal\n\n\n\n')
    io.to(payload.userToSignal).emit('room/user-joined', { signal: payload.signal, callerID: payload.callerID });
  });
  socket.on("room/signal-back", payload => {
    io.to(payload.callerID).emit('room/signal-answer-back', { signal: payload.signal, id: socket.id });
  });
  socket.on('disconnect', () => {
    clients = clients.filter(st => st.socket_id !== socket.id);
  });
});


server.listen(4200);

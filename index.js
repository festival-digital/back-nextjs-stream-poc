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
  console.log(' => connect')
  socket.on('room/set-visitant', ({ stream_id }) => {
    clients.push({ socket_id: socket.id, stream_id });
    socket.emit("room/update", clients.filter(st => st.socket_id !== socket.id));
  });
  socket.on("room/signal", payload => {
    console.log('payload.userToSignal', payload.userToSignal);
    io.to(payload.userToSignal).emit('room/user-joined', { signal: payload.signal, callerID: payload.callerID });
  });
  socket.on("room/signal-back", payload => {
    console.log('payload.callerID', payload.callerID);
    io.to(payload.callerID).emit('room/signal-answer-back', { signal: payload.signal, id: socket.id });
  });
  socket.on('disconnect', () => {
    console.log(' => disconnect')
    console.count('step')
    console.log('----------------')
    clients = clients.filter(st => st.socket_id !== socket.id);
    io.emit("room/update", clients.filter(st => st.socket_id !== socket.id));
  });
});


server.listen(process.env.PORT || 8080);

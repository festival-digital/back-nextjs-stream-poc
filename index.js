import express from 'express';
// import fs from 'fs';
import http from 'http'
import socket from 'socket.io'
// import path from 'path';
import Mongodb from './db/Mongodb';
import { enterRoom, receiveAudio } from './src/stream.functions';

const app = express();
const server = http.Server(app);
const io = socket(server);
// const getStat = require('util').promisify(fs.stat);

let myId = null;

app.get('/', (req, res) => {
  res.send(200);
});

// app.get('/audio', async (req, res) => {
//   // console.log("io", io.sockets)
//   // Object.keys(io.engine.clients);
//   console.log("Object.keys(io.engine.clients)", Object.keys(io.engine.clients))
//   const filePath = 'tmp/'+path.basename('user#'+Object.keys(io.engine.clients)[0]+'-stream.wav');
//     const stat = await getStat(filePath);
//     console.log(stat);    

//     // informações sobre o tipo do conteúdo e o tamanho do arquivo
//     res.writeHead(200, {
//         'Content-Type': 'audio/wav',
//         'Content-Length': stat.size
//     });

//     const stream = fs.createReadStream(filePath);

//     // só exibe quando terminar de enviar tudo
//     stream.on('end', () => console.log('acabou'));

//     // faz streaming do audio 
//     stream.pipe(res);
//   res.send(200);
// });


io.on('connection', async (socket) => {
  const db = await Mongodb({});
  console.log(' => connect', socket.id);
  const person = await db.model('watcher').create({ socket_id: socket.id });
  // console.log("person", person)
  
  socket.on('enter_room', async (data) => enterRoom(data, { socket, io, db, person }));
  
  socket.on('audio', async (data) => receiveAudio(data, { io }));

  socket.on("room/signal", payload => {
  console.log('room/signal');
    io.to(payload.userToSignal).emit('room/user-joined', { signal: payload.signal, callerID: socket.id });
  });
  socket.on("room/signal-back", payload => {
  console.log('room/signal-back');
    io.to(payload.callerID).emit('room/signal-answer-back', { signal: payload.signal, id: socket.id });
  });
  
  socket.on('disconnect', async () => {
    console.log("person._id", person._id);
    const leftFrom = await db.model('room').findOneAndUpdate({ participants: { $in: [person._id] }}, { $pull: { participants: person._id }}, { new: true }).populate('participants');
    if (!leftFrom) return;
    await db.model('watcher').deleteOne({ socket_id: person._id });
    console.log("leftFrom", leftFrom)
    io.to(leftFrom.room_id).emit('participants', leftFrom);
  });
});

// socket.on('update_name', async ({ name }) => {
//   await db.model('watcher').findOneAndUpdate({ _id: person._id }, { name });
//   console.log("---in---   "+room_id);
// });

server.listen(process.env.PORT || 8080, () => {
  console.log(`Listening on port ${process.env.PORT || 8080}`)
});
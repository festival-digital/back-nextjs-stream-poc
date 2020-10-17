const express = require('express');
const ss = require("socket.io-stream");
const fs = require('fs');
const app = express()
const server = require('http').Server(app);
const path = require('path');
const Mongodb = require('./db/Mongodb');
const io = require('socket.io')(server);
const getStat = require('util').promisify(fs.stat);

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
  console.log("person", person)
  
  socket.on('enter_room', async ({ room_id, name }) => {
    socket.join(room_id);
    let room = await db.model('room').findOne({ room_id });
    if (!room) {
      const sala = await db.model('room').create({ room_id, participants: [person._id] });
    } else {
      const sala = await db.model('room').findOneAndUpdate({ room_id }, { $push: { participants: person._id }});
    }
    const pessoa = await db.model('watcher').findOneAndUpdate({ _id: person._id }, { name });
    console.log("---in---   " + room_id);
    // io.to(room_id).emit('user_joined', { id: socket.id, name });
    const participants = await db.model('room').findOne({ room_id }).populate('participants');
    console.log("participants length", participants.length)

    console.log("participants", participants);
    io.to(room_id).emit('participants', participants);
  });
  
  socket.on('update_name', async ({ name }) => {
    await db.model('watcher').findOneAndUpdate({ _id: person._id }, { name });
    console.log("---in---   "+room_id);
  });
  
  socket.on('audio', async ({ room_id, blob, streamer_id }) => {
    if (!room_id) return;
    console.log("------a");
    io.to(room_id).emit('voice', { id: streamer_id, data: blob });
  });
  
  socket.on('image', async ({ room_id, blob, streamer_id }) => {
    if (!room_id) return;
    console.log("i------");
    io.to(room_id).emit('video', { id: streamer_id, data: blob });
  });
  socket.on('disconnect', async () => {
    console.log("person._id", person._id);
    const leftFrom = await db.model('room').findOneAndUpdate({ participants: { $in: [person._id] }}, { $pull: { participants: person._id }}, { new: true }).populate('participants');
    await db.model('watcher').deleteOne({ socket_id: person._id });
    console.log("leftFrom", leftFrom)
    io.to(leftFrom.room_id).emit('participants', { room: leftFrom });;

  });
});


server.listen(process.env.PORT || 8080);
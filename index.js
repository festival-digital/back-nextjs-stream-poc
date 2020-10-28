const express = require('express');
const app = express()
const server = require('http').Server(app);
const path = require('path');
const cors = require('cors');
const io = require('socket.io')(server);

const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;
const bodyParser = require('body-parser')

app.use(cors())
app.use(bodyParser.json({ type: 'application/json' }));


const personModel = new mongoose.Schema({
  socket_id: { type: String, required: true },
  name: { type: String },
}, {
  usePushEach: true,
  timestamps: { updatedAt: 'updated_at', createdAt: 'created_at' },
});

const roomModel = new mongoose.Schema({
  room_id: { type: String },
  type: { type: String },
  participants: [{ type: ObjectId, ref: 'watcher' }],
}, {
  usePushEach: true,
  timestamps: { updatedAt: 'updated_at', createdAt: 'created_at' },
});

const mongodb = async function ({ mongoUrl = 'mongodb+srv://stream:X2XxXQzIFHA7PlKJ@feiradigital.wqkom.mongodb.net/feiradigital?retryWrites=true&w=majority' }) {
  console.log('mongoUrl: ', mongoUrl);
  console.log('mongodb+srv://stream:jTKBFXzkQvheO743@feiradigital.wqkom.mongodb.net/feiradigital?retryWrites=true&w=majority');
  try {
    console.log('=> using new database connection');

    const newConnection = await mongoose.createConnection(mongoUrl, {
      bufferCommands: false,
      bufferMaxEntries: 0,
      keepAlive: true,
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });

    newConnection.model('watcher', personModel);
    newConnection.model('room', roomModel);
    return newConnection;
  } catch (err) {
    console.log('error: ', [err]);
    throw err;
  }
};

const enterRoom = async ({ room_id, name, type }, { socket, io, db, person }) => {
  // console.log('enterRoom -> type', );
  // join room
  socket.join(room_id);
  
  // Update client
  const client = await db.model('watcher').findOneAndUpdate({ _id: person._id }, { name });

  // Find room in our DB
  let room = await db.model('room').findOne({ room_id, type }).populate('participants');
  // console.log('enterRoom -> room', room);

  // Update or create room
  if (!room) {
    room = await db.model('room').create({ room_id, participants: [person._id], type }).then(o => o
      .populate('participants')
      .execPopulate())
    .catch((err) => {
      throw new Error(err);
    });
    // console.log('enterRoom - create -> room ', room);
  } else {
    room = await db.model('room').findOneAndUpdate({ room_id, type }, { $push: { participants: person._id }}, { new: true }).populate('participants');
    // console.log('enterRoom - update -> room', room);
  }

  console.log("---in---   " + room_id);

  // Emit update participants to all clients in room
  if (type === 'peer') {
    console.log('\n\n peer\n\n');
    socket.emit('participants', room);
  }
  if (type === 'voice') {
    io.to(room_id).emit('participants', client);
    console.log('\n\n voice\n\n');
  }
  const rooms = await db.model('room').find({}).populate('participants');
  io.emit('updated_rooms', rooms);
}

const receiveAudio = ({ room_id, blob, streamer_id }, { io }) => {
  if (!room_id) return;
  console.log("------a");
  io.to(room_id).emit('voice', { id: streamer_id, data: blob });
}

let clients = [];

app.get('/', (req, res) => {
  res.send(200);
});

app.get('/get-rooms', async (req, res) => {
  const db = await mongodb({});
  const rooms = await db.model('room').find({}).populate('participants');
  console.log('rooms', rooms);
  res.type('application/json');
  res.status(404).send(JSON.stringify({
    rooms: rooms || [],
  }));
});

console.log('clients:', clients)

io.on('connection', async (socket) => {
  const db = await mongodb({});
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
    const rooms = await db.model('room').find({}).populate('participants');
    io.emit('updated_rooms', rooms);
  });
});


server.listen(process.env.PORT || 8080);

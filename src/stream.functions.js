export const enterRoom = async ({ room_id, name, type }, { socket, io, db, person }) => {
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

}


export const receiveAudio = ({ room_id, blob, streamer_id }, { io }) => {
  if (!room_id) return;
  console.log("------a");
  io.to(room_id).emit('voice', { id: streamer_id, data: blob });
}
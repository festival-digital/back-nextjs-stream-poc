const { Schema } = require('mongoose');

const { ObjectId } = Schema.Types;

const roomModel = new Schema({
  room_id: { type: String },
  participants: [{ type: ObjectId, ref: 'watcher' }],
}, {
  usePushEach: true,
  timestamps: { updatedAt: 'updated_at', createdAt: 'created_at' },
});

module.exports = roomModel;

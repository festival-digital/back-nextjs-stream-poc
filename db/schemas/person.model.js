const { Schema } = require('mongoose');

const personModel = new Schema({
  socket_id: { type: String, required: true },
  name: { type: String },
}, {
  usePushEach: true,
  timestamps: { updatedAt: 'updated_at', createdAt: 'created_at' },
});

module.exports = personModel;

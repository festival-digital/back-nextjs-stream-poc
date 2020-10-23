// const mongoose = require('mongoose');
// const person = require('./schemas/person.model');
// const room = require('./schemas/room.model');


// mongoose.Promise = global.Promise;

module.exports = async function ({ conn, mongoUrl = 'mongodb+srv://stream:X2XxXQzIFHA7PlKJ@feiradigital.wqkom.mongodb.net/feiradigital?retryWrites=true&w=majority' }) {
  // console.log('mongoUrl: ', mongoUrl);
  // console.log('mongodb+srv://stream:jTKBFXzkQvheO743@feiradigital.wqkom.mongodb.net/feiradigital?retryWrites=true&w=majority');
  // try {
  //   console.log('=> using new database connection');

  //   const newConnection = await mongoose.createConnection(mongoUrl, {
  //     bufferCommands: false,
  //     bufferMaxEntries: 0,
  //     keepAlive: true,
  //     useUnifiedTopology: true,
  //     useNewUrlParser: true,
  //   });

  //   newConnection.model('watcher', person);
  //   newConnection.model('room', room);
  //   return newConnection;
  // } catch (err) {
  //   console.log('error: ', [err]);
  //   throw err;
  // }
};

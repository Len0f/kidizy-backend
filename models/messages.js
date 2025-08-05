const mongoose = require('mongoose');




const messagesSchema = mongoose.Schema({
idUser: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
content: String,
createdAt: Date,
updatedAt: Date
});

const Messages = mongoose.model('conversations', messagesSchema);

module.exports = Messages;
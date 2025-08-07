const mongoose = require('mongoose');




const messagesSchema = mongoose.Schema({
idUser: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
message: String,
conversationId:{ type: mongoose.Schema.Types.ObjectId, ref: 'conversations' },
createdAt: {type: Date, required: true, default:()=> new Date()},
updatedAt: Date
});

const Messages = mongoose.model('messages', messagesSchema);

module.exports = Messages;
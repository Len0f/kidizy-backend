const mongoose = require('mongoose');




const conversationsSchema = mongoose.Schema({
idUserParent: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
idUserBabysitter: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
lastOpenDate: Date,
createdAt: {type: Date, required: true, default:()=> new Date()},
updatedAt: Date
});

const Conversations = mongoose.model('conversations', conversationsSchema);

module.exports = Conversations;
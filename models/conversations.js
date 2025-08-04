const mongoose = require('mongoose');




const conversationsSchema = mongoose.Schema({
idUserParent: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
idUserBabysitter: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
lastOpenDate: Date,
createdAt: Date,
updatedAt: Date
});

const Conversations = mongoose.model('conversations', conversationsSchema);

module.exports = Conversations;
const mongoose = require('mongoose');

const propositionsSchema = mongoose.Schema({
idUserParent: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
idUserBabysitter: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
propoStart: Date,
propoEnd: Date,
createdAt: Date,
updatedAt: Date,
rating: Number,
comment: String,
opinionParent: String,
opinionBabysitter: String,
isAccepted: Boolean,

});

const Propositions = mongoose.model('conversations', propositionsSchema);

module.exports = Propositions;
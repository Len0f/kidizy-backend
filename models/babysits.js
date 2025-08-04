const mongoose = require('mongoose');




const babysitSchema = mongoose.Schema({
idUserParent: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
idUserBabysitter: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
realStart: Date,
realEnd: Date,
proposion: { type: mongoose.Schema.Types.ObjectId, ref: 'propositions' }
});

const Babysits = mongoose.model('babysits', babysitSchema);

module.exports = Babysits;
const mongoose = require('mongoose');

const propositionsSchema = mongoose.Schema({
idUserParent: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
idUserBabysitter: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
propoStart: String,
avatar: String,
propoEnd: String,
day:String,
kids:Number,
firstName: String,
lastName:String,
createdAt: {type: Date, required: true, default:()=> new Date()},
updatedAt: Date,
comment: String,
opinionParent: String,
opinionBabysitter: String,
isAccepted:  {type:String, enum: ['ACCEPTED','REFUSED','PENDING','NEGOCIATING'], required: true,default: 'PENDING' }
})




const Propositions = mongoose.model('propositions', propositionsSchema);

module.exports = Propositions;
const mongoose = require('mongoose');

const parentInfosShema =mongoose.Schema({
    kids: Number,
    subscription: Boolean
})

const babysitterInfosShema =mongoose.Schema({
    CNI: String,
    criminalRecord: String,
    age: String,
    price: Number,
    bio: String,
    availability: Date,
    interest: String,
    isDocOk: Boolean,
    situation: String,
    jackpot: Number
})

const usersSchema = mongoose.Schema({
	token: String,
    email: String,
    password: String,
    lastName: String,
    firsName:String,
    phone:String,
    location: {lat: String, lon: String},
    avatar: String,
    createdAt : Date,
    updatedAt: Date,
    rating: Number,
    babysits: Number,
    conversations: { type: mongoose.Schema.Types.ObjectId, ref: 'conversations' },
    isValidated: Boolean,
    parentInfos: parentInfosShema,
    babysitterInfos: babysitterInfosShema,
});


const Users = mongoose.model('users', usersSchema);

module.exports = Users;
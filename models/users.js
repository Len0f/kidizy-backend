const mongoose = require('mongoose');

const parentInfosSchema =mongoose.Schema({
    kids: [{firstName:String, age:String}],
    subscription: Boolean
})

const babysitterInfosSchema =mongoose.Schema({
    CNI: String,
    criminalRecord: String,
    age: String,
    price: Number,
    bio: String,
    availability: Date,
    interest: String,
    isDocOk: {type :Boolean, required: true, default: false},
    situation: String,
    jackpot: {type: Number, required: true, default: 0}
})

const usersSchema = mongoose.Schema({
	token: String,
    email: String,
    password: String,
    lastName: String,
    firstName:String,
    phone:String,
    location: {lat: String, lon: String, address:String},
    avatar: String,
    createdAt : Date,
    updatedAt: Date,
    rating: Number,
    babysits: Number,
    conversations: { type: mongoose.Schema.Types.ObjectId, ref: 'conversations' },
    isValidated: Boolean,
    parentInfos: parentInfosSchema,
    babysitterInfos: babysitterInfosSchema,
    role: {type:String, enum: ['PARENT','BABYSITTER','PENDING'], required: true,default: 'PENDING' }
});


const Users = mongoose.model('users', usersSchema);

module.exports = Users;
var express = require('express');
var router = express.Router();
var Message = require('../models/messages')
var User = require('../models/users')

const Pusher = require('pusher');
const { checkBody } = require('../modules/checkBody');
const pusher = new Pusher({
  appId: process.env.PUSHER_APPID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// Join chat
router.put('/:token', (req, res) => {
  pusher.trigger('chat', 'join', {
    token: req.params.token,
  });

  res.json({ result: true });
});

// Leave chat
router.delete("/:token", (req, res) => {
  pusher.trigger('chat', 'leave', {
    token: req.params.token,
  });

  res.json({ result: true });
});

// Send message
router.post('/', async (req, res) => {
    if (!checkBody(req.body,['message'])){
        return res.json('Message field empty')
    }
pusher.trigger('chat', 'message', req.body);
  const newMessage= new Message({
    idUser: await User.findOne({token: req.body.token}).then(data=>data._id),
    message: req.body.message,
    createdAt: req.body.createdAt,
    updatedAt: new Date()
  })
  newMessage.save()


  res.json({ result: true });
});

router.get('/:token',async (req,res)=>{
    if(!checkBody(req.params,['token'])){
        return res.json('token absent')
    }
    const userFund = await User.findOne({token: req.params.token})
    if (!userFund){
        return res.json('User not found')
    }
    const messagesUser = await Message.find({idUser: userFund._id}).select('createdAt message token updatedAt')
    res.json({messagesUser})
})

module.exports = router;

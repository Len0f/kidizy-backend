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
    idUser: req.body.idUser,
    message: req.body.message
  })
  newMessage.save()


  res.json({ result: true });
});

router.get('/',async (req,res)=>{
    if(!checkBody(req.query,['token','conversation'])){
        return res.json('token absent')
    }
    const existingUser = await User.findOne({token: req.query.token})
    if (!existingUser){
        return res.json('User not found')
    }
    const messagesUser = await Message.find({conversationId: req.query.conversation}).select('createdAt message updatedAt idUser')
    res.json({messagesUser})
})

module.exports = router;

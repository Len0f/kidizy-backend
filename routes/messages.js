var express = require('express');
var router = express.Router();
var Message = require('../models/messages')
var User = require('../models/users')

const Pusher = require('pusher');
const pusher = new Pusher({
  appId: process.env.PUSHER_APPID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// Join chat
router.put('/:username', (req, res) => {
  pusher.trigger('chat', 'join', {
    username: req.params.username,
  });

  res.json({ result: true });
});

// Leave chat
router.delete("/:username", (req, res) => {
  pusher.trigger('chat', 'leave', {
    username: req.params.username,
  });

  res.json({ result: true });
});

// Send message
router.post('/', async (req, res) => {
pusher.trigger('chat', 'message', req.body);
  const newMessage= new Message({
    idUser: await User.findOne({token: req.body.token}).then(data=>data._id),
    content: req.body.content,
    createdAt: req.body.createdAt,
    updatedAt: req.body.updatedAt
  })
  newMessage.save()


  res.json({ result: true });
});

module.exports = router;

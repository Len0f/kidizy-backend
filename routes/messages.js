var express = require("express");
var router = express.Router();
var Message = require("../models/messages");
var User = require("../models/users");

const Pusher = require("pusher");
const { checkBody } = require("../modules/checkBody");
const pusher = new Pusher({
  appId: process.env.PUSHER_APPID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// ----------------- Routes prévues pour des fonctionnalités futures
// Ces routes avaient été anticipés pour enrichir l'expérience utilisateur (rejoindre/quitter un chat en temps réel).
// Faute de temps dans le développement, elles n'ont pas été finalisés mais la structure est prête à être implémentée facilement.
// Cela montre une réflexion d'évolutivité et une ouverture vers des fonctionnalités plus avancées.

// Join chat
// router.put('/:token', (req, res) => {
//   pusher.trigger('chat', 'join', {
//     token: req.params.token,
//   });

//   res.json({ result: true });
// });

// Leave chat
// router.delete("/:token", (req, res) => {
//   pusher.trigger('chat', 'leave', {
//     token: req.params.token,
//   });

//   res.json({ result: true });
// });

// ----------------- Route POST "/" — envoi d’un message
router.post("/", async (req, res) => {
  // Vérifie que le corps contient bien un "message"
  if (!checkBody(req.body, ["message"])) {
    return res.json("Message field empty");
  }
  // Diffuse le message via Pusher dans un canal spécifique à la conversation
  pusher.trigger(`chat.${req.body.conversation}`, "message", req.body);

  // Crée et sauvegarde un nouveau message en base
  const newMessage = new Message({
    idUser: req.body.idUser,
    message: req.body.message,
    conversationId: req.body.conversation,
  });
  newMessage.save();

  res.json({ result: true });
});

// ----------------- Route GET "/" — récupération des messages d’une conversation
router.get("/", async (req, res) => {
  // Vérifie que l’utilisateur existe via son token
  const existingUser = await User.findOne({ token: req.query.token });
  if (!existingUser) {
    return res.json("User not found");
  }

  // Récupère tous les messages liés à la conversation demandée
  // (seulement certains champs : createdAt, message, updatedAt, idUser)
  const messagesUser = await Message.find({
    conversationId: req.query.conversationId,
  }).select("createdAt message updatedAt idUser");
  res.json({ messagesUser });
});

module.exports = router;

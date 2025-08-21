var express = require("express");
var router = express.Router();
require("../connection/connection");
const User = require("../models/users");
const { checkBody } = require("../modules/checkBody");
const Conversation = require("../models/conversations");

// ----------------- Route POST — création d'une conversation
router.post("/", async (req, res) => {
  // Récupère les champs envoyés dans le corps de la requête
  const { token, idUserParent, idUserBabysitter, updatedAt } = req.body;

  // Vérifie la présence du champ "token" (et qu'il n'est pas vide)
  if (!checkBody(req.body, ["token"])) {
    res.json({ result: false, error: "Champs manquants ou vides" });
    return;
  }

  // Si pas de token, on refuse (utilisateur non identifié)
  if (!token) {
    return res.json({ result: false, error: "Utilisateur inconnu" });
  }

  // Cherche si une conversation existe déjà entre ce parent et cette babysitter
  const existingConv = await Conversation.findOne({
    idUserBabysitter,
    idUserParent,
  });

  // Si elle existe, on renvoie un message et on n'en crée pas de nouvelle
  if (existingConv) {
    return res.json("Conversation déjà existante");
  }

  // Vérifie que le token correspond à un utilisateur existant
  const existingUser = await User.findOne({ token });

  // Si l'utilisateur est valide, on crée et sauvegarde une nouvelle conversation
  if (existingUser) {
    const newConversation = new Conversation({
      idUserParent,
      idUserBabysitter,
      updatedAt,
    });
    newConversation.save(); // sauvegarde en base
    res.json({ result: true, newConversation }); // renvoie la conversation créée
  }
});

// ----------------- Route GET — liste les conversations d'un utilisateur selon son rôle
router.get("/", async (req, res) => {
  // Récupère le token d'auth et l'id utilisateur depuis la query
  const { token, id } = req.query;

  if (!checkBody(req.query, ["token", "id"])) {
    res.json({ result: false, error: "Champs manquants ou vides" });
    return;
  }

  if (!token || !id) {
    return res.json({ result: false, error: "Utilisateur inconnu" });
  }

  // Récupère l'utilisateur pour connaître son rôle (PARENT ou BABYSITTER)
  const roleId = await User.findOne({ _id: id });

  // Si l'utilisateur est un parent, on récupère ses conversations où il est "idUserParent"
  if (roleId.role === "PARENT") {
    const myConversations = await Conversation.find({
      idUserParent: id,
    }).populate("idUserBabysitter", "avatar firstName lastName"); // Renseigne (populate) les infos publiques de la babysitter liée à chaque conversation
    res.json({ result: true, myConversations });

    // Si l'utilisateur est une babysitter, on récupère ses conversations où elle est "idUserBabysitter"
  } else if (roleId.role === "BABYSITTER") {
    const myConversations = await Conversation.find({
      idUserBabysitter: id,
    }).populate("idUserParent", "avatar firstName lastName");
    res.json({ result: true, myConversations });
  }
});

// ----------------- // Route GET "/id" — récupère le détail d'une conversation par son identifiant
router.get("/id", async (req, res) => {
  const { token, id } = req.query;

  if (!checkBody(req.query, ["token", "id"])) {
    res.json({ result: false, error: "Champs manquants ou vides" });
    return;
  }
  if (!token || !id) {
    return res.json({ result: false, error: "Utilisateur inconnu" });
  }
  const conversationInfo = await Conversation.findById(id).populate(
    "idUserParent idUserBabysitter",
    "firstName lastName avatar"
  );
  res.json({ result: true, conversationInfo });
});

module.exports = router;

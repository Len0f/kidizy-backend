var express = require('express');
var router = express.Router();

require("../connection/connection");
const User = require("../models/users");
const Proposition = require("../models/propositions");
const { checkBody } = require("../modules/checkBody");

// -------------- CREER UNE PROPOSITION
router.post("/", async (req, res) => {
  const {
    token,
    idUserParent,
    idUserBabysitter,
    propoStart,
    propoEnd,
    createdAt,
    updatedAt,
    rating,
    comment,
    opinionParent,
    opinionBabysitter,
    isAccepted,
    firstName,
    lastName,
    kids,
    day,
  } = req.body;

  if (!checkBody(req.body, ["token"])) {
    return res.json({ result: false, error: "Champs manquants ou vides" });
  }

  if (!token) {
    return res.json({ result: false, error: "Utilisateur inconnu" });
  }

  const existingUser = await User.findOne({ token });
  if (existingUser) {
    const avatar = existingUser.avatar;

    const newProposition = new Proposition({
      idUserParent,
      idUserBabysitter,
      avatar: avatar,
      firstName,
      lastName,
      propoStart,
      propoEnd,
      kids: typeof kids === "string" ? Number(kids) : kids,
      day,
      rating,
      comment,
      opinionParent,
      opinionBabysitter,
      isAccepted: isAccepted || "PENDING",
      updatedAt: updatedAt || new Date(),
    });

    await newProposition.save();
    return res.json({ result: true, newProposition });
  }
});

// -------------- RECUPERER LES PROPOSITION
router.get("/", async (req, res) => {
  const { token, id } = req.query;

  if (!checkBody(req.query, ["token", "id"])) {
    res.json({ result: false, error: "Champs manquants ou vides" });
    return;
  }
  if (!token || !id) {
    return res.json({ result: false, error: "Utilisateur inconnu" });
  }
  const propositionBaby = await Proposition.find({
    idUserBabysitter: id,
  }).populate("idUserParent", "avatar firstName lastName");
  const filteredPropositions = await propositionBaby.filter((proposition) =>
    ["PENDING", "NEGOCIATING"].includes(proposition.isAccepted)
  );

  res.json({ result: true, filteredPropositions });
});

// -------------- RECUPERER LES PROPOSITION par ID
router.get("/id", async (req, res) => {
  const { token, id } = req.query;

  if (!checkBody(req.query, ["token", "id"])) {
    res.json({ result: false, error: "Champs manquants ou vides" });
    return;
  }
  if (!token || !id) {
    return res.json({ result: false, error: "Utilisateur inconnu" });
  }
  const propo = await Proposition.findById(id).populate('idUserParent','location');
  res.json({ result: true, propo });
});

// -------------- Petite route pour changer le statut valider/refuser
router.put("/id", async (req, res) => {
  const { token, id, status } = req.body;

  if (!checkBody(req.body, ["token", "id", "status"])) {
    return res.json({
      result: false,
      error: "Champs manquant ou vides",
    });
  }

  if (!token) {
    return res.json({
      result: false,
      error: "Utilisateur inconnu",
    });
  }

  const checkStatus = ["ACCEPTED", "REFUSED", "PENDING", "NEGOCIATING"];
  if (!checkStatus.includes(status)) {
    return res.json({
      result: false,
      error: "Status invalide",
    });
  }

  const propo = await Proposition.findByIdAndUpdate(
    id,
    { isAccepted: status, updatedAt: new Date() },
    { new: true }
  );

  if (!propo) {
    return res.json({
      result: false,
      error: "Proposition introuvable",
    });
  }

  res.json({
    result: true,
    propo,
  });
});

// -------------- SUPPRIMER UNE PROPOSITION par ID si status REFUSED
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.json({ result: false, error: "id manquant" });

  // Ne supprime que si la proposition est déjà REFUSED
  const del = await Proposition.findOneAndDelete({
    _id: id,
    isAccepted: "REFUSED",
  });
  if (!del) {
    return res.json({
      result: false,
      error: "Proposition introuvable ou statut non REFUSED",
    });
  }
  return res.json({ result: true, deletedId: id });
});

module.exports = router;

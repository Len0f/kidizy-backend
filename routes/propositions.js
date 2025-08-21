var express = require("express");
var router = express.Router();

require("../connection/connection");
const User = require("../models/users");
const Proposition = require("../models/propositions");
const { checkBody } = require("../modules/checkBody");

// ----------------- Route POST "/" - Création d’une nouvelle proposition
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

    // Création d’une nouvelle proposition avec les infos fournies
    const newProposition = new Proposition({
      idUserParent,
      idUserBabysitter,
      avatar: avatar,
      firstName,
      lastName,
      propoStart,
      propoEnd,
      kids: typeof kids === "string" ? Number(kids) : kids, // conversion si string
      day,
      rating,
      comment,
      opinionParent,
      opinionBabysitter,
      isAccepted: isAccepted || "PENDING", // statut par défaut
      updatedAt: updatedAt || new Date(),
    });

    await newProposition.save();
    return res.json({ result: true, newProposition });
  }
});

// ----------------- Route GET "/" - Récupération des propositions d’un babysitter
router.get("/", async (req, res) => {
  const { token, id } = req.query;

  if (!checkBody(req.query, ["token", "id"])) {
    res.json({ result: false, error: "Champs manquants ou vides" });
    return;
  }

  if (!token || !id) {
    return res.json({ result: false, error: "Utilisateur inconnu" });
  }

  // Cherche toutes les propositions destinées à ce babysitter
  const propositionBaby = await Proposition.find({
    idUserBabysitter: id,
  }).populate("idUserParent", "avatar firstName lastName"); // ajoute infos parent

  // Filtre uniquement celles qui sont encore en attente ou en négociation
  const filteredPropositions = await propositionBaby.filter((proposition) =>
    ["PENDING", "NEGOCIATING"].includes(proposition.isAccepted)
  );

  res.json({ result: true, filteredPropositions });
});

// ----------------- Route GET "/id" - Récupération du détail d’une proposition par son ID
router.get("/id", async (req, res) => {
  const { token, id } = req.query;

  if (!checkBody(req.query, ["token", "id"])) {
    res.json({ result: false, error: "Champs manquants ou vides" });
    return;
  }

  if (!token || !id) {
    return res.json({ result: false, error: "Utilisateur inconnu" });
  }

  // Récupère la proposition et ajoute les infos de localisation du parent
  const propo = await Proposition.findById(id).populate(
    "idUserParent",
    "location"
  );
  res.json({ result: true, propo });
});

// ----------------- Route PUT "/id" - Mise à jour du statut d’une proposition
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

  // Vérifie que le statut demandé est valide
  const checkStatus = ["ACCEPTED", "REFUSED", "PENDING", "NEGOCIATING"];
  if (!checkStatus.includes(status)) {
    return res.json({
      result: false,
      error: "Status invalide",
    });
  }

  // Met à jour la proposition en base
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

// ----------------- Route DELETE ("/:id") - Suppression d’une proposition
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.json({ result: false, error: "id manquant" });

  // Supprime uniquement si le statut est déjà "REFUSED"
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

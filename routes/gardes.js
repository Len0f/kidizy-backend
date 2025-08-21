var express = require("express");
var router = express.Router();
var Garde = require("../models/babysits");
const { checkBody } = require("../modules/checkBody");

require("../connection/connection");
const User = require("../models/users");
const Babysits = require("../models/babysits");
const mongoose = require("mongoose");

// ----------------- Route POST /new — création d'une nouvelle garde
router.post("/new", async (req, res) => {
  const {
    token,
    idUserParent,
    idUserBabysitter,
    realStart,
    realEnd,
    ratingB,
    ratinP,
    opinionParent,
    opinionBabysitter,
    updatedAt,
    proposition,
    isFinish,
  } = req.body;

  if (!checkBody(req.body, ["token"])) {
    res.json({ result: false, error: "Champs manquants ou vides" });
    return;
  }

  if (!token) {
    return res.json({ result: false, error: "Utilisateur inconnu" });
  }

  const existingUser = await User.findOne({ token });
  if (existingUser) {
    const avatar = existingUser.avatar;

    // Crée et sauvegarde une garde
    const newGarde = new Garde({
      idUserParent,
      avatar: avatar,
      idUserBabysitter,
      realStart,
      realEnd,
      ratingB,
      ratinP,
      opinionParent,
      opinionBabysitter,
      updatedAt,
      proposition,
      isFinish,
    });
    newGarde.save();
    res.json({ result: true, newGarde });
  }
});

// ----------------- Route POST /:token — création d’une disponibilité pour un babysitter
router.post("/:token", async (req, res) => {
  const { day, startHour, endHour } = req.body;

  if (!day || !startHour || !endHour) {
    return res.json({ result: false, error: "Champs manquants" });
  }

  // Cherche l’utilisateur par token
  const user = await User.findOne({ token: req.params.token });
  if (!user || user.role !== "BABYSITTER") {
    return res.json({
      result: false,
      error: "Utilisateur non trouvé ou pas babysitter",
    });
  }

  // Ajoute une disponibilité dans son profil
  user.babysitterInfos.availability.push({ day, startHour, endHour });
  user.updatedAt = new Date();
  await user.save();

  res.json({ result: true, availability: user.babysitterInfos.availability });
});

// ----------------- Route GET /:token — voir ses disponibilités (pour un babysitter)
router.get("/:token", async (req, res) => {
  const user = await User.findOne({ token: req.params.token });
  if (!user || user.role !== "BABYSITTER") {
    return res.json({
      result: false,
      error: "Utilisateur non trouvé ou pas babysitter",
    });
  }
  res.json({ result: true, availability: user.babysitterInfos.availability });
});

// ----------------- Route GET /parent/:token — voir les disponibilités de tous les babysitters (pour un parent)
router.get("/parent/:token", async (req, res) => {
  const parent = await User.findOne({ token: req.params.token });
  if (!parent || parent.role !== "PARENT") {
    return res.json({
      result: false,
      error: "Parent non trouvé ou mauvais rôle",
    });
  }

  // Liste les babysitters avec infos utiles
  const babysitters = await User.find(
    { role: "BABYSITTER" },
    { firstName: 1, lastName: 1, babysitterInfos: 1, avatar: 1, _id: 1 }
  );
  res.json({ result: true, babysitters });
});

// ----------------- Route PUT /:token — modification d’une disponibilité (par index)
router.put("/:token", async (req, res) => {
  const { index, day, startHour, endHour } = req.body;

  if (index === undefined || !day || !startHour || !endHour) {
    return res.json({ result: false, error: "Champs manquants" });
  }

  const user = await User.findOne({ token: req.params.token });
  if (!user || user.role !== "BABYSITTER") {
    return res.json({
      result: false,
      error: "Utilisateur non trouvé ou pas babysitter",
    });
  }

  if (!user.babysitterInfos.availability[index]) {
    return res.json({ result: false, error: "Disponibilité non trouvée" });
  }

  // Met à jour la disponibilité à l’index donné
  user.babysitterInfos.availability[index] = { day, startHour, endHour };
  user.updatedAt = new Date();
  await user.save();

  res.json({ result: true, availability: user.babysitterInfos.availability });
});

// ----------------- Route DELETE /:token — suppression d’une disponibilité (par index)
router.delete("/:token", async (req, res) => {
  const { index } = req.body;
  if (index === undefined) {
    return res.json({ result: false, error: "Index requis" });
  }

  const user = await User.findOne({ token: req.params.token });
  if (!user || user.role !== "BABYSITTER") {
    return res.json({
      result: false,
      error: "Utilisateur non trouvé ou pas babysitter",
    });
  }

  if (!user.babysitterInfos.availability[index]) {
    return res.json({ result: false, error: "Disponibilité non trouvée" });
  }

  // Retire la disponibilité
  user.babysitterInfos.availability.splice(index, 1);
  user.updatedAt = new Date();
  await user.save();

  res.json({ result: true, availability: user.babysitterInfos.availability });
});

// ----------------- Route POST / — création d’une garde (duplicata de /new, même logique)
router.post("/", async (req, res) => {
  const {
    token,
    idUserParent,
    idUserBabysitter,
    realStart,
    realEnd,
    ratingB,
    ratinP,
    opinionParent,
    opinionBabysitter,
    updatedAt,
    proposition,
    isFinish,
  } = req.body;

  if (!checkBody(req.body, ["token"])) {
    res.json({ result: false, error: "Champs manquants ou vides" });
    return;
  }

  if (!token) {
    return res.json({ result: false, error: "Utilisateur inconnu" });
  }

  const existingUser = await User.findOne({ token });
  if (existingUser) {
    const avatar = existingUser.avatar;
    const newGarde = new Garde({
      idUserParent,
      avatar: avatar,
      idUserBabysitter,
      realStart,
      realEnd,
      ratingB,
      ratinP,
      opinionParent,
      opinionBabysitter,
      updatedAt,
      proposition,
      isFinish,
    });
    newGarde.save();
    res.json({ result: true, newGarde });
  }
});

// ----------------- Route GET /id — récupère une garde par son ID
router.get("/id", async (req, res) => {
  const { token, id } = req.query;

  if (!checkBody(req.query, ["token", "id"])) {
    res.json({ result: false, error: "Champs manquants ou vides" });
    return;
  }

  if (!token || !id) {
    return res.json({ result: false, error: "Utilisateur inconnu" });
  }

  const garde = await Garde.findById(id);
  res.json({ result: true, garde });
});

// ----------------- Route POST /:id/rating — ajout d’une note + avis après une garde
router.post("/:id/rating", async (req, res) => {
  try {
    const { userId, rating, avis, idUserBabysitter, idUserParent } = req.body; // userId = celui qui poste l'avis
    const gardeId = req.params.id;

    if (!userId || !rating) {
      return res.json({
        result: false,
        error: "userId et rating sont obligatoires",
      });
    }

    // Vérifie que la proposition existe
    const garde = await Garde.findById(gardeId);
    if (!garde) {
      return res.json({ result: false, error: "Garde introuvable" });
    }

    // Vérifie si l'user est bien lié à cette garde
    if (
      garde.idUserParent.toString() !== userId &&
      garde.idUserBabysitter.toString() !== userId
    ) {
      return res.json({
        result: false,
        error: "Vous n'êtes pas lié à cette proposition",
      });
    }

    // Met à jour le champ approprié et Enregistre la note dans la proposition
    let updateFields = {};
    if (garde.idUserParent.toString() === userId) {
      updateFields.opinionParent = avis || "";
      updateFields.ratingP = rating;
      updateFields.isFinish = "FINISH";
    } else {
      updateFields.ratingB = rating;
      updateFields.opinionBabysitter = avis || "";
      updateFields.isFinish = "FINISH";
    }
    updateFields.updatedAt = new Date();

    // Met à jour la garde
    const updated = await Garde.findByIdAndUpdate(
      gardeId,
      { $set: updateFields },
      { new: true }
    );

    // Met aussi à jour la note moyenne du destinataire
    let targetUserId =
      garde.idUserParent.toString() === userId
        ? idUserBabysitter
        : idUserParent;
    console.log(idUserBabysitter);
    console.log(userId);
    console.log(targetUserId);
    if (userId) {
      // Récupère toutes les notes reçues par cet utilisateur

      let receivedRatings;
      if (garde.idUserParent.toString() === userId) {
        // notes reçues par la babysitter
        receivedRatings = await Garde.find({
          $or: [
            { idUserParent: targetUserId, opinionBabysitter: { $ne: null } },
            { idUserBabysitter: targetUserId, opinionParent: { $ne: null } },
          ],
          ratingB: { $gt: 0 },
        });
      } else {
        // notes reçues par le parent
        receivedRatings = await Garde.find({
          $or: [
            { idUserParent: targetUserId, opinionBabysitter: { $ne: null } },
            { idUserBabysitter: targetUserId, opinionParent: { $ne: null } },
          ],
          ratingP: { $gt: 0 },
        });
      }

      // Calcul de la moyenne
      let avgRating;
      if (garde.idUserParent.toString() === userId) {
        avgRating =
          receivedRatings.reduce((sum, p) => sum + (p.ratingP || 0), 0) /
          (receivedRatings.length || 1);
      } else {
        avgRating =
          receivedRatings.reduce((sum, p) => sum + (p.ratingB || 0), 0) /
          (receivedRatings.length || 1);
      }

      // Mise à jour du profil utilisateur avec la nouvelle note moyenne
      await User.findByIdAndUpdate(targetUserId, {
        $set: { rating: avgRating },
      });
    }

    res.json({ result: true, garde: updated });
  } catch (error) {
    console.error(error);
    res.json({ result: false, error: error.message });
  }
});

// ----------------- Route GET /new/id — récupère toutes les gardes d’un utilisateur (parent ou babysitter)
router.get("/new/id", async (req, res) => {
  const { token, id } = req.query;

  if (!checkBody(req.query, ["token", "id"])) {
    res.json({ result: false, error: "Champs manquants ou vides" });
    return;
  }

  if (!token || !id) {
    return res.json({ result: false, error: "Utilisateur inconnu" });
  }

  const garde = await Garde.find({
    $or: [{ idUserParent: id }, { idUserBabysitter: id }],
  }).populate("idUserParent idUserBabysitter proposition", "-password -token");

  res.json({ result: true, garde });
});

// ----------------- Route GET /next/by-token — récupère la prochaine garde à venir d’un utilisateur
router.get("/next/by-token", async (req, res) => {
  try {
    const { token, userId, profil } = req.query;
    // Si le rôle n'est pas précisé, on suppose "babysitter"
    const role = (profil || "babysitter").toLowerCase();

    // Filtrage par rôle
    const query =
      role === "parent"
        ? { idUserParent: userId }
        : { idUserBabysitter: userId };

    // Récupère les gardes avec toutes les infos
    const docs = await Babysits.find(query)
      .populate("idUserParent")
      .populate("idUserBabysitter")
      .populate("proposition"); // contient day, propoStart, etc.

    const now = new Date();

    // Filtre les gardes futures et prend la plus proche
    const next =
      docs
        .filter((b) => b?.proposition?.day && new Date(b.proposition.day) > now)
        .sort(
          (a, b) => new Date(a.proposition.day) - new Date(b.proposition.day)
        )[0] || null;

    res.json({ result: true, babysit: next });
  } catch (e) {
    console.error(e);
    res.json({ result: false, error: "Erreur serveur" });
  }
});

module.exports = router;

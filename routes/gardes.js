var express = require('express');
var router = express.Router();
var Garde = require('../models/babysits')


require('../connection/connection');
const User = require('../models/users');
const Propositions = require('../models/propositions');



router.post('/gardes',async (req,res)=>{
    const { token,idUserParent,idUserBabysitter,realStart,
      realEnd,ratingB,ratinP,opinionParent,opinionBabysitter,updatedAt,proposition,isFinish } = req.body;
     
        if (!checkBody(req.body, ['token'])) {
            res.json({ result: false, error: 'Champs manquants ou vides' });
            return;
     }
     if (!token) {
        return res.json({ result: false, error: 'Utilisateur inconnu' });
  }
    const existingUser = await User.findOne({token})
    if (existingUser){
        const avatar= existingUser.avatar
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
            isFinish
        })
        newGarde.save()
        res.json({result: true, newGarde})
    }
})



// route pour la creation de dispo babysitter  
router.post('/:token', async (req, res) => {
  const { day, startHour, endHour } = req.body;
  if (!day || !startHour || !endHour) {
    return res.json({ result: false, error: 'Champs manquants' });
  }

  const user = await User.findOne({ token: req.params.token });
  if (!user || user.role !== 'BABYSITTER') {
    return res.json({ result: false, error: 'Utilisateur non trouvé ou pas babysitter' });
  }

  user.babysitterInfos.availability.push({ day, startHour, endHour });
  user.updatedAt = new Date();
  await user.save(); 

  res.json({ result: true, availability: user.babysitterInfos.availability });
});        


//Route pour voir ses disponnibilité en tant que babysitter 
router.get('/:token', async (req, res) => {
  const user = await User.findOne({ token: req.params.token });
  if (!user || user.role !== 'BABYSITTER') {
    return res.json({ result: false, error: 'Utilisateur non trouvé ou pas babysitter' });
  }
  res.json({ result: true, availability: user.babysitterInfos.availability });
});


// route pour voir les disponnibilité en tant que parent 
router.get('/parent/:token', async (req, res) => {
  const parent = await User.findOne({ token: req.params.token });
  if (!parent || parent.role !== 'PARENT') {
    return res.json({ result: false, error: 'Parent non trouvé ou mauvais rôle' });
  }


  const babysitters = await User.find({ role: 'BABYSITTER' }, { firstName: 1, lastName: 1, babysitterInfos: 1, avatar: 1, _id: 1 });
  res.json({ result: true, babysitters });
});
    
// route pour modifier les dispo babysitter

router.put('/:token', async (req, res) => {
  const { index, day, startHour, endHour } = req.body;
  if (index === undefined || !day || !startHour || !endHour) {
    return res.json({ result: false, error: 'Champs manquants' });
  }

  const user = await User.findOne({ token: req.params.token });
  if (!user || user.role !== 'BABYSITTER') {
    return res.json({ result: false, error: 'Utilisateur non trouvé ou pas babysitter' });
  }

  if (!user.babysitterInfos.availability[index]) {
    return res.json({ result: false, error: 'Disponibilité non trouvée' });
  }

  user.babysitterInfos.availability[index] = { day, startHour, endHour };
  user.updatedAt = new Date();
  await user.save();

  res.json({ result: true, availability: user.babysitterInfos.availability });
});   


// route pour supprimer les dispo babysitter
router.delete('/:token', async (req, res) => {
  const { index } = req.body;
  if (index === undefined) {
    return res.json({ result: false, error: 'Index requis' });
  }

  const user = await User.findOne({ token: req.params.token });
  if (!user || user.role !== 'BABYSITTER') {
    return res.json({ result: false, error: 'Utilisateur non trouvé ou pas babysitter' });
  }

  if (!user.babysitterInfos.availability[index]) {
    return res.json({ result: false, error: 'Disponibilité non trouvée' });
  }

  user.babysitterInfos.availability.splice(index, 1);
  user.updatedAt = new Date();
  await user.save();

  res.json({ result: true, availability: user.babysitterInfos.availability });
});


router.post('/:id/rating', async (req, res) => {
  try {
    const { userId, rating, avis } = req.body; // userId = celui qui poste l'avis
    const propositionId = req.params.id;

if (!userId || !rating) {
  return res.json({ result: false, error: 'userId et rating sont obligatoires' });
}

// Vérifie que la proposition existe
const proposition = await Propositions.findById(propositionId);
if (!proposition) {
  return res.json({ result: false, error: 'Proposition introuvable' });
}

// Vérifie si l'user est bien lié à cette garde
if (
  proposition.idUserParent.toString() !== userId &&
  proposition.idUserBabysitter.toString() !== userId
) {
  return res.json({ result: false, error: "Vous n'êtes pas lié à cette proposition" });
}

// Met à jour le champ approprié
let updateFields = {};
if (proposition.idUserParent.toString() === userId) {
  updateFields.opinionParent = avis || '';
} else {
  updateFields.opinionBabysitter = avis || '';
}

// Enregistre la note dans la proposition
updateFields.rating = rating;
updateFields.updatedAt = new Date();

const updated = await Propositions.findByIdAndUpdate(
  propositionId,
  { $set: updateFields },
  { new: true }
);

// Met aussi à jour la note moyenne du destinataire
let targetUserId =
  proposition.idUserParent.toString() === userId
    ? proposition.idUserBabysitter
    : proposition.idUserParent;

if (targetUserId) {
  // Récupère toutes les notes reçues par cet utilisateur
  const receivedRatings = await Propositions.find({
    $or: [
      { idUserParent: targetUserId, opinionBabysitter: { $ne: null } },
      { idUserBabysitter: targetUserId, opinionParent: { $ne: null } }
    ],
    rating: { $gt: 0 }
  });

  const avgRating =
    receivedRatings.reduce((sum, p) => sum + (p.rating || 0), 0) /
    (receivedRatings.length || 1);

  await User.findByIdAndUpdate(targetUserId, {
    $set: { rating: avgRating }
  });
}

res.json({ result: true, proposition: updated });
  } catch (error) {
    console.error(error);
    res.json({ result: false, error: error.message });
  }
});

// route pour créer une garde

router.post('/',async (req,res)=>{
    const { token,idUserParent,idUserBabysitter,realStart,
      realEnd,ratingB,ratinP,opinionParent,opinionBabysitter,updatedAt,proposition,isFinish } = req.body;

        if (!checkBody(req.body, ['token'])) {
            res.json({ result: false, error: 'Champs manquants ou vides' });
            return;
     }
     if (!token) {
        return res.json({ result: false, error: 'Utilisateur inconnu' });
  }
    const existingUser = await User.findOne({token})
    if (existingUser){
        const avatar= existingUser.avatar
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
            isFinish
        })
        newGarde.save()
        res.json({result: true, newGarde})
    }
})

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

module.exports = router;
var express = require('express');
var router = express.Router();
var Garde = require('../models/babysits')


require('../connection/connection');
const User = require('../models/users');


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


module.exports = router;
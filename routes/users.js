var express = require('express');
var router = express.Router();


require('../connection/connection');
const User = require('../models/users');
const { checkBody } = require('../modules/checkBody');
const uid2 = require('uid2');
const bcrypt = require('bcrypt');
const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

router.post('/signup', (req, res) => {
  if (!checkBody(req.body, ['email', 'password'])) {
    res.json({ result: false, error: 'Champs manquants ou vides' });
    return;
  } else if (!EMAIL_REGEX.test(req.body.email)){
    res.json({Error:`${req.body.email} n'est pas une adresse valide`})
    return
  }


  // Vérifiez si l'utilisateur n'a pas déjà été enregistré


  User.findOne({ email: req.body.email }).then(data => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);


      const newUser = new User({
        email: req.body.email,
        password: hash,
        token: uid2(32),
        
      });


      newUser.save().then(newDoc => {
        res.json({ result: true, token: newDoc.token });
      });
    } else {
      // L'utilisateur existe déjà dans la base de données


      res.json({ result: false, error: 'L’utilisateur existe déja' });
    }
  });
});


router.post('/signin', (req, res) => {
  if (!checkBody(req.body, ['email', 'password'])) {
    res.json({ result: false, error: 'Champs manquants ou vides' });
    return;
  }


  User.findOne({ email: req.body.email }).then(data => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token });
    } else {
      res.json({ result: false, error: 'Utilisateur introuvable ou mot de passe incorrect' });
    }
  });
});

router.put('/role', async (req, res) => {
  const { token, role } = req.body;

  if (!token) {
    return res.json({ result: false, error: 'Utilisateur inconnu' });
  }

  const updatedUser = await User.findOneAndUpdate(
    {token},
    { role, updatedAt: new Date() }, 
    { new: true }
  )

  if (updatedUser) {
    res.json({ result: true, user: updatedUser });
  } else {
    res.json({ result: false, error: 'Utilisateur introuvable' });
  }
});




router.put('/submit', async (req, res) => {
  const token = req.body.token

  if (!token) {
    return res.json({ result: false, error: 'utilisateur inconnu' });
  }

  
  req.body.updatedAt = new Date();

    let existingUser = await User.findOne({ token });

if (!existingUser) {
  return res.json({ result: false, error: 'Utilisateur inconnu' });
}

const isFirstUpdate =
  !existingUser.lastName || !existingUser.firsName;

if (isFirstUpdate) {
  if (!checkBody(req.body, ['firstName', 'lastName']))
   {
    return res.json({
      result: false,
      error: 'Nom, prénom  obligatoires',
    });
  }
}

  if(existingUser.role=="BABYSITTER"){
    existingUser.babysitterInfos = {...existingUser.babysitterInfos,...req.body.babysitterInfos}
    const updatedUser = await User.findByIdAndUpdate(
      existingUser._id,
        existingUser,
        {new: true}
    );

res.json({ result: true, user: updatedUser });
  }else
  {existingUser.parentInfos = {...existingUser.parentInfos,...req.body.parentInfos}   
    const updatedUser = await User.findByIdAndUpdate(
      existingUser._id,
        existingUser,
        {new: true}
    
    );
console.log("role2",existingUser.role)
res.json({ result: true, user: updatedUser });}
  });

  	
router.delete('/', (req, res) => {
  const token = req.body.token;

  if (!token) {
    return res.json({ result: false, error: 'Token manquant' });
  }

  User.findOneAndDelete({ token }).then(deletedUser => {
    if (deletedUser) {
      res.json({ result: true, message: 'Utilisateur supprimé' });
    } else {
      res.json({ result: false, error: 'Utilisateur introuvable ou déjà supprimé' });
    }
  })
})

router.get('/me/:token', (req, res) => {

  User.findOne({ token: req.params.token }).then(data => {
    if (data) {
      res.json({ result: true, user: data });
    } else {
      res.json({ result: false, error: 'Utilisateur introuvable' });
    }
  });
});

router.get('/id/:id', (req, res) => {

  User.findById({ _id: req.params.id }).then(data => {
    if (data) {
      res.json({ result: true, user: data });
    } else {
      res.json({ result: false, error: 'Utilisateur introuvable' });
    }
  });
});

module.exports = router 







/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;

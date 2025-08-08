var express = require('express');
var router = express.Router();
require('../connection/connection');
const User = require('../models/users');
const Proposition = require('../models/propositions')
const { checkBody } = require('../modules/checkBody');

router.post('/',async (req,res)=>{
    const { token,idUserParent,idUserBabysitter,propoStart,propoEnd,createdAt,updatedAt,
        rating,comment,opinionParent,opinionBabysitter,isAccepted, firstName,lastName,kids,day } = req.body;
     
        if (!checkBody(req.body, ['token'])) {
            res.json({ result: false, error: 'Champs manquants ou vides' });
            return;
     }
     if (!token) {
        return res.json({ result: false, error: 'Utilisateur inconnu' });
  }
    const existingUser = await User.findOne({token})
    if (existingUser){
        const newProposition = new Proposition({
            idUserParent,
            idUserBabysitter,
            firstName,
            lastName,
            propoStart,
            kids,
            propoEnd,
            day,
            rating,
            comment,
            opinionParent,
            opinionBabysitter,
            isAccepted,
            updatedAt
        })
        newProposition.save()
        res.json({result: true, newProposition})
    }
})
module.exports = router;
var express = require('express');
var router = express.Router();
require('../connection/connection');
const User = require('../models/users');
const Proposition = require('../models/propositions')
const { checkBody } = require('../modules/checkBody');
const Conversation = require('../models/conversations')

router.post('/',async (req,res)=>{
    const { token,idUserParent,idUserBabysitter,updatedAt} = req.body;
     
        if (!checkBody(req.body, ['token'])) {
            res.json({ result: false, error: 'Champs manquants ou vides' });
            return;
     }
     if (!token) {
        return res.json({ result: false, error: 'Utilisateur inconnu' });
  }
  const existingUser = await User.findOne({token})
    if (existingUser){
        const newConversation = new Conversation({
            idUserParent,
            idUserBabysitter,
            updatedAt
        })
        newConversation.save()
        res.json({result: true, newConversation})
    }
})
module.exports = router;
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

router.get('/',async (req,res)=>{
    const { token, id,} = req.query;
     
        if (!checkBody(req.query, ['token','id'])) {
            res.json({ result: false, error: 'Champs manquants ou vides' });
            return;
     }
     if (!token || !id) {
        return res.json({ result: false, error: 'Utilisateur inconnu' });
  }
  const roleId= await User.findOne({_id:id})
  console.log('role',roleId)
  if (roleId.role==="PARENT"){
    const myConversations = await Conversation.find({idUserParent:id}).populate('idUserBabysitter','avatar firstName lastName')
    res.json({result: true,myConversations})
  }else if (roleId.role==='BABYSITTER'){
    const myConversations = await Conversation.find({idUserBabysitter:id}).populate('idUserParent','avatar firstName lastName')
    res.json({result: true,myConversations})
  }
})

module.exports = router;
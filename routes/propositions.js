var express = require('express');
var router = express.Router();
require('../connection/connection');
const User = require('../models/users');
const Proposition = require('../models/propositions')
const { checkBody } = require('../modules/checkBody');

router.post('/',async (req,res)=>{

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
        day
    } = req.body;
    
    if (!checkBody(req.body, ['token'])) {
        return res.json({
            result: false, error: 'Champs manquants ou vides'
        });

    if (!token) {
        return res.json({ result: false, error: 'Utilisateur inconnu' });
  }
    const existingUser = await User.findOne({token})
    if (existingUser){
        const avatar= existingUser.avatar
        const newProposition = new Proposition({
            idUserParent,
            avatar: avatar,
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

    if (!token) {
        return res.json({ 
            result: false, error: 'Utilisateur inconnu'
        });
    }
    
    const existingUser = await User.findOne({token});
    if (!existingUser) {
        return res.json({
            result: false, error: 'Utilisateur inconnu'
        });
    }
    
    const newProposition = new Proposition({
        idUserParent,
        idUserBabysitter,
        firstName,
        lastName,
        propoStart,
        propoEnd,
        kids: typeof kids === 'string' ? Number(kids) :kids,
        day,
        rating,
        comment,
        opinionParent,
        opinionBabysitter,
        isAccepted: isAccepted || 'PENDING',
        updatedAt: new Date(),
    });

        await newProposition.save();
        res.json({result: true, newProposition});
    }
);

router.get('/',async (req,res)=>{
    const {token, id} = req.query;
    
    if (!checkBody(req.query, ['token','id'])) {
        return res.json({
            result: false, error: 'Champs manquants ou vides'
        });
    }
    
    if (!token || !id) {
        return res.json({
            result: false, error: 'Utilisateur inconnu'
        });
    }
    
    const propositionBaby = await Proposition
    .find({idUserBabysitter: id})
    .populate('idUserParent', 'avatar firstName lastName')
    .sort({updatedAt: -1, createdAt: -1});

    const filteredPropositions = await propositionBaby.filter(proposition => 
        ["PENDING", "NEGOCIATING"].includes(proposition.isAccepted)
    );
    
    res.json({result:true, filteredPropositions})
});

router.get('/id',async (req,res)=>{
    const {token, id} = req.query;
    
    if (!checkBody(req.query, ['token','id'])) {
        return res.json({
            result: false, error: 'Champs manquants ou vides'
        });
    }
    
    if (!token || !id) {
        return res.json({
            result: false, error: 'Utilisateur inconnu'
        });
    }
    
    const propo= await Proposition.findById(id)
    .populate('idUserParent', 'avatar firstName lastName')          // Utile pour le preview
    .populate('idUserBabysitter', 'avatar firstName lastName');

    if (!propo) {
        return res.json({
            result: false, error: 'Proposition introuvable'
        })
    }
    
    res.json({result: true, propo})
});


// Petite route pour changer le statut valider/refuser
router.put('/id', async (req, res) => {
    const { token, id, status } = req.body;

    if (!checkBody(req.body, ['token', 'id', 'status'])) {
        return res.json({
            result: false, error: 'Champs manquant ou vides'
        })
    }

    if (!token) {
        return res.json({
            result: false, error: 'Utilisateur inconnu'
        })
    }

    const checkStatus = ['ACCEPTED', 'REFUSED', 'PENDING', 'NEGOCIATING'];
    if (!checkStatus.includes(status)) {
        return res.json({
            result: false, error: 'Status invalide'
        })
    }

    const propo = await Proposition.findByIdAndUpdate(
        id,
        {isAccepted : status, updatedAt: new Date()},
        {new : true}
    );

    if (!propo) {
        return res.json({
            result: false, error: 'Proposition introuvable'
        })
    }

    res.json({
        result: true, propo 
    });
});


module.exports = router;
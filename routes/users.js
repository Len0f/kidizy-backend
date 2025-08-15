var express = require('express');
var router = express.Router();


require('../connection/connection');
const User = require('../models/users');
const { checkBody } = require('../modules/checkBody');
const uid2 = require('uid2');
const bcrypt = require('bcrypt');
const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const uniqid = require('uniqid');
const { token } = require('morgan');
const path = require('path');

// const { default: SearchScreen } = require('../../kidizy.frontend/screens/SearchScreen');


// ---------------- INSCRIPTION
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
        email: req.body.email.toLowerCase(),
        password: hash,
        token: uid2(32),
        
      });


      newUser.save().then(newDoc => {
        res.json({ result: true, info: newDoc });
      });
    } else {
      // L'utilisateur existe déjà dans la base de données


      res.json({ result: false, error: 'L’utilisateur existe déja' });
    }
  });
});

// ---------------- CONNECTION
router.post('/signin', (req, res) => {
  if (!checkBody(req.body, ['email', 'password'])) {
    res.json({ result: false, error: 'Champs manquants ou vides' });
    return;
  }


  User.findOne({ email: req.body.email.toLowerCase() }).then(data => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {

      res.json({ result: true, user: data, token: data.token, role: data.role });

    } else {
      res.json({ result: false, error: 'Utilisateur introuvable ou mot de passe incorrect' });
    }
  });
});

// ---------------- AJOUT DU ROLE
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

// ---------------- ROUTE USER
router.put('/', async (req, res) => {
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
  !existingUser.lastName || !existingUser.firstName;

if (isFirstUpdate) {
  if (!checkBody(req.body, ['firstName', 'lastName']))
   {
    return res.json({
      result: false,
      error: 'Nom, prénom  obligatoires',
    });
  }
}
if(existingUser.role=="PENDING"){
  return res.json({result: false})
}

  if(existingUser.role=="BABYSITTER"){
    //existingUser.babysitterInfos = {...existingUser.babysitterInfos,...req.body.babysitterInfos}
    existingUser ={...existingUser._doc,...req.body}
    console.log("existing",existingUser)
    const updatedUser = await User.findByIdAndUpdate(
      existingUser._id,
        existingUser,
        {new: true}
    );

res.json({ result: true, user: updatedUser });
  }else if(existingUser.role=="PARENT"){
  existingUser ={...existingUser._doc,...req.body}   
    const updatedUser = await User.findByIdAndUpdate(
      existingUser._id,
        existingUser,
        {new: true}
    
    );
res.json({ result: true, user: updatedUser });}
  });

// ---------------- SUPPRIMER UN UTILISATEUR
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

// ---------------- TROUVER L'UTILISATEUR CONNECTE
router.get('/me/:token', (req, res) => {

  User.findOne({ token: req.params.token }).select('-password').then(data => {
    if (data) {
      res.json({ result: true, user: data });
    } else {
      res.json({ result: false, error: 'Utilisateur introuvable' });
    }
  });
});

// ---------------- RECUPERER L'UTILISATEUR PAR ID
router.get('/id/:id', (req, res) => {

  User.findById({ _id: req.params.id }).select('avatar firstName location babysitterInfos.bio babysitterInfos.interest avis rating babysitterInfos.price babysitterInfos.age').then(data => {
    if (data) {
      res.json({ result: true, user: data });
    } else {
      res.json({ result: false, error: 'Utilisateur introuvable' });
    }
  });
});

// ---------------- UPLOAD DES FICHIERS
router.post('/upload', async (req, res) => {
  try {
   
    if (!req.files || !req.files.photoFromFront) {
      return res.json({ result: false, error: 'Aucun fichier reçu (champ attendu: photoFromFront)' });
    }

    const file = req.files.photoFromFront; 
   
    const ext = (file.mimetype && file.mimetype.split('/')[1]) ? `.${file.mimetype.split('/')[1]}` : '.jpg';

    
    const id = uniqid();
    const photoPath = path.join('./tmp', `${id}${ext}`);

  
    await file.mv(photoPath);

    
    const resultCloudinary = await cloudinary.uploader.upload(photoPath);

   
    try { fs.unlinkSync(photoPath); } catch (_) {}

  
    res.json({ result: true, url: resultCloudinary.secure_url });
  } catch (err) {
    console.error('UPLOAD ERROR:', err);
    res.json({ result: false, error: err.message || 'Upload échoué' });
  }
});

// ---------------- RECUPERER LA LISTE DES UTILISATEURS.
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// -------------- RECUPERATION DES BABYSITTERS 
router.get('/babysitters', async (req, res) => {
  
  // On lit les filtres envoyé dans l'URL.
  const {
    rating,
    ageRange,
    day,
    hours,
    parentLat,
    parentLon,
    maxDistanceKm,
    sort
  } = req.query;

  // Fonctions réutilisables.
  // Permet de convertir une valeur (v) en nombre si elle existe.
  const toNum = (v) => (v === undefined || v === null || v === '' ? undefined : Number(v));

  // Transforme l'âge souvent en chaine en nombre entier.
  const parseAge = (v) => (v !== undefined && v !== null ? parseInt(v, 10) : undefined);

  // Savoir si deux tranches horaires se chevauchent.
  // Convertit "08h", "8h", "08h30", "20h00" -> minutes depuis minuit
  const parseHour = (str) => {
    if (!str) return null;
    const parts = String(str).replace('h', ':').split(':').map(Number);
    const h = parts[0] || 0;
    const m = parts[1] || 0;
    return h * 60 + m;
  };

  // Chevauchement entre wanted "HHh[-HHh]" et un slot (start/end) au même format
  const timeOverlap = (wanted, start, end) => {
    if (!wanted) return true;

    const [wStartStr, wEndStr] = String(wanted).split('-');
    const wStart = parseHour(wStartStr);
    const wEnd   = parseHour(wEndStr);
    const sStart = parseHour(start);
    const sEnd   = parseHour(end);

    if ([wStart, wEnd, sStart, sEnd].includes(null)) return false;

    // chevauchement strict
    return sStart < wEnd && sEnd > wStart;
  };

  // Calcul de la distance en km entre 2 points GPS par Haversine.
  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const toRad = (d) => (d * Math.PI) / 180;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);  
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
        return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // On doit combiner la collection des babyssiters avec la moyenne les ratings des gardes.
  // $match / $lookup / $addField / $avg / $size / $ifNull / ... : doc mangoDB https://www.mongodb.com/docs/manual/reference/operator/aggregation-pipeline
  const agg = await User.aggregate([                  // User.aggregate à la place de find : permet de tout calculer en base.
    {$match: {role: 'BABYSITTER'}},                   // Permet de garder dans user que les champs avec le rôle de babysitter (on vire parent et pending)
    {
      $lookup: {                                      // joint deux collections ensemble (ici users et babysits)
        from: 'babysits',                             // nom de la collection à joindre.
        localField: '_id',                            // champs des users.
        foreignField: 'idUserBabysitter',             // champs des babysits (gardes)
        as: 'gardeRatings'                             // nom du tableau de résultats créé.
      }
    },
    {
      $addFields: {                                   // Ajout de nouveau champs calculés.
        ratingAvg: {$avg : '$gardeRatings.rating'},    // Fait la moyenne des champs ratings à l'intérieur du tableau gardeRating, si aucune note = null.
        babysitsCount: {$size: {$ifNull: ['$gardeRatings', []]}}       // compte le nombre de gardes effectuées.
      }
    },
    {
      // Equivalent à .select.
      $project: {                                     // choisis les champs qu'on veut dans le résultat final.
        firstName: 1,                                 // 1 : garde tel quel le champs.
        lastName: 1,
        avatar: 1,
        rating: {$ifNull: ['$ratingAvg', 0]},         // $ifNull permet de remplacer null par 0 pour simplifier.
        ratingFloor: { $floor: { $ifNull: ['$ratingAvg', 0] } }, // pour comparer à "note"
        babysits:
        '$babysitsCount',
        'babysitterInfos.age': 1,
        'babysitterInfos.price': 1,
        'babysitterInfos.availability': 1,
        location: 1,
      }
    }
  ])

  // Calcul des distances + filtres.
  const parent = parentLat && parentLon;
  const wantedRating = rating ? Number(rating) : undefined;

  let babysitters = agg
  .map(b => {
    let _distanceKm;
    if(parent && b?.location?.lat && b?.location?.lon) {
      _distanceKm = getDistanceKm(
        parseFloat(parentLat),
        parseFloat(parentLon),
        parseFloat(b.location.lat),
        parseFloat(b.location.lon),
      );
    }
    return {...b, _distanceKm};
  })
  .filter(b => {
    // Notes
    if (wantedRating !== undefined && !Number.isNaN(wantedRating)) {
      const note = Number(b.rating ?? 0); // si null -> 0
      if (Math.floor(note) !== wantedRating) return false;
    }


    // Tranches d'âge
    if (ageRange) {
      const rawAge = b?.babysitterInfos?.age;
    
      // exclure si champ âge manquant / vide
      if (rawAge === undefined || rawAge === null || rawAge === '') return false;
    
      const age = parseAge(rawAge);
      if (Number.isNaN(age)) return false;
    
      const [minAge, maxAge] = ageRange.split('-').map(Number);
      if (!(age >= minAge && age <= (maxAge || age))) return false;
    }


    // Distances
    if (maxDistanceKm && parent) {
      // exclure si coordonnées manquantes
      if (b._distanceKm === undefined) return false;
      if (b._distanceKm > Number(maxDistanceKm)) return false;
    }

    // Jours
    if (day) {
      const okDay = b?.babysitterInfos?.availability?.some(s => s.day === day);
      // exclure si pas d'availability OU pas ce jour
      if (!okDay) return false;
    }

    // Tranches horaires (avec chevauchements)
    if (hours) {
      const okHours = b?.babysitterInfos?.availability?.some(s =>
        timeOverlap(hours, s.startHour, s.endHour)
      );
      // exclure si pas d'availability OU pas de chevauchement
      if (!okHours) return false;
    }

    return true;
  });

  // Tri dans l'ordre
  if (sort) {
      const keys = String(sort).split(',').map(s => s.trim()).filter(Boolean);
      const metric = (o, k) => {
        switch (k) {
          case 'rating':
          case 'ratingAvg': return toNum(o.rating) ?? 0;
          case 'distance':  return o._distanceKm ?? Number.POSITIVE_INFINITY;
          case 'price':     return toNum(o?.babysitterInfos?.price) ?? Number.POSITIVE_INFINITY;
          case 'age':       return parseAge(o?.babysitterInfos?.age) ?? Number.POSITIVE_INFINITY;
          default:          return 0;
        }
      };
      babysitters.sort((a, b) => {
        for (const raw of keys) {
          const desc = raw.startsWith('-');
          const k = desc ? raw.slice(1) : raw;
          const va = metric(a, k);
          const vb = metric(b, k);
          const aU = va === undefined || Number.isNaN(va);
          const bU = vb === undefined || Number.isNaN(vb);
          if (aU && bU) continue;
          if (aU) return 1;
          if (bU) return -1;
          if (va < vb) return desc ? 1 : -1;
          if (va > vb) return desc ? -1 : 1;
        }
        return 0;
      });
    }

  // Format des résultats.
    const items = babysitters.map(baby => ({
      _id: baby._id,
      firstName: baby.firstName,
      lastName: baby.lastName,
      avatar: baby.avatar,
      rating: Number((baby.rating ?? 0).toFixed(2)),
      babysits: baby.babysits ?? 0,
      age: baby.babysitterInfos?.age,
      price: baby.babysitterInfos?.price,
      availability: baby.babysitterInfos?.availability,
      location: baby.location,
      distanceKm: baby._distanceKm !== undefined ? Number(baby._distanceKm.toFixed(1)) : undefined,
    }));
    
    res.json({
      result: true,
      babysitters: items,
      total: items.length, // MODIF: plus de nextOffset/hasMore
    });
});

module.exports = router 
const mongoose = require("mongoose");

// ----------------- SCHEMA DES GARDES
const babysitSchema = mongoose.Schema({
  idUserParent: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  idUserBabysitter: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  realStart: Date,
  realEnd: Date,
  ratingB: Number,
  ratingP: Number,
  opinionParent: String,
  opinionBabysitter: String,
  createdAt: {
    type: Date,
    required: true,
    default: () => new Date(),
  },
  updatedAt: Date,
  proposition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "propositions",
  },
  isFinish: {
    type: String,
    enum: ["UNFINISH", "FINISH"],
    required: true,
    default: "UNFINISH",
  },
});

const Babysits = mongoose.model("babysits", babysitSchema);

module.exports = Babysits;

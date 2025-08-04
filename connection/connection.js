// Insert your connection string inside this variable
const mongoose = require('mongoose');
const connectionString = 'mongodb+srv://eddylou91:YUGHIG8NGyKIysis@cluster0.3xtqbny.mongodb.net/Kidizi'
mongoose.connect(connectionString, { connectTimeoutMS: 2000 })
  .then(() => console.log('Database connected'))
  .catch(error => console.error(error));

module.exports = connectionString; // Do not edit/remove this line

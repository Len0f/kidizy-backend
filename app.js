require("dotenv").config(); // Charge les variables d'environnement depuis .env
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

// Importation des routeurs
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var gardesRouter = require("./routes/gardes");
var conversationRouter = require("./routes/conversations");
var messageRouter = require("./routes/messages");
var propositionRouter = require("./routes/propositions");

var app = express();

// ------------------- MIDDLEWARES GLOBAUX
const cors = require("cors");
app.use(cors());
const fileUpload = require("express-fileupload");
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "./tmp",
    createParentPath: true,
  })
);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// ------------------- ROUTES
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/propositions", propositionRouter);
app.use("/conversations", conversationRouter);

app.use("/messages", messageRouter);
app.use("/gardes", gardesRouter);

module.exports = app;

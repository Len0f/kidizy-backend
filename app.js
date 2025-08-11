require('dotenv').config()
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var gardesRouter = require('./routes/gardes');
var conversationRouter = require ('./routes/conversations')
var messageRouter = require ('./routes/messages')

var propositionRouter = require('./routes/propositions')

var app = express();

const cors = require('cors');
app.use(cors());
const fileUpload = require('express-fileupload');
app.use(fileUpload({
  useTempFiles: true,           
  tempFileDir: './tmp',     
  createParentPath: true,       
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/propositions',propositionRouter)
app.use('/conversations',conversationRouter)

app.use('/messages',messageRouter)
app.use('/gardes', gardesRouter);
app.use(require('express-fileupload')());

module.exports = app;

var express = require('express');
var router = express.Router();
require('../connection/connection');
const User = require('../models/users');
const { checkBody } = require('../modules/checkBody');


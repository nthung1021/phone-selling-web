var express = require('express');
var { postProductReview } = require('../review/reviewController')
const { ensureAuthenticated } = require("../users/usersController");
var router = express.Router();

router.post('/post', ensureAuthenticated, postProductReview);

module.exports = router;

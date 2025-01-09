var express = require('express');
var { getProduct, showProductDetails, getFilteredProducts } = require('./productController');
var { showProductReview, postProductReview } = require('../review/reviewController')
var router = express.Router();

const { ensureAuthenticated } = require("../users/usersController");

router.get('/filter', getFilteredProducts);
router.post('/:name/review/post', ensureAuthenticated, postProductReview)
router.get('/:name/review', ensureAuthenticated, showProductReview)
router.get('/:name', showProductDetails);
router.get('/', getProduct);

module.exports = router;

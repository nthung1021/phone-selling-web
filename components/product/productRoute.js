var express = require('express');
var { getProduct, showProductDetails, getFilteredProducts } = require('./productController');
var router = express.Router();

router.get('/filter', getFilteredProducts);
router.get('/:name', showProductDetails);
router.get('/', getProduct);

module.exports = router;

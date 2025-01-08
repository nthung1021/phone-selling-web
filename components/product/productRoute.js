var express = require('express');
var { getProduct, showProductDetails, getProducts_json, getFilteredProducts, getFilteredProducts_json } = require('./productController');
var router = express.Router();

//router.get('/filter', getFilteredProducts);
router.get('/search', getFilteredProducts_json);
router.get('/s', getFilteredProducts);
router.get('/:name', showProductDetails);
router.get('/', getProduct);

module.exports = router;

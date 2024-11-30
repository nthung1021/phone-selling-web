var express = require('express');
var { getProduct, showProductDetails, searchFilter } = require('./productController');
var router = express.Router();

router.get('/:name', showProductDetails);
router.post('/get-products', searchFilter);
router.get('/', getProduct);

module.exports = router;

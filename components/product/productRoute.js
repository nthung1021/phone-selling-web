var express = require('express');
var { getProduct, showProductDetails } = require('./productController');
var router = express.Router();

router.get('/:name', showProductDetails);
router.get('/', getProduct);

module.exports = router;

var express = require('express');
var { getProduct_json, searchFilter } = require('./productController');
var router = express.Router();

router.get('/product', getProduct_json);

module.exports = router;

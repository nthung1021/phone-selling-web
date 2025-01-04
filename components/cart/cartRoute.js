const express = require('express');
const { addToCart, getCart, updateCartItem, deleteCartItem } = require('./cartController');
const router = express.Router();

router.post('/add', addToCart);
router.put('/update', updateCartItem);
router.delete('/delete/:id', deleteCartItem);
router.get('/', getCart);

module.exports = router;

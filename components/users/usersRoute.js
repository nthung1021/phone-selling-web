var express = require('express');
var { getRegister, postRegister, getLogin, postLogin, getInfo, getLogout, ensureAuthenticated } = require('./usersController');
var router = express.Router();

router.get('/register', getRegister);
router.post('/register', postRegister);
router.get('/login', getLogin);
router.post('/login', postLogin);
router.get('/logout', getLogout);
router.get('/info', ensureAuthenticated, getInfo)

module.exports = router;
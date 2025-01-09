var express = require('express');
var passport = require('passport');
var upload = require('./cloudMiddleware')
var { 
    getRegister, postRegister, getLogin, postLogin, getInfo,
    getLogout, ensureAuthenticated, checkAvailability, getForgotPassword,
    postForgotPassword, getResetPassword, postResetPassword,
    getAccountInfo, getChangePassword, postChangePassword,
    getProfileInfo, postChangeInfo, postProfileImage
} = require('./usersController');
var router = express.Router();

router.get('/register', getRegister);
router.post('/register', postRegister);

router.get('/login', getLogin);
router.post('/login', postLogin);

router.get('/logout', getLogout);

router.get('/forgot-password', getForgotPassword);
router.post('/forgot-password', postForgotPassword);

router.get('/reset-password/:token', getResetPassword);
router.post('/reset-password/:token', postResetPassword);

router.get('/info', ensureAuthenticated, getInfo)
router.get('/check-availability', checkAvailability);

router.get('/account-info', ensureAuthenticated, getAccountInfo);

router.get('/profile-information', ensureAuthenticated, getProfileInfo);
router.post('/change-info', postChangeInfo);
router.post('/upload-avatar', upload.single('avatar'), postProfileImage);

router.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/users/login',
        successRedirect: '/'
    })
);

router.get('/change-password', ensureAuthenticated, getChangePassword);
router.post('/change-password', postChangePassword);

module.exports = router;

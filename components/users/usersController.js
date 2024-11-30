var bcrypt = require('bcrypt');
var passport = require('./passportConfig');
var { findUserByUsername, createUser } = require('./usersModel');

var getLogin = (req, res) => {
    res.render('login', { title: 'GA05 - Log in' });
};

// var postLogin = async (req, res) => {
//   var { username, password } = req.body;

//   try {
//     var user = await findUserByUsername(username);
//     if (!user) {
//       return res.render('login', { error: 'Invalid username or password', title: 'Login' });
//     }

//     var isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.render('login', { error: 'Invalid username or password', title: 'Login' });
//     }

//     res.redirect('/');
//   } catch (error) {
//     console.error(error);
//     res.render('login', { error: 'Something went wrong!', title: 'Login' });
//   }
// };

var postLogin = passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true // Ensure flash middleware is added to show messages
});

var getRegister = (req, res) => {
    res.render('register', { title: 'GA05 - Register' });
};

var postRegister = async (req, res) => {
    var { username, password } = req.body;
  
    if (!username || !password) {
        return res.render('register', { error: 'All fields are required', title: 'Register' });
  }

    try {
        var existingUser = await findUserByUsername(username);
        if (existingUser) {
            return res.render('register', { error: 'Username already exists', title: 'Register' });
        }

        var hashedPassword = await bcrypt.hash(password, 10);
        await createUser(username, hashedPassword);

        res.redirect('/home');
      } catch (error) {
        console.error(error);
        res.render('register', { error: 'Something went wrong!', title: 'Register' });
    }
};

module.exports = { getLogin, postLogin, getRegister, postRegister };

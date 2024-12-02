var bcrypt = require('bcrypt');
var passport = require('./passportConfig');
var { findUserByUsername, createUser } = require('./usersModel');

var getLogin = (req, res) => {
    res.render('login', { title: 'GA05 - Log in' });
};

var postLogin = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        console.error(err);
        return res.render('login', { error: 'An unexpected error occurred. Please try again.', title: 'Login' });
      }
      if (!user) {
        // `info.message` contains the error message set in `passportConfig.js`
        return res.render('login', { error: info.message, title: 'Login', username: req.body.username });
      }
      req.logIn(user, (err) => {
        if (err) {
          console.error(err);
          return res.render('login', { error: 'Failed to log in. Please try again.', title: 'Login' });
        }
        return res.redirect('/');
      });
    })(req, res, next);
  };

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

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        // Create an error object to pass to the view
        const error = {
            status: 401,
            message: 'Unauthorized access. Please log in to continue.',
            stack: (new Error()).stack // Optional: include stack trace if needed
        };

        // Render the error page and pass the error object
        res.status(401).render('error', { error });
    }
}

const getInfo = (req, res) => {
    res.render('info', { title: 'GA05 - Information'});
}

const getLogout = async (req, res, next) => {
    req.logout(err => {
        if (err) {
            return next(err); 
        }
        res.redirect('/'); // Chuyển về home
    });
};

module.exports = { getLogin, postLogin, getRegister, postRegister, getInfo, getLogout, ensureAuthenticated };

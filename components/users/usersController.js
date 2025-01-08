var bcrypt = require('bcrypt');
var passport = require('./passportConfig');
var nodemailer = require('nodemailer');
var crypto = require('crypto');
var {
    findUserByUsername, createUser, findUserByEmail, 
    addTokenAndExpire, findTokenAndExpire, updatePassword
} = require('./usersModel');

var getLogin = (req, res) => {
    res.render('login', { title: 'Log in' });
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
        if (!user.status) {
          return res.render('login', { error: 'Your account is inactive. Please contact support.', layout: 'main' });
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
    res.render('register', { title: 'Register' });
};

var postRegister = async (req, res) => {
    var { username, email, password, confirmPassword } = req.body;

    if (!username || !password || !email || !confirmPassword) {
        return res.render('register', { error: 'All fields are required', title: 'Register' });
    }

    try {
        var existingUser = await findUserByUsername(username);
        var existingEmail = await findUserByEmail(email);

        if (existingUser) {
          return res.render('register', { error: 'Username already exists', title: 'Register' });
        }

        if (existingEmail) {
          return res.render('register', { error: 'Email already exists', title: 'Register' });
        }

        if (password !== confirmPassword) {
          return res.render('register', { error: 'Confirm password must be the same as passwword', title: 'Register' });
        }

        var hashedPassword = await bcrypt.hash(password, 10);
        await createUser(username, email, hashedPassword);

        res.render('register', {
          success: 'Registration successful! Please log in.',
          title: 'Register'
        });
    } catch (error) {
      console.error(error);
      res.render('register', { error: 'Something went wrong!', title: 'Register' });
    }
};

var getForgotPassword = (req, res) => {
    res.render('forgot-password', { title: 'Forgot Password' });
};

const postForgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        res.render('forgot-password', {title: 'Forgot Password', error: "Please enter an email"});
    }

    try {
        // Find user based on the input email
        const user = await findUserByEmail(email);

        // If user if not found, return error
        if (!user) {
            res.render('forgot-password', {title: 'Forgot Password', error: "Email is not registered"});
        }

        // Generate reset-password token
        const resetToken = generateResetToken();

        const expires = new Date();
        expires.setHours(expires.getHours() + 1); // Set token expire time to 1 hour

        await addTokenAndExpire(user.username, email, resetToken, expires);

        // Send email and reset-password link with endpoint is token
        const resetLink = req.protocol + '://' + req.get('host') + '/users/reset-password/' + resetToken;

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com', // Can use other account
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_SENDER, // Real account
                pass: process.env.APP_PASSWORD, // Password of the app (not account password)
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_SENDER,
            to: email,
            subject: 'Password Reset Request',
            text: `Click the link below to reset your password:\n\n${resetLink}\n\nThe link will expire in 1 hour.`,
        };

        // Send email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                res.render('forgot-password', {title: 'Forgot Password', error: 'Failed to send request email. Please try again later'});
            } else {
                res.render('forgot-password', {title: 'Forgot Password', success: 'Password reset link has been sent to your email'})
            }
        });
    } catch (error) {
        console.error(error);
        res.render('forgot-password', {title: 'Forgot Password', error: 'Something went wrong. Please try again later.'});
    }
};

const getResetPassword = async (req, res) => {
    const { token } = req.params;

    try {
        const user = await findTokenAndExpire(token);
        if (!user) {
            res.render('forgot-password', {title: 'Forgot Password', error: 'Invalid or expired token'});
        }

        res.render('reset-password', {title: 'Reset Password', token});
    } catch (error) {
        console.error(error);
        res.render('forgot-password', {title: 'Forgot Password', error: 'Something went wrong. Please try again later'});
    }
};

const postResetPassword = async (req, res) => {
    const { token, password, confirmPassword } = req.body;

    if (!password || !confirmPassword || password !== confirmPassword) {
        res.render('reset-password', {title: 'Reset Password', error: 'Passwords do not match.', token});
    }

    try {
        const user = await findTokenAndExpire(token);
        if (!user) {
            res.render('forgot-password', {title: 'Forgot Password', error: 'Invalid or expired token'});
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        await updatePassword(user.id, hashedPassword);

        res.render('forgot-password', {title: 'Reset Password', success: 'Password updated successfully. You can now log in.'});
    } catch (error) {
        console.error(error);
        res.render('reset-password', {title: 'Reset Password', error: 'Something went wrong. Please try again later.', token});
    }
};

const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
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
    res.render('info', { title: 'Information' });
}

const getLogout = async (req, res, next) => {
    req.logout(err => {
      if (err) {
        return next(err);
      }
      res.redirect('/');
    });
};

const checkAvailability = async (req, res) => {
    const { username, email } = req.query;

    try {
        if (username) {
          const user = await findUserByUsername(username);
          const userExists = user !== null;
          return res.json({ exists: userExists });
        }

        if (email) {
          const user = await findUserByEmail(email);
          const emailExists = user !== null;
          return res.json({ exists: emailExists });
        }

        res.json({ exists: false });
    } catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getLogin, postLogin, getRegister, postRegister,
    getInfo, getLogout, ensureAuthenticated, checkAvailability, 
    getForgotPassword, postForgotPassword, getResetPassword, postResetPassword
};

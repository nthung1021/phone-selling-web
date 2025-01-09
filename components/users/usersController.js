const bcrypt = require('bcrypt');
const passport = require('./passportConfig');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const {
    findUserByUsername, createUser, findUserByEmail,
    addTokenAndExpire, findTokenAndExpire, updatePassword,
    updateUsername, updateEmail, updatePhone, updateAvatar
} = require('./usersModel');

const getLogin = (req, res) => {
    res.render('login', { title: 'Log in' });
};

const postLogin = (req, res, next) => {
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
            return res.render('login', {
                error: 'Your account is inactive. Please contact support.', title: 'Login'
            });
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

const getRegister = (req, res) => {
    res.render('register', { title: 'Register' });
};

const postRegister = async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !password || !email || !confirmPassword) {
        return res.render('register', { error: 'All fields are required', title: 'Register' });
    }

    try {
        const existingUser = await findUserByUsername(username);
        const existingEmail = await findUserByEmail(email);

        const passwordError = validatePassword(password);
        if (passwordError) {
            return res.render('register', { error: passwordError, title: 'Register' });
        }

        if (existingUser) {
            return res.render('register', { error: 'Username already exists', title: 'Register' });
        }

        if (existingEmail) {
            return res.render('register', { error: 'Email already exists', title: 'Register' });
        }

        if (password !== confirmPassword) {
            return res.render('register', { error: 'Confirm password must be the same as passwword', title: 'Register' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
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

const getForgotPassword = (req, res) => {
    res.render('forgot-password', { title: 'Forgot Password' });
};

const postForgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.render('forgot-password', { title: 'Forgot Password', error: 'Please enter an email' });
    }

    try {
        // Find user based on the input email
        const user = await findUserByEmail(email);

        // If user if not found, return error
        if (!user) {
            return res.render('forgot-password', { title: 'Forgot Password', error: 'Email is not registered' });
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
                return res.render('forgot-password', { title: 'Forgot Password', error: 'Failed to send request email. Please try again later' });
            } else {
                return res.render('forgot-password', { title: 'Forgot Password', success: 'Password reset link has been sent to your email' })
            }
        });
    } catch (error) {
        console.error(error);
        res.render('forgot-password', { title: 'Forgot Password', error: 'Something went wrong. Please try again later.' });
    }
};

const getResetPassword = async (req, res) => {
    const { token } = req.params;

    try {
        const user = await findTokenAndExpire(token);
        if (!user) {
            return res.render('forgot-password', { title: 'Forgot Password', error: 'Invalid or expired token' });
        }

        res.render('reset-password', { title: 'Reset Password', token });
    } catch (error) {
        console.error(error);
        res.render('forgot-password', { title: 'Forgot Password', error: 'Something went wrong. Please try again later' });
    }
};

const postResetPassword = async (req, res) => {
    const { token, password, confirmPassword } = req.body;

    if (!password || !confirmPassword || password !== confirmPassword) {
        return res.render('reset-password', { title: 'Reset Password', error: 'Passwords do not match.', token });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
        return res.render('reset-password', { error: passwordError, title: 'Reset Password' });
    }

    try {
        const user = await findTokenAndExpire(token);
        if (!user) {
            return res.render('forgot-password', { title: 'Forgot Password', error: 'Invalid or expired token' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        await updatePassword(user.id, hashedPassword);

        return res.render('forgot-password', { title: 'Reset Password', success: 'Password updated successfully. You can now log in.' });
    } catch (error) {
        console.error(error);
        return res.render('reset-password', { title: 'Reset Password', error: 'Something went wrong. Please try again later.', token });
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
};

const getInfo = (req, res) => {
    res.render('info', { title: 'Information' });
};

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

const getAccountInfo = async (req, res) => {
    const formatCreatedTime = formatDate(req.user.createdAt);
    return res.render('account-info', { title: 'Account Information', formatCreatedTime });
};

const getChangePassword = async (req, res) => {
    res.render('change-password', { title: 'Change Password' });
};

const postChangePassword = async (req, res) => {
    const user = await findUserByUsername(req.user.username);
    const { currentPassword, newPassword, confirmPassword } = req.body;

    try {
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.render('change-password', { title: 'Change Password', error: 'All fields are required' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.render('change-password', { title: 'Change Password', error: 'Current password is incorrect' });
        }

        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            return res.render('change-pasword', { error: passwordError, title: 'Change Password' });
        }

        if (newPassword !== confirmPassword) {
            return res.render('change-password', { title: 'Change Password', error: 'Confirm password must be the same as passwword' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await updatePassword(req.user.id, hashedNewPassword);
        res.render('change-password', { title: 'Change Password', success: 'Password has been changed' });
    }
    catch (error) {
        console.error(error);
        res.render('change-password', { title: 'Change Password', error: 'Something went wrong. Please try again later' });
    }
};

const getProfileInfo = async (req, res) => {
    res.render('profile-information', { title: 'Profile information' });
};

const postChangeInfo = async (req, res) => {
    const user = await findUserByUsername(req.user.username);
    const { username, email, phone } = req.body;

    try {
        if (username) {
            const checkUpdateUsername = await updateUsername(user.id, username);
            if (!checkUpdateUsername) {
                return res.render('profile-information', { title: 'Profile Information', error: 'Username already exists' });
            }
        }

        if (email) {
            // User are not allowed to update email if user uses Google Login
            if (req.user.googleId != null) {
                return res.render('profile-information', { title: 'Profile Information', error: 'Email cannot be updated. You are using your Google account' });
            }

            const checkUpdateEmail = await updateEmail(user.id, email);
            if (!checkUpdateEmail) {
                return res.render('profile-information', { title: 'Profile Information', error: 'Email already exists' });
            }
        }

        if (phone) {
            await updatePhone(user.id, phone);
        }

        res.render('profile-information', { title: 'Profile Information', success: 'Your information has been changed' });
    }
    catch (error) {
        console.error(error);
        res.render('profile-information', { title: 'Profile Information', error: 'Something went wrong. Please try again later' });
    }
};

const postProfileImage = async (req, res) => {
    try {
        const imageUrl = req.file.path; // Cloudinary URL
        const userId = req.user.id;

        // Update user profile with the image URL
        await updateAvatar(userId, imageUrl);

        res.render('profile-information', {
            success: 'Profile picture updated successfully!',
            title: 'Profile Information',
            user: { ...req.user, avatar: imageUrl }, // Update frontend user object
        });
    } catch (error) {
        console.error('Error uploading avatar:', error);
        res.render('profile-information', {
            error: 'Error uploading image. Please try again.',
            title: 'Profile Information',
        });
    }
};

const formatDate = (date) => {
    const options = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    };
    return new Intl.DateTimeFormat("en-CA", options).format(new Date(date)).replace(/,/g, "").replace(/:/g, "-");
};

const validatePassword = (password) => {
    const minLength = 10;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (password.length < minLength) {
        return 'Password must be at least 10 characters long';
    }
    if (!hasUpperCase) {
        return 'Password must contain at least one uppercase letter';
    }
    if (!hasLowerCase) {
        return 'Password must contain at least one lowercase letter';
    }
    if (!hasNumber) {
        return 'Password must contain at least one number';
    }
    return null;
}


module.exports = {
    getLogin, postLogin, getRegister, postRegister,
    getInfo, getLogout, ensureAuthenticated, checkAvailability,
    getForgotPassword, postForgotPassword, getResetPassword, postResetPassword,
    getAccountInfo, getChangePassword, postChangePassword,
    getProfileInfo, postChangeInfo, postProfileImage
};

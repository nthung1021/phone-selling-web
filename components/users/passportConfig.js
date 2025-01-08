var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var bcrypt = require('bcrypt');
var {findUserByUsername, findOrCreateGoogleUser } = require('./usersModel');
var { PrismaClient } = require('@prisma/client');
var prisma = new PrismaClient();

passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        var user = await findUserByUsername(username);
        if (!user) {
          return done(null, false, { message: 'Incorrect username' });
        }

        var isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect password' });
        }

        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

// Serialize user to save in session
passport.serializeUser(async (user, done) => {
  try {
      // Update guest cart items to associate with logged-in user
      await prisma.cart.updateMany({
          where: { sessionId: user.sessionID },
          data: { userId: user.id, sessionId: null }, // Assign the logged-in user's ID and clear sessionId
      });

      done(null, user.id);
  } catch (error) {
      console.error('Error updating cart items after login:', error);
      done(error, null);
  }
});


// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        var user = await prisma.user.findUnique({ where: { id } });
        if (user) {
        done(null, user);
        } else {
        done(null, false);
        }
    } catch (error) {
        done(error);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.BASE_URL + "/users/auth/google/callback",
}, async (token, tokenSecret, profile, done) => {
    console.log('Google profile:', profile);
    try {
        const user = await findOrCreateGoogleUser(profile.id, profile.displayName, profile.emails[0].value);
        return done(null, user);
    } catch (error) {
        console.error('Error during Google authentication:', error);
        return done(error, null);
    }
}));

module.exports = passport;

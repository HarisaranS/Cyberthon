const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Organization = require('../models/Organization');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'demo-google-client-id') {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/v1/auth/oauth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ ssoProvider: 'google', ssoId: profile.id });
      if (!user) {
        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          user.ssoProvider = 'google';
          user.ssoId = profile.id;
          await user.save();
        } else {
          const org = await Organization.create({
            name: profile.displayName + "'s Organization",
            industry: 'Technology',
            size: '1-50'
          });
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            orgId: org._id,
            role: 'admin',
            isEmailVerified: true,
            ssoProvider: 'google',
            ssoId: profile.id,
            passwordHash: 'sso-user-no-password'
          });
        }
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
}

module.exports = passport;

'use strict';
var model = require('./model'),
    everyauth = require('everyauth');

function auth() {
    //Everyauth
    everyauth.google.appId(process.env.GOOGLE_APPID)
        .appSecret(process.env.GOOGLE_SECRET)
        .callbackPath('/auth/google/callback')
        .scope('https://www.googleapis.com/auth/userinfo.profile')
        .findOrCreateUser(function(session, accessToken, extra, googleUser) {
            googleUser.refreshToken = extra.refresh_token;
            googleUser.expiresIn = extra.expires_in;

            var promise = new this.Promise();
            model.User.findBySourceId('google', googleUser.id, function(err, doc) {
                if (err) promise.fail(err);
                else if (doc) {
                    session.userId = doc._id;
                    session.save();
                    promise.fulfill(doc);
                } else {
                    model.User.addGoogleUser(googleUser, function(err, doc) {
                        if (err) promise.fail(err);
                        else {
                            session.userId = doc._id;
                            session.save();
                            promise.fulfill(doc);
                        }
                    });
                }
            });
            return promise;
        }).redirectPath('/');

    return {
        middleware: everyauth.middleware
    };
}

module.exports = auth;
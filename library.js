(function (module) {
    "use strict";
    var InternalOAuthError = module.require('passport-oauth').InternalOAuthError,
        User = module.parent.require('./user'),
        Groups = module.parent.require('./groups'),
        utils = module.parent.require('../public/src/utils'),
        meta = module.parent.require('./meta'),
        db = module.parent.require('../src/database'),
        passport = module.parent.require('passport'),
        nconf = module.parent.require('nconf'),
        winston = module.parent.require('winston'),
        jws = module.require('jws'),
        async = module.parent.require('async'),
        authenticationController = module.parent.require('./controllers/authentication'),
        PassportOAuth = require('passport-oauth').OAuth2Strategy,
        constants = Object.freeze({
            admin: {
                route: '/plugins/sso-lingvist',
                icon: 'icon-lingvist'
            },

            name: 'lingvist' // Something unique to your OAuth provider in lowercase, like "github", or "nodebb"
        }),
        OAuth = {},
        opts;

    OAuth.init = function (data, callback) {
        function render(req, res) {
            res.render('admin/plugins/sso-lingvist', {});
        }

        data.router.get('/admin/plugins/sso-lingvist', data.middleware.admin.buildHeader, render);
        data.router.get('/api/admin/plugins/sso-lingvist', render);

        callback();
    };

    OAuth.getStrategy = function (strategies, callback) {

        meta.settings.get('sso-lingvist', function (err, settings) {
            if (!err && settings.id && settings.secret && settings.token_url && settings.authorization_url) {

                // OAuth 2 options
                opts = {};
                opts.clientID = settings.id;
                opts.clientSecret = settings.secret;
                opts.authorizationURL = settings.authorization_url;
                opts.tokenURL = settings.token_url;
                opts.callbackURL = nconf.get('url') + '/auth/' + constants.name + '/callback';

                PassportOAuth.Strategy.prototype.userProfile = function (accessToken, done) {
                    var decoded = jws.decode(accessToken),
                        jsonPayload;

                    if (decoded === null || decoded.payload === undefined) {
                        return done(new InternalOAuthError('Do not understand token content'));
                    }

                    try {
                        jsonPayload = decoded.payload;
                        OAuth.parseUserReturn(jsonPayload, function (err, profile) {
                            if (err) {
                                return done(err);
                            }
                            profile.provider = constants.name;

                            done(null, profile);
                        });
                    } catch (e) {
                        done(e);
                    }
                };

                opts.passReqToCallback = true;

                passport.use(constants.name, new PassportOAuth(opts, function (req, token, secret, profile, done) {
                    OAuth.login({
                        oAuthid: profile.id,
                        handle: profile.displayName,
                        email: profile.emails[0].value,
                        isAdmin: profile.isAdmin
                    }, function (err, user) {
                        if (err) {
                            return done(err);
                        }

                        authenticationController.onSuccessfulLogin(req, user.uid);
                        done(null, user);
                    });
                }));

                strategies.push({
                    name: constants.name,
                    url: '/auth/' + constants.name,
                    callbackURL: '/auth/' + constants.name + '/callback',
                    icon: constants.admin.icon,
                    scope: (constants.scope || '').split(',')
                });
            }

            callback(null, strategies);
        });
    };

    OAuth.parseUserReturn = function (data, callback) {

        var profile = {};
        profile.id = data.id;
        profile.displayName = data.displayName;
        profile.emails = [{value: data.email}];

        if (profile.displayName === null) {
            try {
                profile.displayName = data.email.match(/(.*)@/)[1];
            } catch (error) {
                profile.displayName = 'Din\'t have an -at- in the email';
            }
        }

        if (!utils.isUserNameValid(profile.displayName)) {
            profile.displayName = utils.slugify(profile.displayName, true);
        }

        // Do you want to automatically make somebody an admin? This line might help you do that...
        // profile.isAdmin = data.isAdmin ? true : false;

        callback(null, profile);
    };

    OAuth.login = function (payload, callback) {
        OAuth.getUidByOAuthid(payload.oAuthid, function (err, uid) {
            if (err) {
                return callback(err);
            }

            if (uid !== null) {
                // Existing User
                callback(null, {
                    uid: uid
                });
            } else {
                // New User
                var success = function (uid) {
                    // Save provider-specific information to the user
                    User.setUserField(uid, constants.name + 'Id', payload.oAuthid);
                    db.setObjectField(constants.name + 'Id:uid', payload.oAuthid, uid);

                    if (payload.isAdmin) {
                        Groups.join('administrators', uid, function () {
                            callback(null, {
                                uid: uid
                            });
                        });
                    } else {
                        callback(null, {
                            uid: uid
                        });
                    }
                };

                User.getUidByEmail(payload.email, function (err, uid) {
                    if (err) {
                        return callback(err);
                    }

                    if (!uid) {
                        User.create({
                            username: payload.handle,
                            email: payload.email
                        }, function (err, uid) {
                            if (err) {
                                return callback(err);
                            }

                            success(uid);
                        });
                    } else {
                        success(uid); // Existing account -- merge
                    }
                });
            }
        });
    };

    OAuth.getUidByOAuthid = function (oAuthid, callback) {
        db.getObjectField(constants.name + 'Id:uid', oAuthid, function (err, uid) {
            if (err) {
                return callback(err);
            }
            callback(null, uid);
        });
    };

    OAuth.deleteUserData = function (uid, callback) {
        async.waterfall([
            async.apply(User.getUserField, uid, constants.name + 'Id'),
            function (oAuthIdToDelete, next) {
                db.deleteObjectField(constants.name + 'Id:uid', oAuthIdToDelete, next);
            }
        ], function (err) {
            if (err) {
                winston.error('[sso-oauth] Could not remove OAuthId data for uid ' + uid + '. Error: ' + err);
                return callback(err);
            }
            callback(null, uid);
        });
    };

    OAuth.addMenuItem = function (custom_header, callback) {
        custom_header.authentication.push({
            "route": constants.admin.route,
            "icon": constants.admin.icon,
            "name": constants.name
        });

        callback(null, custom_header);
    };

    module.exports = OAuth;
}(module));
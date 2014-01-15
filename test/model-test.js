'use strict';
var timeMock = require('./timeMock'),
    async = require('async'),
    User = require('../model').setConnectionString('testglisa').User,
    _ = require('underscore');

describe('model', function() {
    var users = [{
        name: 'User1',
        test: 'bla'
    }, {
        name: 'User2'
    }, {
        name: 'User3'
    }, {
        name: 'User4',
        online: true
    }];

    beforeEach(function(done) {
        User.removeAll();
        User.insertAll(users, function(err, docs) {
            users = _.flatten(docs);
            done();
        });
    });

    it('should find a user by name', function(done) {
        User.findByName('u', '', function(err, docs) {
            docs.length.should.equal(4);
            done();
        });
    });

    describe('login and out and tick', function() {
        var user;
        beforeEach(function(done) {
            User.login(users[0]._id.toString(), function(err, doc) {
                user = doc;
                done();
            });

        });

        it('should set onlinetime to current time', function(done) {
            timeMock.currentTime = 100;
            User.tick(user, function(err, user) {
                user.onlinetime.should.equal(timeMock.currentTime);
                done();
            });
        });

        it('should logout if timeout', function(done) {
            timeMock.currentTime = 100;
            User.tick(user, function(err, user) {
                timeMock.currentTimeout.should.equal(30000);
                timeMock.currentTime = timeMock.currentTimeout;
                timeMock.currentTimeoutFunc();
                timeMock.reset();
                setTimeout(function() {
                    User.findById(user._id.toString(), function(err, user) {
                        if (err) console.log(err);
                        user.online.should.be.false;
                        done();
                    });
                }, 300);
            });
        });

        it('should login user', function() {
            user.online.should.be.true;
        });

        it('should log off user', function(done) {
            User.logout(user, function(err, doc) {
                doc.online.should.be.false;
                done();
            });
        });
    });

    //Friends
    describe('Friend stuff', function() {
        var user2;
        //Add friend before each
        beforeEach(function(done) {
            async.map([{
                name: 'User2'
            }, {
                name: 'User4'
            }, {
                name: 'User1'
            }], User.findOne, function(err, users) {
                var user = users[0],
                    friend = users[1],
                    friend2 = users[2];
                User.addFriend(user, friend, function(err) {
                    User.addFriend(user, friend2, function() {
                        User.findOne({
                            name: 'User2'
                        }, function(err, user) {
                            user2 = user;
                            done();
                        });
                    });
                });
            });
        });

        it('should should find friends online status', function(done) {
            User.findFriendsOnlineStatus(user2, function(err, user) {
                user.friends[0].online.should.be.true;
                done();
            });
        });

        it('should find online friends', function(done) {
            User.findOnlineFriends(user2, function(err, friends) {
                friends.length.should.equal(1);
                done();
            });
        });

        it('should add a friend request', function(done) {
            async.map([{
                name: 'User2'
            }, {
                name: 'User4'
            }], User.findOne, function(err, users) {
                var user = users[0],
                    friend = users[1];
                user.friends[0].status.should.equal('request');
                friend.friends[0].status.should.equal('requesting');
                done();
            });
        });

        it('should find friend', function() {
            async.map([{
                name: 'User2'
            }, {
                name: 'User4'
            }], User.findOne, function(err, users) {
                var friendReq = User.findFriend(users[1], users[0]._id);
                friendReq.should.be.a.Object;
            });
        });

        function acceptFriend(cb) {
            User.findOne({
                name: 'User4'
            }, function(err, doc) {
                User.acceptFriend(doc, doc.friends[0], function(err, friendreq) {
                    async.map([{
                        name: 'User2'
                    }, {
                        name: 'User4'
                    }], User.findOne, cb);
                });
            });
        }

        it('should accept friend', function(done) {
            acceptFriend(function(err, users) {
                var user = users[0],
                    friend = users[1];
                user.friends[0].status.should.equal('friend');
                friend.friends[0].status.should.equal('friend');
                done();
            });
        });

        it('should remove friend', function(done) {
            acceptFriend(function(err, users) {
                var user = users[0],
                    friend = users[1];
                User.removeFriend(user, friend, function(err, removedFriend) {
                    User.findOne({
                        name: 'User4'
                    }, function(err, doc) {
                        doc.friends.length.should.equal(0);
                        done();
                    });
                });

            });
        });

    });

});
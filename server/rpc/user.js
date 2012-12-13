// Server-side Code
var User = require('../../model').User,
    log = console.log;

// Define actions which can be called from the client using ss.rpc('demo.ACTIONNAME', param1, param2...)
exports.actions = function(req, res, ss) {

  // Example of pre-loading sessions into req.session using internal middleware
  req.use('session');

  // load user
  req.use('loaduser.loaduser');

  function emitOnlinestatus(){
      User.findOnlineFriends(req.user, function(err, friends){
        friends.forEach(function(friend){
          ss.publish.user(friend._id,'user-online-status', {id: req.user._id, online: req.user.online});
        });
      });
  }

  return {

    init: function() {
      var session = req.session;
      if (req.user) {
          User.findFriendsOnlineStatus(req.user, function(err, user){
            emitOnlinestatus();
            res(req.user);
          });
      } else {
        return res(false);
      }
    },

    findFriends: function(data) {
      User.findByName(data.name,req.user._id, function(err, docs){
          if(err) return res(false);
          else return res(docs);
      });
    },

    addFriend: function(data) {
      User.findById(data.id, function (err, friend){
        if(err) log(err);
        else{
          User.addFriend(req.user, friend, function (err, users /*array*/){
            if(err) log(err);
            else{
              ss.publish.user(req.user._id, 'friend-added', friend);
              ss.publish.user(friend._id, 'friend-request', req.user);
            }
          });
        }
      });
    },

    confirmFriend: function (data) {
      var fr = User.findFriend(req.user,data._id);
      if(!fr){
        log("Did not find friend by id: "+data._id);
        return;
      }

      User.acceptFriend(req.user, fr, function (err, friendreq){
        if(err){
          log(err);
          return;
        }
        ss.publish.user(fr._id, 'friend-confirmed', req.user);
      });
    },

    removeFriend: function(data) {
      User.findById(data._id, function(err, friend) {
        if(err){
          console.log(err);
          return 0;
        }
        User.removeFriend(req.user, friend, function(err, users){
          if(err){
            console.log(err);
            return 0;
          }
          ss.publish.user(users[0]._id, 'friend-removed', users[1]);
          ss.publish.user(users[1]._id, 'friend-removed', users[0]);
        });
      });
    },

    logout: function(){
      User.logout(req.user);
      req.user.online = false;
      emitOnlinestatus();
    },

    tick: function(){
      User.tick(req.user, null, function(){
        req.user.online = false;
        emitOnlinestatus();
      });
    }
  };
};
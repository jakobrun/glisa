// Server-side Code
var User = require('../../model').User,
  channelCounter = require('../util/counter')('ch');

// Define actions which can be called from the client using ss.rpc('demo.ACTIONNAME', param1, param2...)
exports.actions = function(req, res, ss) {

  req.use('session');

  // load user
  req.use('loaduser.loaduser');
  return {

    newChat: function(data) {
      User.findById(data._id, function(err, friend) {
        if(err) {
          console.log(err);
          return;
        } else {
          var cid = channelCounter(),
              channel = {id: cid, users: [req.user, friend]};

          req.session.channel.subscribe(cid);
          ss.publish.user(req.session.userId, 'chat-created', channel);
          ss.publish.user(data._id, 'new-chat', channel);
        }

      });
    },

    join: function(data) {
      req.session.channel.subscribe(data.id);
      ss.publish.channel(data.id,'join-chat',{id: data.id, user: req.user});
    },

    paint: function(event) {
      event.userId = req.session.userId;
      ss.publish.channel(event.id, 'paint', event);
    },

    clear: function (event) {
      event.userId = req.session.userId;
      ss.publish.channel(event.id, 'clear', event);
    },

    message: function (event) {
      event.userId = req.session.userId;
      ss.publish.channel(event.id, 'message', event);
    }

  };

};
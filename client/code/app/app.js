var friends = require('./friends'),
  tabs = require('./tabs'),
  _ = require('underscore'),
  canvasControl = require('./canvasControl');

ss.rpc('user.init', '', function(user) {
  var html;
  if(user) {
    userInit(user);
  } else {
    $('#content').html(ss.tmpl['login'].render());
  }
});

$(window).unload(function() {
  ss.rpc('user.logout');
});

function userInit(user) {
  var cavasControlsById = {},
    canvasControls = [];

  //tick
  ss.rpc('user.tick');
  setInterval(function() {
    ss.rpc('user.tick');
  }, 20000);

  //Show user info
  $('#user').html(ss.tmpl['userinfo'].render({
    user: user
  }));

  //Show search
  $('#searchblock').html(ss.tmpl['search'].render());

  //Render tabs
  $('#header').append(ss.tmpl['tabs'].render());

  //Toggle header
  $('#bt-header').click(function() {
    $('#body').toggleClass('is-header-closed');
  });

  friends(ss, user);

  //Create tabs and canvas state to body if canvastab is selected
  var myTabs = tabs($('#body'), {
    onTabSelected: function(event) {
      $('body').toggleClass('is-canvas', event.index > 0);
      if(event.index > 0) canvasControls[event.index - 1].onSelected(event);
    },
    onTabRemoved: function(event) {
      var cc = canvasControls[event.index - 1];
      canvasControls.splice(event.index - 1, 1);
      for(var c in cavasControlsById) {
        if(cavasControlsById[c] === cc) {
          delete cavasControlsById[c];
          break;
        }
      }
    }
  });

  //Start chat
  $('button.bt-chat').live('click', function() {
    var id = $(this).closest('li').attr('data-id'),
      friend = user.findFriendById(id);
    ss.rpc('chat.newChat', {
      _id: id
    });
  });

  function createChatTab(data) {
    var friend = _.find(data.users, function(u) {
      return u._id != user._id;
    });
    var tab = myTabs.addTab(data.id, friend ? friend.name : 'Not logged in', ss.tmpl['canvas'].render({
      id: data.id,
      users: data.users
    }));
    var cc = canvasControl(tab.body, ss, {
      onPaint: function(event) {
        event.id = data.id;
        ss.rpc('chat.paint', event);
      },
      onMessage: function(msg) {
        ss.rpc('chat.message', {
          id: data.id,
          msg: msg
        });
      },
      onClear: function(event) {
        ss.rpc('chat.clear', {
          id: data.id
        });
      }
    });
    cc.addUsers(data.users);
    cavasControlsById[data.id] = cc;
    canvasControls.push(cc);
    tab.show();
  }
  //Chat created
  ss.event.on('chat-created', createChatTab);

  //Chat request
  ss.event.on('new-chat', function(data) {
    createChatTab(data);
    ss.rpc('chat.join', {
      id: data.id
    });
  });

  //Paint
  ss.event.on('paint', function(data) {
    if(user.userId === user._id) {
      return 0;
    }
    var cc = cavasControlsById[data.id];
    cc.paint(data);
  });

  //Clear
  ss.event.on('clear', function(data) {
    cavasControlsById[data.id].onClear(data);
  });

  //Message
  ss.event.on('message', function(data) {
    cavasControlsById[data.id].onMessage(data);
  });
}
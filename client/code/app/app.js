var tabs = require('./tabs'),
    _ = require('underscore'),
    canvasControl = require('./canvasControl');

ss.rpc('user.init', '', function(user) {
  var html;
  if(user) {
    userInit(user);
  } else {
    $('#content').hide().html(ss.tmpl['login'].render()).slideDown();
  }
});

$(window).unload(function(){
  ss.rpc('user.logout');
});

function userInit(user) {
  var cavasControlsById = {};

  //tick
  ss.rpc('user.tick');
  setInterval(function(){
    ss.rpc('user.tick');
  },20000);

  user.findFriendById = function (friendId) {
    return _.find(user.friends, function (f){ return f._id == friendId;});
  };

  user.addFriend = function (friend) {
    if(!user.friends){
      user.friends = [];
    }
    user.friends.push(friend);
  };

  user.removeFriendById = function (friendId) {
    user.friends = _.filter(user.friends, function (f) {return f._id != friendId;});
  };

  //Show user info
  $('#user').html(ss.tmpl['userinfo'].render({user: user}));

  //Show search
  $('#searchblock').html(ss.tmpl['search'].render());

 //Show friends
  var html = ss.tmpl['tabs'].render({
    users: user.friends,
    buttons: function() {
      return getButtons(this);
    }
  }, {
    user: ss.tmpl['user'],
    users: ss.tmpl['users']
  });
  $('#content').html(html);

  //Update online status
  ss.event.on('user-online-status', function (data) {
    var friend = user.findFriendById(data.id);
    if(friend){
      friend.online = data.online;
      friend.buttons = function(){
        return getButtons(this);
      };
      $('#friends [data-id="'+data.id+'"]').replaceWith(ss.tmpl['user'].render(friend));
    }
  });
 
  var findfriendInp = $('#findfriend'),
      usersresult = $('#usersresult');


  //user func
  user.findFriendById = function (friendId) {
    return _.find(user.friends, function (f){ return f._id == friendId;});
  };

  //Find friend
  findfriendInp.keyup(function(e){
    var name = $(this).val();
    if(!name){
      usersresult.html('');
      return;
    }

    ss.rpc('user.findFriends', {name: name}, function(data){
      //Show users
      usersresult.html(ss.tmpl['users'].render({
        users: data,
        buttons: function(){
          if(user.findFriendById(this._id))
            return;
          else return {classname: 'add', label: 'Add'};
        }
      },{user: ss.tmpl['user']}));
    });
  });

  //Add friend
  $('button.add').live('click', function (){
    var userElm = $(this).closest('li'),
      id = userElm.attr('data-id');
    //add friend
    ss.rpc('user.addFriend',{id: id});
    findfriendInp.val('');
    usersresult.html('');
  });

  //Friend added
  ss.event.on('friend-added', function(friend) {
    friend.status = 'request';
    user.addFriend(friend);
    $('#friends ul').append(ss.tmpl['user'].render(friend));
  });

  //Friend request
  ss.event.on('friend-request', function (friend) {
    friend.status = 'requesting';
    user.addFriend(friend);
    friend.buttons = function(){ return btFriendRequest;};
    $('#friends ul').append(ss.tmpl['user'].render(friend));
  });

  //Confirm friend
  $('button.confirm').live('click', function (){
    var userElm = $(this).closest('li'),
      id = userElm.attr('data-id'),
      friend = user.findFriendById(id);
    //add friend
    ss.rpc('user.confirmFriend',{_id: id});
    friend.status = 'friend';
    friend.buttons = function(){return btFriend;};
    userElm.replaceWith(ss.tmpl['user'].render(friend));
  });

  //Friend confirmed
  ss.event.on('friend-confirmed', function (friend) {
      var userFriend = user.findFriendById(friend._id);
      userFriend.status = 'friend';
      var friendElm = $('#friends [data-id="'+friend._id+'"]');
      userFriend.buttons = function(){return btFriend;};
      friendElm.replaceWith(ss.tmpl['user'].render(userFriend));
  });

  //Remove friend
  $('button.remove').live('click', function() {
    if(!confirm("Are you shure?"))
      return 0;
    var userElm = $(this).closest('li'),
      id = userElm.attr('data-id');
    ss.rpc('user.removeFriend', {_id: id});
  });

  //Friend removed
  ss.event.on('friend-removed', function (friend) {
      user.removeFriendById(friend._id);
      $('#friends [data-id="'+friend._id+'"]').remove();
  });

 
  var myTabs = tabs($('#content'));

  //Start chat
  $('button.chat').live('click', function() {
    var id = $(this).closest('li').attr('data-id'),
      friend = user.findFriendById(id);
    ss.rpc('chat.newChat', {_id: id});
  });
  
  function createChatTab(data){
    var friend = _.find(data.users, function(u){ return u._id!=user._id;});
    var tab = myTabs.addTab(data.id, friend? friend.name : 'Not logged in', ss.tmpl['canvas'].render({id: data.id, users: data.users}));
    tab.show();
    var cc = canvasControl(tab.body, ss, {
      onPaint: function (event){
        event.id = data.id;
        ss.rpc('chat.paint',event);
      },
      onMessage: function(msg){
        ss.rpc('chat.message',{id: data.id,msg: msg});
      },
      onClear: function (event){
        ss.rpc('chat.clear', {id: data.id});
      }
    });
    cc.addUsers(data.users);
    cavasControlsById[data.id] = cc;
  }
  //Chat created
  ss.event.on('chat-created', createChatTab);

  //Chat request
  ss.event.on('new-chat', function(data){
    createChatTab(data);
    ss.rpc('chat.join',{id: data.id});
  });

  //Paint
  ss.event.on('paint', function(data) {
    if(user.userId === user._id){
      return 0;
    }
    var cc = cavasControlsById[data.id];
    cc.paint(data);
  });

  //Clear
  ss.event.on('clear', function (data) {
    cavasControlsById[data.id].onClear(data);
  });

  //Message
  ss.event.on('message', function(data) {
    cavasControlsById[data.id].onMessage(data);
  });
}

//Buttons
var btFriendRequest = {
  classname: 'confirm',
  label: 'Confirm'
},
  btFriend = [{
    classname: 'chat',
    label: 'Chat'
  }, {
    classname: 'remove',
    icon: 'x'
  }];

function getButtons(context) {
  if(context.status === 'requesting') return btFriendRequest;
  else if(context.status === 'friend') return btFriend;
  return [];
}

// Listen out for newMessage events coming from the server
ss.event.on('newMessage', function(message) {

  // Example of using the Hogan Template in client/templates/chat/message.jade to generate HTML for each message
  var html = ss.tmpl['chat-message'].render({
    message: message,
    time: function() {
      return timestamp();
    }
  });

  // Append it to the #chatlog div and show effect
  return $(html).hide().appendTo('#chatlog').slideDown();
});


// Private functions
var timestamp = function() {
    var d = new Date();
    return d.getHours() + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  };

var pad2 = function(number) {
    return(number < 10 ? '0' : '') + number;
  };

var valid = function(text) {
    return text && text.length > 0;
  };
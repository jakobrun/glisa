requirejs.config({
		paths:{
			'jquery':'jquery-1.7.2.min',
			'jquery-ui':'jquery-ui-1.8.22.custom.min',
			'io' : 'socket.io',
			'hogan' : 'HoganTemplate',
			'underscore': 'underscore-min'
		},
		shim: {
			'jquery': {exports : 'jQuery'},
			'underscore': {exports : '_'},
			'io': {exports: 'io'},
			'hogan' : {exports: 'Hogan'}
		}
});
require(
	['jquery','underscore', 'io', 'tabs', 'colorpicker', 'canvasControl', 'templ/users','templ/user', 'templ/canvas', 'jquery-ui'],
function($, _, io, tabs, colorPicker, canvasControl, templUsers,templUser, templCanvas) {
	'use strict';
	function log(msg){
		console.log(msg);
	}

	// if browser doesn't support WebSocket, just show some notification and exit
    if (!io) {
        $('div.content').html($('<p>', { text: 'Sorry, but your browser doesn\'t support socket.io.'} ));
        return;
    }

    // open connection
	var socket = io.connect('http://glisa.jit.su'),
		myTabs = tabs($('.content'));

	socket.on('open', function (data) {
		//User
		var user = data.user,
			cavasControlsById = {},
			findfriendInp = $('#findfriend'),
			usersresult = $('#usersresult');

		//Buttons
		var btFriendRequest = {classname: 'confirm', label: 'Confirm'},
			btFriend = [{classname: 'chat', label: 'Chat'},{classname: 'remove', label: 'Remove'}];
		function getButtons(context){
			if(context.status==='requesting')
				return btFriendRequest;
			else if(context.status==='friend')
				return btFriend;
			return [];
		}

		findfriendInp.focus();

		user.findFriendById = function (friendId) {
			return _.find(user.friends, function (f){ return f._id == friendId;});
		};

		user.addFriend = function (friend) {
			user.friends.push(friend);
		};

		user.removeFriendById = function (friendId) {
			user.friends = _.filter(user.friends, function (f) {return f._id != friendId;});
		};

		//show user
		$('#user').text(user.name);


		//Show friends
		$('#friends').html(templUsers.render({users: user.friends,
			buttons: function(){return getButtons(this);}
		},{user: templUser}));

		//Find friend
		findfriendInp.keyup(function(e){
			var name = $(this).val();
			if(!name){
				usersresult.html('');
				return;
			}

			$.get('/app/findusers',{name: name},function(data){
				//Show users
				usersresult.html(templUsers.render({
					users: data,
					buttons: function(){
						if(user.findFriendById(this._id))
							return;
						else return {classname: 'add', label: 'Add'};
					}
				},{user: templUser}));
			});
		});

		//Friend online/offline
		socket.on('friend-status-change', function (data){
			var userFriend = user.findFriendById(data._id);
			userFriend.online = data.online;
			var friendElm = $('#friends [data-id="'+data._id+'"]');
			userFriend.buttons = function(){return getButtons(this);};
			friendElm.replaceWith(templUser.render(userFriend));
		});

		//Add friend
		$('button.add').live('click', function (){
			var userElm = $(this).closest('li'),
				id = userElm.attr('data-id');
			//add friend
			socket.emit('add-friend',{id: id});
			findfriendInp.val('');
			usersresult.html('');
		});

		//Friend added
		socket.on('friend-added', function (friend) {
			log('friend added');
			friend.status = 'request';
			user.addFriend(friend);
			$('#friends ul').append(templUser.render(friend));
		});

		//Friend request
		socket.on('friend-request', function (friend) {
			log('friend request');
			friend.status = 'requesting';
			user.addFriend(friend);
			friend.buttons = function(){ return btFriendRequest;};
			$('#friends ul').append(templUser.render(friend));
		});

		//Confirm friend
		$('button.confirm').live('click', function (){
			var userElm = $(this).closest('li'),
				id = userElm.attr('data-id'),
				friend = user.findFriendById(id);
			//add friend
			socket.emit('confirm-friend',{_id: id});
			friend.status = 'friend';
			friend.buttons = function(){return btFriend;};
			userElm.replaceWith(templUser.render(friend));
		});

		//Friend confirmed
		socket.on('friend-confirmed', function (friend){
			log('friend confirmed');
			var userFriend = user.findFriendById(friend._id);
			userFriend.status = 'friend';
			var friendElm = $('#friends [data-id="'+friend._id+'"]');
			userFriend.buttons = function(){return btFriend;};
			friendElm.replaceWith(templUser.render(userFriend));
		});

		//Remove friend
		$('button.remove').live('click', function() {
			var userElm = $(this).closest('li'),
				id = userElm.attr('data-id');
			socket.emit('remove-friend', {_id: id});
		});

		//Friend removed
		socket.on('friend-removed', function (friend){
			log('friend removed');
			user.removeFriendById(friend._id);
			$('#friends [data-id="'+friend._id+'"]').remove();
		});


		//Start chat
		$('button.chat').live('click', function(){
			var id		= $(this).closest('li').attr('data-id'),
				friend	= user.findFriendById(id);
			socket.emit('create-room', {_id: id});
		});

		//Chat init
		socket.on('init', function (data){
			var friend = _.find(data.users, function(u){ return u._id!=user._id;});
			var tab = myTabs.addTab(data.id, friend?friend.name:"Not logged in", templCanvas.render({id: data.id, users: data.users}));
			tab.show();
			var cc = canvasControl(tab.body, {onPaint: function (event){
					event.id = data.id;
					socket.emit('paint',event);
				}
			});
			cc.addUsers(data.users);
			cavasControlsById[data.id] = cc;
		});

		//Paint
		socket.on('paint', function (data){
			var cc = cavasControlsById[data.id];
			cc.paint(data);
		});

	});

	//Format time
	function formatTime(dt){
		var h = dt.getHours(),
			m = dt.getMinutes(),
			s = dt.getSeconds();
		return fte(h) + ':' + fte(m) + ':' + fte(s);
	}

	//Format time element
	function fte(e){
		return e <10 ? '0' + e : e;
	}
});
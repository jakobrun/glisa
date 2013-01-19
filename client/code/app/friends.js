var _ = require('underscore');

function friends($, win) {
	'use strict';

	return function(ss, user) {
		var findfriendInp = $('#findfriend'),
			usersresult = $('#usersresult'),
			//Buttons
			btFriendRequest = [{
				classname: 'bt-confirm',
				label: 'Confirm'
			},{
				classname: 'bt-reject',
				label: 'Reject'
			}],
			btFriend = [{
				classname: 'bt-chat',
				label: 'Chat'
			}, {
				classname: 'bt-remove',
				icon: 'x',
				title: 'Remove'
			}];

		function getButtons(context) {
			if(context.status === 'requesting') return btFriendRequest;
			else if(context.status === 'friend') return btFriend;
			return [];
		}

		user.findFriendById = function(friendId) {
			return _.find(user.friends, function(f) {
				return f._id == friendId;
			});
		};

		user.addFriend = function(friend) {
			if(!user.friends) {
				user.friends = [];
			}
			user.friends.push(friend);
		};

		user.removeFriendById = function(friendId) {
			user.friends = _.filter(user.friends, function(f) {
				return f._id != friendId;
			});
		};

		//Show friends
		var html = ss.tmpl.friends.render({
			users: user.friends,
			buttons: function() {
				return getButtons(this);
			}
		}, {
			user: ss.tmpl.user,
			users: ss.tmpl.users
		});
		$('#content').html(html);

		//Find friend
		findfriendInp.keyup(function(e) {
			var name = $(this).val();
			if(!name) {
				usersresult.html('');
				return;
			}

			ss.rpc('user.findFriends', {
				name: name
			}, function(data) {
				//Show users
				usersresult.html(ss.tmpl.users.render({
					users: data,
					buttons: function() {
						if(user.findFriendById(this._id)) return;
						else return {
							classname: 'bt-add',
							icon: 'a',
							label: 'Add friend'
						};
					}
				}, {
					user: ss.tmpl.user
				}));
			});
		});

		//Update online status
		ss.event.on('user-online-status', function(data) {
			var friend = user.findFriendById(data.id);
			if(friend) {
				friend.online = data.online;
				friend.buttons = function() {
					return getButtons(this);
				};
				$('#friends [data-id="' + data.id + '"]').replaceWith(ss.tmpl.user.render(friend));
			}
		});
		//Add friend
		$('button.bt-add').live('click', function() {
			var userElm = $(this).closest('li'),
				id = userElm.attr('data-id');
			//add friend
			ss.rpc('user.addFriend', {
				id: id
			});
			findfriendInp.val('');
			usersresult.html('');
		});

		//Friend added
		ss.event.on('friend-added', function(friend) {
			friend.status = 'request';
			user.addFriend(friend);
			$('#friends ul').append(ss.tmpl.user.render(friend));
		});

		//Friend request
		ss.event.on('friend-request', function(friend) {
			friend.status = 'requesting';
			user.addFriend(friend);
			friend.buttons = function() {
				return btFriendRequest;
			};
			$('#friends ul').append(ss.tmpl.user.render(friend));
		});

		//Reject friend
		$('button.bt-reject').live('click', function(){
			if(!win.confirm("Are you shure?")) return 0;
			var userElm = $(this).closest('li'),
				id = userElm.attr('data-id');
			ss.rpc('user.removeFriend', {
				_id: id
			});
		});

		//Confirm friend
		$('button.bt-confirm').live('click', function() {
			var userElm = $(this).closest('li'),
				id = userElm.attr('data-id'),
				friend = user.findFriendById(id);
			//add friend
			ss.rpc('user.confirmFriend', {
				_id: id
			});
			friend.status = 'friend';
			friend.buttons = function() {
				return btFriend;
			};
			userElm.replaceWith(ss.tmpl.user.render(friend));
		});

		//Friend confirmed
		ss.event.on('friend-confirmed', function(friend) {
			var userFriend = user.findFriendById(friend._id);
			userFriend.status = 'friend';
			var friendElm = $('#friends [data-id="' + friend._id + '"]');
			userFriend.buttons = function() {
				return btFriend;
			};
			friendElm.replaceWith(ss.tmpl.user.render(userFriend));
		});

		//Remove friend
		$('button.bt-remove').live('click', function() {
			if(!win.confirm("Are you shure?")) return 0;
			var userElm = $(this).closest('li'),
				id = userElm.attr('data-id');
			ss.rpc('user.removeFriend', {
				_id: id
			});
		});

		//Friend removed
		ss.event.on('friend-removed', function(friend) {
			user.removeFriendById(friend._id);
			$('#friends [data-id="' + friend._id + '"]').remove();
		});


	};
}

module.exports = friends($, window);
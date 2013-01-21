/*global require, ss, $, window, setInterval*/
var friends = require('./friends'),
	tabs = require('./tabs'),
	_ = require('underscore'),
	streamOrder = require('./streamOrder'),
	canvasControl = require('./canvasControl'),
	myTabs;

$(window).unload(function () {
	'use strict';
	ss.rpc('user.logout');
});

function userInit(user, ss, $) {
	'use strict';
	var cavasControlsById = {},
		canvasControls = [],
		paintPipe = streamOrder(function (data) {
			var cc = cavasControlsById[data.id];
			cc.paint(data);
		});

	//tick
	ss.rpc('user.tick');
	setInterval(function () {
		ss.rpc('user.tick');
	}, 20000);

	//Show user info
	$('#user').html(ss.tmpl.userinfo.render({
		user: user
	}));

	//Show search
	$('#searchblock').html(ss.tmpl.search.render());

	//Render tabs
	$('#header').append(ss.tmpl.tabs.render());

	//Toggle header
	$('#bt-header').click(function () {
		$('#body').toggleClass('is-header-closed');
	});

	friends(ss, user);

	//Create tabs and canvas state to body if canvastab is selected
	myTabs = tabs($('#body'), {
		onTabSelected: function (event) {
			$('body').toggleClass('is-canvas', event.index > 0);
			if (event.index > 0) {
				canvasControls[event.index - 1].onSelected(event);
			}
		},
		onTabRemoved: function (event) {
			var cc = canvasControls[event.index - 1],
				c;
			canvasControls.splice(event.index - 1, 1);
			for (c in cavasControlsById) {
				if (cavasControlsById[c] === cc) {
					delete cavasControlsById[c];
					break;
				}
			}
		}
	});

	//Start chat
	$('button.bt-chat').live('click', function () {
		var id = $(this).closest('li').attr('data-id'),
			friend = user.findFriendById(id);
		ss.rpc('chat.newChat', {
			_id: id
		});
	});

	function createChatTab(data) {
		var	friend = _.find(data.users, function (u) {
			return u._id !== user._id;
		}),
			tab = myTabs.addTab(data.id, friend ? friend.name : 'Not logged in', ss.tmpl.canvas.render({
				id: data.id,
				users: data.users
			})),
			cc = canvasControl(tab.body, ss, {
				onPaint: function (event) {
					event.id = data.id;
					ss.rpc('chat.paint', event);
				},
				onMessage: function (msg) {
					ss.rpc('chat.message', {
						id: data.id,
						msg: msg
					});
				},
				onClear: function (event) {
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
	ss.event.on('new-chat', function (data) {
		createChatTab(data);
		ss.rpc('chat.join', {
			id: data.id
		});
	});

	//Paint
	ss.event.on('paint', function (data) {
		if (data.userId === user._id) {
			return 0;
		}
		paintPipe(data);

	});

	//Clear
	ss.event.on('clear', function (data) {
		cavasControlsById[data.id].onClear(data);
	});

	//Message
	ss.event.on('message', function (data) {
		cavasControlsById[data.id].onMessage(data);
	});
}

ss.rpc('user.init', '', function (user) {
	'use strict';
	var html;
	if (user) {
		userInit(user, ss, $);
	} else {
		$('#content').html(ss.tmpl.login.render());
	}
});


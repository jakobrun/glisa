var painter = require("./painter"),
	tools = require("./tools");

function canvasControl($) {
	'use strict';

		//Painter
	return function (contextElm, ss, listener) {
		var canvaso = contextElm.find("canvas.canvas").get(0);

		canvaso.width = window.innerWidth;
		canvaso.height = window.innerHeight;



		var	colorbutton = contextElm.find(".colorsel"),
			myPainter = painter(canvaso, tools(), listener),
			msgInput = contextElm.find(".msginput"),
			painters = {},
			messages = {};


		//Send message
		msgInput.keyup(function(e){
			if(e.keyCode!==13 || ""==msgInput.val()){
				return true;
			}
			if(listener && listener.onMessage){
				listener.onMessage(msgInput.val());
			}
			msgInput.val('');
		});

		function paint(data){
			painters[data.userId].paint(data);
		}

		function addUser(user){
			painters[user._id] = myPainter.socketPainter();
		}

		function onMessage(data){
			var html = ss.tmpl['chat-message'].render({message: data.msg});
			var chatBubble = contextElm.find('.users [data-id="'+data.userId+'"]');
			chatBubble.show();
			$(html).hide().appendTo(chatBubble).slideDown().delay(7000).slideUp(function(){
				$(this).remove();
				if(chatBubble.find(".message").length===0){
					chatBubble.fadeOut();
				}
			});
		}

		return {
			paint : paint,
			addUser : addUser,
			addUsers : function(users){
				users.forEach(addUser);
			},
			onMessage: onMessage,
			onClear: function (data){
				myPainter.clear();
			}
		};

	};
}

module.exports = canvasControl($);
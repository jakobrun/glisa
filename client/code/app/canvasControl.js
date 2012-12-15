var painter = require("./painter"),
	colorpicker = require("./colorpicker");

function canvasControl(painter, colorpicker, $) {
	'use strict';

		//Painter
	return function (contextElm, ss, listener) {
		var canvaso = contextElm.find("canvas.canvas").get(0),
			colorbutton = contextElm.find(".colorsel"),
			myPainter = painter(canvaso, listener),
			msgInput = contextElm.find(".msginput"),
			cp = colorpicker(contextElm.find(".color-canvas").get(0)),
			painters = {},
			messages = {};

		function setOn(button){
			contextElm.find('button.on').removeClass("on");
			$(button).addClass('on');
		}

		//New
		contextElm.find('button.new').click( function (e){
			listener.onClear();
		});

		//Brush click
		contextElm.find('button.brush').click( function (e){
			setOn(this);
			myPainter.setTool('brush');
		});

		//Rect click
		contextElm.find('button.rect').click(function(e){
			setOn(this);
			myPainter.setTool('rect');
		});

		//Line click
		contextElm.find('button.line').click(function(e){
			setOn(this);
			myPainter.setTool('line');
		});

		//Color picker
		cp.onChange(function(color){
			colorbutton.css('background-color',color);
			myPainter.setColor(color);
		});

		//Line width
		var lineWidth = contextElm.find('div.line-width input');
		lineWidth.change( function(e){
			myPainter.setLineWidth( lineWidth.val());
		});

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

module.exports = canvasControl(painter, colorpicker, $);
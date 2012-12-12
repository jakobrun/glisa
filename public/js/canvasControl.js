define(['painter', 'colorpicker', 'jquery'], function (painter, colorpicker, $) {
	'use strict';

		//Painter
	return function (contextElm, listener) {
		var canvaso = contextElm.find("canvas.canvas").get(0),
			colorbutton = contextElm.find(".colorsel"),
			myPainter = painter(canvaso, listener),
			msgInput = contextElm.find("").get(0),
			cp = colorpicker(contextElm.find(".color-canvas").get(0)),
			painters = {};

		function setOn(button){
			contextElm.find('button.on').removeClass("on");
			$(button).addClass('on');
		}

		//Brush click
		contextElm.find('button.brush').click(function(e){
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
		var lineWidth = contextElm.find('div.line-width');
		lineWidth.slider({change: function(e){
				myPainter.setLineWidth( lineWidth.slider("option","value"));
			},
			min: 1,
			max: 60,
			value: 1
		});

		function paint(data){
			painters[data.user.username].paint(data);
		}

		function addUser(user){
			painters[user.username] = myPainter.socketPainter();
		}

		return {
			paint : paint,
			addUser : addUser,
			addUsers : function(users){
				users.forEach(addUser);
			}
		};

	};
});

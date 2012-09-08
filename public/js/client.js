requirejs.config({
		paths:{
			'jquery':'jquery-1.7.2.min',
			'jquery-ui':'jquery-ui-1.8.22.custom.min',
			'io' : 'socket.io'
		},
		shim: {
			'jquery': {exports : 'jQuery'},
			'io': {exports: 'io'}
		}
});
require(
	['jquery', 'io', 'colorpicker', 'painter', 'jquery-ui'],
function($, io, colorPicker, painter) {
	'use strict';
	var chatlog = $('#chatlog'),
		channelname = urlParam('channel') || urlParam('newchannel'),
		users = {},
		cp = colorPicker(document.getElementById("color-canvas"));

	// if browser doesn't support WebSocket, just show some notification and exit
    if (!io) {
        chatlog.html($('<p>', { text: 'Sorry, but your browser doesn\'t support socket.io.'} ));
        return;
    }

    // open connection
	var socket = io.connect('http://glisa.jit.su');
	socket.on('open', function () {
		socket.emit('join',{channel: channelname});
	});

	socket.on('init', function(data){
		//Create painter
		var canvasPainter = painter(document, {
			onPaint : function(ev){
				socket.emit("paint",ev);
			}
		});

		//Show users
		var html = '';
		for (var i = 0;i < data.users.length; i++) {
			var u = data.users[i];
			users[u.color] = u;
			u.painter = canvasPainter.socketPainter();
			html += '<li style="color:'+u.color+'" class="' + u.color + '">' + u.username + '</li>';
		}
		$('#users ul').html(html);
	
		// On new user
		socket.on('newuser', function(user){
			users[user.color] = user;
			user.painter = canvasPainter.socketPainter();
			var html = '<li style="color:'+user.color+'" class="' + user.color + '">' + user.username + '</li>';
			$('#users ul').append(html);


		});

		//Clear
		socket.on('clear', function(){
			canvasPainter.clear();
		});

		//Send message on enter
		$('input.msginput').keydown(function(e){
			if(e.keyCode!==13)
				return;
			var t = $(this);
			socket.emit('msg',{text: t.val()});
			t.val('');
		});

		$('button.new').click(function(e){
			if(window.confirm("Are you sure you want a new canvas?")){
				canvasPainter.clear();
				socket.emit('clear');
			}
		});

		//Brush click
		$('button.brush').click(function(e){
			$('button.on').removeClass("on");
			$(this).addClass('on');
			canvasPainter.setTool('brush');
		});

		//Rect click
		$('button.rect').click(function(e){
			$('button.on').removeClass("on");
			$(this).addClass('on');
			canvasPainter.setTool('rect');
		});

		//Line click
		$('button.line').click(function(e){
			$('button.on').removeClass("on");
			$(this).addClass("on");
			canvasPainter.setTool('line');
		});

		//Color picker
		cp.onChange(function(color){
			$('#colorsel').css('background-color',color);
			canvasPainter.setColor(color);
		});

		//Line width
		$('#line-width').slider({change: function(e){
				canvasPainter.setLineWidth($(this).slider("option","value"));
			},
			min: 1,
			max: 60,
			value: 1
		});

	
	});

	socket.on('useroff', function(user){
		$('li.' + user.color).remove();
	});

	//Message
	socket.on('msg', function(data){
		var html = '<p><span style="color:' + data.user.color + '">' + data.user.username + '</span> @ '+ formatTime(new Date(data.time)) + ': <br>' + data.text + '</p>';
		chatlog.append(html);
		var objDiv = $('.chatwin').get()[0];
		objDiv.scrollTop = objDiv.scrollHeight;
	});

	//Paint
	socket.on('paint',function(sEvent){
		users[sEvent.user.color].painter.paint(sEvent);
	});

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

	function urlParam(name){
		var results = new RegExp('[?&]' + name + '=([^&#]*)').exec(top.window.location.href);
		return (results !== null) ? decodeURIComponent(results[1]) : 0;
	}

});
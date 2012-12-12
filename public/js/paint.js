function painter(socket,user) {
	var canvas = document.getElementById("imageView"),
		context = canvas.getContext("2d");


	// The pencil tool instance.
	tool = new tool_pencil();

	// Attach the mousedown, mousemove and mouseup event listeners.
	canvas.addEventListener('mousedown', ev_canvas, false);
	canvas.addEventListener('mousemove', ev_canvas, false);
	canvas.addEventListener('mouseup',   ev_canvas, false);

	// This painting tool works like a drawing pencil which tracks the mouse
	// movements.
	function tool_pencil () {
		var tool = this;
		this.started = false;

		// This is called when you start holding down the mouse button.
		// This starts the pencil drawing.
		this.mousedown = function (ev) {
			context.beginPath();
			context.moveTo(ev._x, ev._y);
			tool.started = true;
		};

		// This function is called every time you move the mouse. Obviously, it only
		// draws if the tool.started state is set to true (when you are holding down
		// the mouse button).
		this.mousemove = function (ev) {
			if (tool.started) {
				context.lineTo(ev._x, ev._y);
				context.strokeStyle = "#333";
				context.lineWidth = 15;
				context.stroke();
			}
		};

		// This is called when you release the mouse button.
		this.mouseup = function (ev) {
			if (tool.started) {
				tool.mousemove(ev);
				tool.started = false;
			}
		};
	}

	function clear(){
		context.beginPath();
        context.rect(0, 0, 600, 450);
        context.fillStyle = '#fff';
        context.fill();
        context.lineWidth = 1;
        context.strokeStyle = '#fff';
        context.stroke();
	}

	// The general-purpose event handler. This function just determines the mouse
	// position relative to the canvas element.
	function ev_canvas (ev) {
		ev._x = ev.pageX - canvas.offsetLeft;
        ev._y = ev.pageY - canvas.offsetTop;

		// Call the event handler of the tool.
		var func = tool[ev.type];
		if (func) {
			context.save();
			var sEvent = {type: ev.type,_x:ev._x,_y:ev._y,client:user};
			socket.emit("paint",sEvent);
			func(ev);
		}
	}

	$("#clearImage").click(clear);

	socket.on('paint',function(sEvent){
		var func = tool[sEvent.type];
		if (func) {
			func(sEvent);
		}
	});

}

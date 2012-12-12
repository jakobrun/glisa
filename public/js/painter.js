
define(['myutil'],function(util) {
	'use strict';

		//Painter
	return function (canvaso, listener) {
		var contexto = canvaso.getContext("2d"),
			canvas = document.createElement("canvas"),
			// Set the pencil tool default.
			currenttool = 'brush',
			currentColor = '#000',
			currentLineWidth = 1;

		//Add feedback canvas to dom
		canvas.className = "temp-canvas";
		canvas.width = canvaso.width;
		canvas.height = canvaso.height;
		canvaso.parentNode.appendChild(canvas);

		//Create context and tools
		var context = canvas.getContext("2d"),
			tools = createTools(context,canvas);
		context.lineCap = 'round';

		// Attach the mousedown, mousemove and mouseup event listeners.
		canvas.addEventListener('mousedown', ev_canvas, false);
		canvas.addEventListener('mousemove', ev_canvas, false);
		canvas.addEventListener('mouseup',   ev_canvas, false);

		function createTools(ctx,subCanvas){
			// This painting tool works like a drawing pencil which tracks the mouse
			// movements.
			function ToolPencil () {
				var tool = this;

				// This is called when you start holding down the mouse button.
				// This starts the pencil drawing.
				this.mousedown = function (ev, scope) {
					ctx.beginPath();
					ctx.moveTo(ev._x, ev._y);
					scope.started = true;
					return true;
				};

				// This function is called every time you move the mouse. Obviously, it only
				// draws if the tool.started state is set to true (when you are holding down
				// the mouse button).
				this.mousemove = function (ev, scope) {
					if (scope.started) {
						ctx.lineTo(ev._x, ev._y);
						ctx.stroke();
						return true;
					}
					return false;
				};

				// This is called when you release the mouse button.
				this.mouseup = function (ev, scope) {
					if (scope.started) {
						tool.mousemove(ev, scope);
						scope.started = false;
						img_update();
						return true;
					}
					return false;
				};
			}

			//Rect
			function ToolRect() {
				var tool = this;

				this.mousedown = function (ev, scope) {
					scope.started = true;
					scope.x0 = ev._x;
					scope.y0 = ev._y;
					return true;
				};

				this.mousemove = function (ev, scope) {
					if (!scope.started) {
						return false;
					}

					var x = Math.min(ev._x,  scope.x0),
						y = Math.min(ev._y,  scope.y0),
						w = Math.abs(ev._x - scope.x0),
						h = Math.abs(ev._y - scope.y0);

					clear();

					if (!w || !h) {
						return;
					}

					ctx.strokeRect(x, y, w, h);
					return true;
				};

				this.mouseup = function (ev, scope) {
					if (scope.started) {
						tool.mousemove(ev, scope);
						scope.started = false;
						img_update();
						return true;
					}
					return false;
				};
			}

			//Line
			function ToolLine(){
				var tool = this;
				this.started = false;

				this.mousedown = function (ev, scope) {
					scope.started = true;
					scope.x0 = ev._x;
					scope.y0 = ev._y;
					return true;
				};

				this.mousemove = function (ev, scope) {
					if (!scope.started) {
						return false;
					}

					ctx.clearRect(0, 0, canvas.width, canvas.height);

					ctx.beginPath();
					ctx.moveTo(scope.x0, scope.y0);
					ctx.lineTo(ev._x,   ev._y);
					ctx.stroke();
					ctx.closePath();

					return true;
				};

				this.mouseup = function (ev, scope) {
					if (scope.started) {
						tool.mousemove(ev, scope);
						scope.started = false;
						img_update();
						return true;
					}
					return false;
				};
			}

			function clear(){
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			}

			function img_update () {
				contexto.drawImage(subCanvas, 0, 0);
				ctx.clearRect(0, 0, subCanvas.width, subCanvas.height);
			}

			return {
				brush : new ToolPencil(),
				rect : new ToolRect(),
				line : new ToolLine()
			};
		}


		// The general-purpose event handler. This function just determines the mouse
		// position relative to the canvas element.
		function ev_canvas (ev) {
			var offset = util.getPageOffset(canvas);
			ev._x = ev.pageX - offset.x;
			ev._y = ev.pageY - offset.y;

			// Call the event handler of the tool.
			var tool = tools[currenttool],
				func = tool[ev.type];
			if (func) {
				context.strokeStyle = currentColor;
				context.lineWidth = currentLineWidth;
				var sEvent = {type: ev.type,
					_x: ev._x,
					_y: ev._y,
					tool: currenttool,
					color: currentColor,
					lineWidth: currentLineWidth};
				if(func(ev, tool)){
					if(listener.onPaint)
						listener.onPaint(sEvent);
				}
			}
		}

		return {
			setTool : function(tool){
				currenttool = tool;
			},
			setColor : function(color){
				currentColor = color;
			},
			setLineWidth : function(lineWidth){
				currentLineWidth = lineWidth;
			},
			clear : function(){
				contexto.clearRect(0, 0, canvas.width, canvas.height);
			},
			socketPainter : function(){
				var sCanvas = document.createElement("canvas");
				//Add feedback canvas to dom
				sCanvas.className = "socket-canvas";
				sCanvas.width = canvaso.width;
				sCanvas.height = canvaso.height;
				canvaso.parentNode.appendChild(sCanvas);
				var ctx = sCanvas.getContext("2d"),
					tools = createTools(ctx,sCanvas);
				ctx.lineCap = 'round';

				return {
					paint: function(sEvent){
						var tool = tools[sEvent.tool],
						func = tool[sEvent.type];
						if (func) {
							ctx.strokeStyle = sEvent.color;
							ctx.lineWidth = sEvent.lineWidth;
							func(sEvent, tool);
						}
					}
				};

			}
		};

	};
});
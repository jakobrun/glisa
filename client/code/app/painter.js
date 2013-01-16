var util = require("./myutil"),
	PencilTool = require("./tools/pencilTool"),
	LineTool = require("./tools/lineTool"),
	RectTool = require("./tools/rectTool");

function painter(document) {
	'use strict';

		//Painter
	return function (canvaso, toolsCtrl, listener) {
		var contexto = canvaso.getContext("2d"),
			canvas = document.createElement("canvas");

		//Add feedback canvas to dom
		canvas.className = "temp-canvas";
		canvas.tabindex = 0;
		canvas.width = canvaso.width;
		canvas.height = canvaso.height;
		canvaso.parentNode.appendChild(canvas);

		//Create context and tools
		var context = canvas.getContext("2d"),
			tools = createTools(context);
		context.lineCap = 'round';
		context.lineJoin = 'round';

		//Create tools
		function createTools(ctx){

			return {
				brush : new PencilTool(ctx, canvas),
				rect : new RectTool(ctx, canvas),
				line : new LineTool(ctx, canvas)
			};
		}

		//Create socketevent
		function createEvent(ev, type){
			context.strokeStyle = "rgba("+toolsCtrl.getColor().join(',')+",1)";
			context.lineWidth = toolsCtrl.getLineWidth();
			var offset = util.getPageOffset(canvas),
				x = ev.pageX - offset.x,
				y = ev.pageY - offset.y;
			return {
				type: type,
				_x: x,
				_y: y,
				time: Date.now(),
				tool: toolsCtrl.getTool(),
				color: toolsCtrl.getColor(),
				lineWidth: toolsCtrl.getLineWidth()
			};
		}

		// Attach listeners.
		canvas.addEventListener('touchstart', touchstart, false);
		canvas.addEventListener('touchmove', touchmove, false);
		canvas.addEventListener('touchend',   touchend, false);
		canvas.addEventListener('mousedown',   mousedown, false);

		function touchstart(ev){
			ev.preventDefault();
			for(var i=0;i<ev.touches.length;i++){
				var tev = ev.touches[i],
					e = createEvent(tev,'strokeStart');
				tools[toolsCtrl.getTool()].strokeStart(e);
				fire(e);
			}
		}

		function touchmove(ev){
			ev.preventDefault();
			for(var i=0;i<ev.touches.length;i++){
				var tev = ev.touches[i],
					e = createEvent(tev,'stroke');
				tools[toolsCtrl.getTool()].stroke(e);
				fire(e);
			}
		}

		function touchend(ev){
			ev.preventDefault();
			var e = createEvent(ev,'strokeEnd');
			tools[toolsCtrl.getTool()].strokeEnd(e);
			updateImgage(context, canvas);
			fire(e);
		}

		function mousedown(ev){
			var e = createEvent(ev,'strokeStart');
			tools[toolsCtrl.getTool()].strokeStart(e);
			fire(e);
			canvas.addEventListener('mousemove',mousemove, false);
			canvas.addEventListener('mouseup',mouseup, false);
		}

		function mousemove(ev){
			var e = createEvent(ev,'stroke');
			tools[toolsCtrl.getTool()].stroke(e);
			fire(e);
		}

		function mouseup(ev){
			var e = createEvent(ev,'strokeEnd');
			tools[toolsCtrl.getTool()].strokeEnd(e);
			updateImgage(context, canvas);
			fire(e);
			canvas.removeEventListener('mousemove',mousemove, false);
			canvas.removeEventListener('mouseup',mouseup, false);
		}

		function fire(ev){
			if(listener.onPaint)
				listener.onPaint(ev);
		}

		function updateImgage(ctx, subCanvas){
				contexto.drawImage(subCanvas, 0, 0);
				ctx.clearRect(0, 0, subCanvas.width, subCanvas.height);
		}

		return {
			clear : function(){
				contexto.clearRect(0, 0, canvas.width, canvas.height);
			},
			setCanvasSize: function(c){
				canvas.width = c.width;
				canvas.height = c.height;
			},
			socketPainter : function(){
				var sCanvas = document.createElement("canvas");
				//Add feedback canvas to dom
				sCanvas.className = "socket-canvas";
				sCanvas.width = canvaso.width;
				sCanvas.height = canvaso.height;
				canvaso.parentNode.appendChild(sCanvas);
				var ctx = sCanvas.getContext("2d"),
					tools = createTools(ctx);
				ctx.lineCap = 'round';
				ctx.lineJoin = 'round';


				return {
					setCanvasSize: function(c){
						sCanvas.width = c.width;
						sCanvas.height = c.height;
					},
					paint: function(sEvent){
						var tool = tools[sEvent.tool],
						strokeFunc = tool[sEvent.type];
						if (strokeFunc) {
							tool.color = sEvent.color;
							ctx.strokeStyle = "rgba("+sEvent.color.join(',')+",1)";
							ctx.lineWidth = sEvent.lineWidth;
							strokeFunc(sEvent);
							if(sEvent.type==='strokeEnd'){
								updateImgage(ctx, sCanvas);
							}
						}
					}
				};

			}
		};

	};
}

module.exports = painter(document);
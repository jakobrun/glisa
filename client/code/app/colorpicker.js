var util = require("./myutil");

function colorPicker(util, Image) {
	'use strict';
	
	//Color picker
	return function (canvas){
		var listener,
			imageObj = new Image();
		imageObj.onload = function(){
			init(this);
		};
		imageObj.src = "/img/color_picker.png";

		function init(imageObj){
			var padding = 0;
			var context = canvas.getContext("2d");
			var mouseDown = false;
 
			context.strokeStyle = "#444";
			context.lineWidth = 2;
 
			canvas.addEventListener("mousedown", function(){
				mouseDown = true;
			}, false);
 
			canvas.addEventListener("mouseup", function(evt){
				getColor(evt);
				mouseDown = false;
			}, false);
 
			canvas.addEventListener("mousemove", getColor, false);

			canvas.addEventListener("touchstart", function(evt){
				mouseDown = true;
				evt.preventDefault();
				getColor(evt.touches[0]);
			}, false);

			canvas.addEventListener("touchmove", function(evt){
				evt.preventDefault();
				getColor(evt.touches[0]);
			}, false);

			canvas.addEventListener("touchend", function(evt){
				evt.preventDefault();
				mouseDown = false;
			}, false);

			function getColor(evt){
				var mousePos = util.getMousePos(canvas, evt);
 
				if (mouseDown &&
					mousePos !== null &&
					mousePos.x > padding &&
					mousePos.x < padding + imageObj.width &&
					mousePos.y > padding &&
					mousePos.y < padding + imageObj.height) {
					/*
					* color picker image is 256x256 and is offset by 0px
					* from top and bottom
					*/
					var imageData = context.getImageData(padding, padding, imageObj.width, imageObj.width),
						data = imageData.data,
						x = mousePos.x - padding,
						y = mousePos.y - padding,
						color =[data[((imageObj.width * y) + x) * 4],/*Red*/
								data[((imageObj.width * y) + x) * 4 + 1],/*Green*/
								data[((imageObj.width * y) + x) * 4 + 2]/*blue*/];
					setColor(color);
				}
			}
 
			context.drawImage(imageObj, padding, padding);
			setColor([0,0,0]/*Black*/);
		}

		function setColor(color){
			if(listener)
				listener(color);
		}

		return {
			onChange : function(cb){
				listener = cb;
			}
		};
	};
}

module.exports = colorPicker(util, Image);
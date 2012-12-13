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

			function getColor(evt){
				var mousePos = util.getMousePos(canvas, evt);
				var color;
 
				if (mouseDown &&
					mousePos !== null &&
					mousePos.x > padding &&
					mousePos.x < padding + imageObj.width &&
					mousePos.y > padding &&
					mousePos.y < padding + imageObj.height) {
					/*
					* color picker image is 256x256 and is offset by 10px
					* from top and bottom
					*/
					var imageData = context.getImageData(padding, padding, imageObj.width, imageObj.width);
					var data = imageData.data;
					var x = mousePos.x - padding;
					var y = mousePos.y - padding;
					var red = data[((imageObj.width * y) + x) * 4];
					var green = data[((imageObj.width * y) + x) * 4 + 1];
					var blue = data[((imageObj.width * y) + x) * 4 + 2];
					color = "rgb(" + red + "," + green + "," + blue + ")";
				}
 
				if (color) {
					drawColorSquare(canvas, color, imageObj);
				}
			}
 
			context.drawImage(imageObj, padding, padding);
			drawColorSquare(canvas, "black", imageObj);
		}

		function drawColorSquare(canvas, color, imageObj){
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
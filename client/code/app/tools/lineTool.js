//Line
function ToolLine(ctx, canvas){
	'use strict';

	var tool = this;

	// Strart stroke.
	this.strokeStart = function (ev) {
		tool.x0 = ev._x;
		tool.y0 = ev._y;
	};

	// draw
	this.stroke = function (ev) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.beginPath();
		ctx.moveTo(tool.x0, tool.y0);
		ctx.lineTo(ev._x,   ev._y);
		ctx.stroke();
		ctx.closePath();
	};

	// End draw
	this.strokeEnd = function (ev) {
	};

}

module.exports = ToolLine;
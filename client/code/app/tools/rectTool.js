//Rect
function ToolRect(ctx, canvas) {
	'use strict';
	var tool = this;

	function clear(){
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}

	// Start.
	this.strokeStart = function (ev) {
		tool.x0 = ev._x;
		tool.y0 = ev._y;
	};

	// Stroke
	this.stroke = function (ev) {
		var x = Math.min(ev._x,  tool.x0),
			y = Math.min(ev._y,  tool.y0),
			w = Math.abs(ev._x - tool.x0),
			h = Math.abs(ev._y - tool.y0);

		clear();

		if (!w || !h) {
			return false;
		}

		ctx.strokeRect(x, y, w, h);
		return true;
	};

	// End
	this.strokeEnd = function (ev) {
	};
}
module.exports = ToolRect;
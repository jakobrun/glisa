function ToolPencil (ctx) {
	'use strict';

	// Start
	this.strokeStart = function (ev) {
		ctx.beginPath();
		ctx.moveTo(ev._x, ev._y);
	};

	// draw
	this.stroke = function (ev) {
		ctx.lineTo(ev._x, ev._y);
		ctx.stroke();
	};

	// End
	this.strokeEnd = function (ev) {
	};
}

module.exports = ToolPencil;

function ToolPencil (ctx) {
	'use strict';

	var tool = this,
		points = [],
		count = 0;

	// Start
	this.strokeStart = function (ev) {
		tool.prevMouseX = ev._x;
		tool.prevMouseY = ev._y;
	};

	// draw
	this.stroke = function (ev) {
		var i, dx, dy, d;

		points.push( [ ev._x, ev._y ] );

		ctx.strokeStyle = "rgba("+ev.color.join(',')+", 0.05)";
		
		ctx.beginPath();
		ctx.moveTo(tool.prevMouseX, tool.prevMouseY);
		ctx.lineTo(ev._x, ev._y);
		ctx.stroke();

		for (i = 0; i < points.length; i++){
			dx = points[i][0] - points[count][0];
			dy = points[i][1] - points[count][1];
			d = dx * dx + dy * dy;

			if (d < 4000 && Math.random() > (d / 2000)){
				ctx.beginPath();
				ctx.moveTo( points[count][0] + (dx * 0.3), points[count][1] + (dy * 0.3));
				ctx.lineTo( points[i][0] - (dx * 0.3), points[i][1] - (dy * 0.3));
				ctx.stroke();
			}
		}

		tool.prevMouseX = ev._x;
		tool.prevMouseY = ev._y;

		count++;
	};

	// End
	this.strokeEnd = function (ev) {
	};
}

module.exports = ToolPencil;

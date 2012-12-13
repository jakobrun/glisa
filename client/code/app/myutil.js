
function myutil(win) {
	'use strict';

	var util = {
		getMousePos : function (obj,evt){
			var offset = util.getPageOffset(obj);

			// return relative mouse position
			var mouseX = evt.clientX - offset.x + win.pageXOffset;
			var mouseY = evt.clientY - offset.y + win.pageYOffset;
			return {
				x: mouseX,
				y: mouseY
			};
		},

		getPageOffset : function (node,offset){
			var os = offset || {x: 0,y: 0};
			os.x += node.offsetLeft;
			os.y += node.offsetTop;

			if(node.offsetParent)
				return util.getPageOffset(node.offsetParent,os);
			return os;
		}
	};
	return util;
}

module.exports = myutil(window);
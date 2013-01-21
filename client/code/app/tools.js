/*global require, module, $, window*/
var colorpicker = require("./colorpicker"),
	inst;

function tools(contextElm, win, $) {
	'use strict';

	var	currenttool = 'sketch',
		currentColor = [0, 0, 0],
		currentLineWidth = 1,
		colorbutton = contextElm.find(".colorsel"),
		toolsElm = contextElm.find(".tool"),
		lineWidth = contextElm.find(".lw"),
		listener,
		cp;

	function toolClick(tool) {
		return function (e) {
			toolsElm.find('.on').removeClass("on");
			$(this).addClass('on');
			currenttool = tool;
		};
	}

	function lwClick(lw) {
		return function (e) {
			lineWidth.find(".on").removeClass("on");
			$(this).addClass("on");
			currentLineWidth = lw;
		};
	}

	//New
	contextElm.find('button.new').click(function (e) {
		if (listener && win.confirm('New canvas?')) {
			listener.onClear();
		}
	});

	//Pencil click
	toolsElm.find('.tool-pencil').click(toolClick('pencil'));

	//Pencil click
	toolsElm.find('.tool-sketch').click(toolClick('sketch'));

	//Rect click
	toolsElm.find('.tool-rect').click(toolClick('rect'));

	//Line click
	toolsElm.find('.tool-line').click(toolClick('line'));

	//Color picker
	cp = colorpicker(contextElm.find(".color-canvas canvas").get(0));
	cp.onChange(function (color) {
		colorbutton.css('background-color', "rgba(" + color.join(",") + ",1)");
		currentColor = color;
	});

	//Line width
	lineWidth.find(".lw-1").click(lwClick(1));
	lineWidth.find(".lw-2").click(lwClick(3));
	lineWidth.find(".lw-3").click(lwClick(5));
	lineWidth.find(".lw-4").click(lwClick(7));

	return {
		getTool : function () {
			return currenttool;
		},
		getColor : function () {
			return currentColor;
		},
		getLineWidth : function () {
			return currentLineWidth;
		},
		setListener : function (newListener) {
			listener = newListener;
		}
	};
}
module.exports = function () {
	'use strict';
	inst = inst || tools($('.toolbar'), window, $);
	return inst;
};
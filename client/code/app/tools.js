var colorpicker = require("./colorpicker"),
	_inst;

function tools (contextElm, win, $) {
	'use strict';

	var		currenttool = 'sketch',
			currentColor = [0,0,0],
			currentLineWidth = 1,
			colorbutton = contextElm.find(".colorsel"),
			listener;

	function toolClick(tool){
		return function(e){
			contextElm.find('button.on').removeClass("on");
			$(this).addClass('on');
			currenttool = tool;
		};
	}

	//New
	contextElm.find('button.new').click( function (e){
		if(listener && win.confirm('New canvas?')){
			listener.onClear();
		}
	});

	//Pencil click
	contextElm.find('button.pencil').click(toolClick('pencil'));

	//Pencil click
	contextElm.find('button.sketch').click(toolClick('sketch'));

	//Rect click
	contextElm.find('button.rect').click(toolClick('rect'));

	//Line click
	contextElm.find('button.line').click(toolClick('line'));

	//Color picker
	var cp = colorpicker(contextElm.find(".color-canvas canvas").get(0));
	cp.onChange(function(color){
		colorbutton.css('background-color',"rgba("+color.join(",")+",1)");
		currentColor = color;
	});

	//Line width
	var lineWidth = contextElm.find('div.line-width input');
	lineWidth.change( function(e){
		currentLineWidth = lineWidth.val();
	});

	return {
		getTool : function(){
			return currenttool;
		},
		getColor : function(){
			return currentColor;
		},
		getLineWidth : function(){
			return currentLineWidth;
		},
		setListener : function(newListener) {
			listener = newListener;
		}
	};
}
module.exports = function(){
	_inst = _inst || tools($('.toolbar'),window,$);
	return _inst;
};
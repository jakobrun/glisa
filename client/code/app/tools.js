var colorpicker = require("./colorpicker"),
	_inst;

function tools (contextElm, win, $) {
	'use strict';

	var		currenttool = 'brush',
			currentColor = [0,0,0],
			currentLineWidth = 1,
			colorbutton = contextElm.find(".colorsel"),
			listener;

	function setOn(button){
		contextElm.find('button.on').removeClass("on");
		$(button).addClass('on');
	}

	//New
	contextElm.find('button.new').click( function (e){
		if(listener && win.confirm('New canvas?')){
			listener.onClear();
		}
	});

	//Brush click
	contextElm.find('button.brush').click( function (e){
		setOn(this);
		currenttool = 'brush';
	});

	//Rect click
	contextElm.find('button.rect').click(function(e){
		setOn(this);
		currenttool = 'rect';
	});

	//Line click
	contextElm.find('button.line').click(function(e){
		setOn(this);
		currenttool = 'line';
	});

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
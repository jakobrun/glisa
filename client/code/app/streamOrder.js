var _ = require('underscore');

function timeOrder(e){
	return e.time;
}

function streamOrder(next) {
	'use strict';
	var buffer = [];

	function check(){
		if(buffer.length===0){
			return;
		}

		if(buffer[0]._realTime+600 < Date.now()){
			var v = buffer.shift();
			delete v._realTime;
			next(v);
			check();
		} else {
			setTimeout(check,600);
		}
	}


	return function(data){
		data._realTime = Date.now();
		buffer.push(data);
		buffer = _.sortBy(buffer,timeOrder);
		check();
	};
}

module.exports = streamOrder;
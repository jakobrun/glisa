//Counter
module.exports = function counter(prefix){
	'use strict';
	var c = 0;
	return function(){
		c++;
		return prefix+c;
	};
};
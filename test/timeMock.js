
var time = {
		currentTime: 0,
		setTimeout: setTimeout,
		now: Date.now
	};
console.log('mock time');

setTimeout = function (f,t) {
	console.log('mock setTimeout: ',t);
	time.currentTimeout = t;
	time.currentTimeoutFunc = f;
};

Date.now = function(){
	return time.currentTime;
};

module.exports = time;


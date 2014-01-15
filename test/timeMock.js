'use strict';
var realNow = Date.now,
    realSettimeout = setTimeout,
    time = {
        currentTime: 0,
        reset: function() {
            setTimeout = realSettimeout;
            Date.now = realNow;
        }
    };
console.log('mock time');

setTimeout = function(f, t) {
    console.log('mock setTimeout: ', t);
    time.currentTimeout = t;
    time.currentTimeoutFunc = f;
};

Date.now = function() {
    return time.currentTime;
};

module.exports = time;
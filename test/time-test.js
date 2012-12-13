var time = require('../time');

describe('time', function () {
	it('should return now', function(){
		var diff = Date.now()-time.now();
		diff.should.be.within(-30, 0);
	});

	it('should timeout', function(done){
		var t = time.now();
		time.setTimeout(function(){
			var diff = time.now()-t;
			diff.should.be.within(198,202);
			done();
		},200);
	});
});
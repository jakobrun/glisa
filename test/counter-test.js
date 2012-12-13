var counter = require('../server/util/counter');

describe('counter', function () {
	var a = counter('a'),
		b = counter('b');
	it('should increment', function(){
		a().should.equal('a1');
		a().should.equal('a2');
		b().should.equal('b1');
	});
});
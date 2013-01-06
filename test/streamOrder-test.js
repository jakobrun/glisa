var streamOrder = require('../client/code/app/streamOrder');

describe('stream order', function () {

	it('should ensure stream timeorder', function(done){
		'use strict';
		var t = Date.now();
		var input = [
			{time: 110},
			{time: 101},
			{time: 114}
		],
		expextedOutput = [
			{time: 101},
			{time: 110},
			{time: 114}
		],
		output = [];

		//pipe next
		var pipe = streamOrder(function(data){
			output.push(data);
			if(output.length===3){
				//Assert output
				output.should.eql(expextedOutput);
				done();
			}
		});

		//start stream
		input.forEach(function(data){
			pipe(data);
		});


	});
});
'use strict';
var User = require('./model').User,
	async = require('async')

async.map([
	{name: 'Foo Bar'},
	{name: 'Ping pong'},
	{name: 'Ding dong'}], User.addGoogleUser, function (err, resArr) {
		if(err) console.log(err);
		else console.log('done');
	});
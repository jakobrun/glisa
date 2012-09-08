
var mongojs = require('mongojs'),
	config = require('./config');
	c = mongojs.connect(config.mongo.connectionString,['user']);
'use strict';

function User () {
	
}

User.find = function(source, id, cb){
	c.user.findOne({source: source, sourceid: id}, function(err, doc){
		cb(err,doc);
	});
};

User.findById = function(id, cb){
	c.user.findOne({_id: c.ObjectId(id)},cb);
};

User.addGoogleUser = function(gu, cb){
	var u = {
		name : gu.name,
		source : 'google',
		sourceid : gu.id,
		firstName : gu.given_name,
		lastName : gu.family_name,
		link : gu.link,
		picture : gu.picture,
		gender : gu.gender,
		lastmodified : new Date(),
		createtime : new Date()
	};

	c.user.save(u, function(err, doc){
		cb(err,doc);
	});
};

exports.User = User;
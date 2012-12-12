
var mongojs = require('mongojs'),
	async = require('async'),
	config = require('./config'),
	_ = require('underscore'),
	c = mongojs.connect(config.mongo.connectionString,['user']);
'use strict';

function User () {
	
}

User.findOne = function(){
	if(arguments.length===2){
		c.user.findOne(arguments[0], arguments[1]);
	}else{
		c.user.findOne(arguments[0], arguments[1], arguments[2]);
	}
};

User.findBySourceId = function (source, id, cb){
	c.user.findOne({source: source, sourceid: id}, function(err, doc){
		cb(err,doc);
	});
};

User.findById = function (id, cb){
	c.user.findOne({_id: c.ObjectId(id)},cb);
};

User.findByName = function (name, userid, cb){
	var q = new RegExp(name,"i");
	c.user.find({name: q, _id: {$ne: userid}}, {friends:0}, cb);
};

User.update = function (doc, cb){
	c.user.update({_id: doc._id}, doc, {multy: false}, cb);
};

User.addFriend = function (user, friend, cb) {
	async.map([
			{user: user, friend: friend, status: 'request'},
			{user: friend, friend: user, status: 'requesting'}
			], saveFriendRequest, cb);
};

function saveFriendRequest (input, cb) {
	var fr = input.friend;
	input.user.friends = input.user.friends || [];
	var f = {_id: fr._id,name: fr.name, picture: fr.picture, status: input.status};
	input.user.friends.push(f);
	User.update(input.user, function (err) {
		cb(err, input.user);
	});
}

User.acceptFriend = function (user, friendreq, cb) {
	c.user.findOne({_id: typeof(friendreq._id)==='string'?c.ObjectId(friendreq._id):friendreq._id}, function(err, friend){
		var userFriendReq = User.findFriend(friend, user._id);
		if(!userFriendReq) cb('Friend user friendreq not found, id: '+user._id);
		else{
			userFriendReq.status = 'friend';
			friendreq.status = 'friend';
			async.map([user,friend], User.update, function (err,data){
				cb(err,friendreq);
			});
		}
	});
};

User.removeFriend = function(user, friend, cb) {
	function rf(inp, cb){
		var u = inp.user;
		var f = User.findFriend(u,inp.friend._id);
		var i = u.friends.indexOf(f);
		u.friends.splice(i,1);
		User.update(u, function(err){
			cb(err,u);
		});
	}
	async.map([
			{user: user,friend: friend},
			{user: friend,friend: user}
		],rf,cb);
};

User.findFriend = function(user, id){
	return _.find(user.friends,function (f) {
		return (f._id.toString() == id.toString());
	});
};

User.addGoogleUser = function (gu, cb){
	var u = {
		name : gu.name,
		source : 'google',
		sourceid : gu.id,
		firstName : gu.given_name,
		lastName : gu.family_name,
		link : gu.link,
		picture : gu.picture || '/img/user.png',
		gender : gu.gender,
		lastmodified : new Date(),
		createtime : new Date()
	};

	c.user.save(u, function(err, doc){
		cb(err,doc);
	});
};

User.insertAll = function (docs,cb) {
	async.mapSeries(docs,function (doc, subCb){
		c.user.insert(doc,subCb);
	}, cb);
};

User.removeAll = function () {
	c.user.remove({});
};

exports.User = User;
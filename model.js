
var mongojs = require('mongojs'),
	async = require('async'),
	config = require('./config'),
	time = require('./time'),
	_ = require('underscore'),
	c = mongojs.connect(config.mongo.connectionString,['user']);
'use strict';

function User () {
	
}

User.logAllOut = function(cb){
	c.user.update({'online': true}, {$set : {'online': false}},{multi: true}, cb);
};

User.findAll = function(cb){
	c.user.find(cb);
};

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

User.login = function(id, cb){
	User.findById(id, function(err, doc){
		if(err){
			cb(err);
		}else if(doc.online){
			cb(err,doc);
		}else{
			doc.online = true;
			User.updateOnline(doc, cb);
		}
	});
};

User.logout = function(user, cb){
	user.online = false;
	User.updateOnline(user, cb);
};

User.tick = function(user, cb, tcb) {
	user.onlinetime = time.now();
	c.user.update({_id: user._id}, { $set: {onlinetime: user.onlinetime}}, function(err){
		if(cb)
			cb(err, user);
	});
	time.setTimeout( function(){
		User.findById(user._id.toString(), function(err, user){
			var diff = time.now() - (user? user.onlinetime: 0);
			if(diff > 28000){
				User.logout(user,tcb);
			}

		});
	}, 30000);
};

User.updateOnline = function(user, cb){
	console.log(user.name, 'online:', user.online);
	c.user.update({_id: user._id}, { $set : {online: user.online}}, function(err){
		if(cb)
			cb(err, user);
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
	c.user.update({_id: doc._id}, doc, {multi: false}, cb);
};

User.findFriendsOnlineStatus = function(user, cb){
	var query = {_id: { $in: _.map(user.friends, function(f){return f._id;}) }};
	c.user.find(query,{friends: 0}, function(err, list){
		if(err) cb(err);
		else{
			list.forEach(function(friend){
				var f = User.findFriend(user, friend._id);
				f.online = friend.online;
				f.onlinetime = friend.onlinetime;
			});
			cb(err, user);
		}
	});
};

User.findOnlineFriends = function (user, cb) {
	c.user.find({'friends._id': user._id, 'online': true}, cb);
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
'user strict';
var express = require("express"),
	connect = require("connect"),
	model = require("./model"),
	app = express(),
	MemoryStore = express.session.MemoryStore,
	sessionStore = new MemoryStore(),
	http = require('http'),
	server = http.createServer(app),
	io = require('socket.io').listen(server),
	cookie = require('cookie'),
	everyauth = require('everyauth'),
	config = require("./config"),
	port = process.env.PORT || 8000,
	log = console.log,
	_ = require('underscore'),
	socketsById = {};

//Everyauth
everyauth.everymodule.findUserById( function (id, callback) {
		model.User.findById(id,function(err, doc){
			log('Found user');
			log(doc);
			callback(err, doc);
		});
	});
everyauth.everymodule.userPkey('_id');
everyauth.google
  .appId(config.google.appId)
  .appSecret(config.google.secret)
  .scope('https://www.googleapis.com/auth/userinfo.profile')
  .findOrCreateUser( function (sess, accessToken, extra, googleUser) {
    googleUser.refreshToken = extra.refresh_token;
    googleUser.expiresIn = extra.expires_in;

    var promise = new this.Promise();
    model.User.findBySourceId('google', googleUser.id,function(err, doc){
		if(err) promise.fail(err);
		else if(doc) promise.fulfill(doc);
		else{
			model.User.addGoogleUser(googleUser, function(err, doc){
				if(err) promise.fail(err);
				else promise.fulfill(doc);
			});
		}
    });
    return promise;
  })
  .redirectPath('/app/');

//Express config
app.configure(function () {
	app.use(express.json())
		.use(express.urlencoded())
		.use(express.cookieParser('snildineina'))
		.use(express.session({store: sessionStore,key: 'express.sid', secret: 'snildineina'}))
		.use(everyauth.middleware(app))
		.use(app.router)
		.use(express['static'](__dirname + "/public"))
		.use(express.errorHandler({
			dumpExceptions: true,
			showStack: true
		}));
		
	//set path to the views (template) directory
	app.set('view engine', 'jade');
});

//Login redirects
app.get("/", function(req, res, next){
	if(req.session.auth && req.session.auth.loggedIn)
		res.redirect('/app/');
	else
		next();
});
app.all("/app/*", function(req, res, next){
	if(req.session.auth && req.session.auth.loggedIn)
		next();
	else
		res.redirect("/");
});

//find users
app.get('/app/findusers', function(req, res){
	model.User.findByName(req.param('name'), req.user._id, function(err,docs){
		res.send(docs);
	});
});


//Configure sockets
io.configure(function (){
	io.set('authorization', function (data, accept) {
		if (data.headers.cookie) {
			var yourCookiesObject = connect.utils.parseSignedCookies(cookie.parse(decodeURIComponent(data.headers.cookie)),'snildineina');
			data.sessionID = yourCookiesObject['express.sid'];
			sessionStore.get(data.sessionID, function(err, session){
				if(err || !session){
					log("get session error: " + err);
					accept("Error", false);
				} else {
					log("connect session to socket");
					data.session = session;
					data.auth = session.auth;
					accept(null, true);
				}
			});
		} else {
			accept('No cookie transmitted.', false);
		}
	});
});

//Open socket connection
io.sockets.on('connection', function (socket) {
	console.log((new Date()) + ' Connection');

	var hs = socket.handshake;
	if(!hs.auth)
		return;

	model.User.findById(hs.auth.userId, function(err, doc){
		socket.user = doc;
		socket.socketUser = new SocketUser(doc, socket);
		doc.friends.forEach( function (f){
			var fSocket = socketsById[f._id];
			if(fSocket){
				f.online = true;
				fSocket.emit('friend-status-change',{_id: doc._id, online: true});
			}else{
				f.online = false;
			}
		});
		socketsById[doc._id] = socket;
		socket.emit('open',{status:'open', user: doc});
	});

	//Add friend
	socket.on('add-friend', function (data){
		model.User.findById(data.id, function (err, friend){
			if(err) log(err);
			else{
				model.User.addFriend(socket.user,friend, function (err, users /*array*/){
					if(err) log(err);
					else{
						socket.user = users[0];
						socket.emit('friend-added', friend);
						var friendSocket = socketsById[friend._id];
						if(friendSocket){
							friendSocket.user = users[1];
							friendSocket.emit('friend-request',socket.user);
						}
					}
				});
			}
		});
	});

	//Confirm friend request
	socket.on('confirm-friend', function (data){
		var fr = model.User.findFriend(socket.user,data._id);
		if(!fr){
			log("Did not find friend by id: "+data._id);
			return;
		}

		model.User.acceptFriend(socket.user, fr, function (err, friendreq){
			if(err){
				log(err);
				return;
			}
			var friendsocket = socketsById[friendreq._id];
			if(friendsocket)
				friendsocket.emit('friend-confirmed', socket.user);
		});
	});

	//Remove friend
	socket.on('remove-friend', function (data){
		model.User.findById(data._id, function (err, friend){
			model.User.removeFriend(socket.user, friend, function (err, users){
				if(err){
					log(err);
					return;
				}
				socket.user = users[0];
				socket.emit('friend-removed', users[1]);
				var friendsocket = socketsById[users[1]._id];
				if(friendsocket){
					friendsocket.user = users[1];
					friendsocket.emit('friend-removed', socket.user);
				}
			});
		});
	});

	//Create room
	socket.on('create-room', function (data){
		var channel = new Channel(),
			friendSocket = socketsById[data._id];
		channel.addUser(socket.socketUser);
		if(friendSocket)
			channel.addUser(friendSocket.socketUser);
		
		log("emit init: "+channel.id);
		var users = _.map(channel.socketusers,function(su){return su.user;});
		channel.emit('init',{id: channel.id, users: users});
	});

	//Disconnect
	socket.on('disconnect', function(){
		delete socketsById[socket.user._id];
		var channels = socket.socketUser.channelsById;
		for(var id in channels){
			channels[id].removeUser(socket.socketUser);
		}
		socket.user.friends.forEach(function (f){
			var fSocket = socketsById[f._id];
			if(fSocket)
				fSocket.emit('friend-status-change', {_id: socket.user._id, online: false});
		});
	});

	//Message
	socket.on('msg', function(data){
		socket.socketUser.emitAll('msg',data);
	});

	//Paint
	socket.on('paint', function(data){
		socket.socketUser.emit('paint',data);
	});

	//Clear
	socket.on('clear', function(){
		socket.socketUser.emit('clear',{});
	});
});

//channel
function Channel(){
	this.id = Channel.counter();
	this.socketusers = [];
}
Channel.counter = counter("r");
Channel.prototype.addUser = function(socketUser){
	this.socketusers.push(socketUser);
	socketUser.channelsById[this.id] = this;
	log("emit newuser: "+socketUser.user.name);
	this.emit('newuser',socketUser.user);

};
Channel.prototype.removeUser = function(socketUser){
	var index = this.socketusers.indexOf(socketUser);
	delete socketUser.channelsById[this.id];
	this.socketusers.splice(index,1);

	this.emit('useroff',socketUser.user);
};
Channel.prototype.emit = function(type,msg,user){
	for (var i = this.socketusers.length - 1; i >= 0; i--) {
		if(this.socketusers[i]===user)
			continue;

		this.socketusers[i].socket.emit(type,msg);
	}
};

//User
function SocketUser(user, socket){
	this.socket = socket;
	this.user = {name: user.name,_id: user._id,picture: user.picture};
	this.channelsById = {};
}
SocketUser.prototype.emitAll = function (type, data){
	this.emit(type,data,true);
};

SocketUser.prototype.emit = function (type, data, all){
	data.user = this.user;
	data.time = (new Date()).getTime();
	var c = this.channelsById[data.id];
	if(c) c.emit(type, data, all? null : this);
};

//Counter
function counter(prefix){
	var c = 0;
	return function(){
		c++;
		return prefix+c;
	};
}

//Start
server.listen(port, function() {
	log('listening on port: ' + port);
});
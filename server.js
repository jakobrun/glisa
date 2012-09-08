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
	channels = [];

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
    model.User.find('google', googleUser.id,function(err, doc){
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
  .redirectPath('/app/channel.html');

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

app.get("/", function(req,res,next){
	if(req.session.auth && req.session.auth.loggedIn)
		res.redirect('/app/channel.html');
	else
		next();
});

app.all("/app/*", function(req,res,next){
	if(req.session.auth && req.session.auth.loggedIn)
		next();
	else
		res.redirect("/");
});

//get channels
app.get('/init',function(req,res){
	var data = {};
	if(req.user){
		data.user = req.user;
		data.channels = [];
		for(var i = 0; i<channels.length; i++){
			data.channels.push({name: channels[i].name});
		}
	}
	res.send(data);
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
					log(data.auth);
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

	socket.emit('open',{status:'open'});

	//Join channel
	socket.on('join',function(msg){
		var hs = socket.handshake;
		if(!msg.channel || !hs.auth)
			return;

		//Find channel
		var channel = false;
		for (var i = channels.length - 1; i >= 0; i--) {
			if(channels[i].name === msg.channel){
				channel = channels[i];
				break;
			}
		}
		if(channel===false){
			channel = new Channel(msg.channel);
			channels.push(channel);
		}

		//add user
		channel.addUser(socket, hs.auth.google.user.name);
	});

});

//channel
function Channel(name){
	this.name = name;
	this.users = [];
	this.sockets = [];

	// Array with some colors
	this._colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
	// ... in random order
	this._colors.sort(function(a,b) { return Math.random() > 0.5; } );

}
Channel.prototype.addUser = function(socket,username){
	var self = this;
	var color = this._colors.shift();
	var user = new User( username, color);
	log("emit newuser: "+username);
	this.emit('newuser',user);
	this.users.push(user);
	this.sockets.push(socket);

	log("emit init: "+username);
	socket.emit('init',{users: this.users});

	//Disconnect
	socket.on('disconnect', function(){
		self.removeUser(user);
	});

	//Message
	socket.on('msg', function(data){
		data.user = user;
		data.time = (new Date()).getTime();
		self.emit('msg', data);
	});

	//Paint
	socket.on('paint', function(data){
		data.user = user;
		data.time = (new Date()).getTime();
		self.emit('paint', data, user /* not to the user that is painting*/);
	});

	//Clear
	socket.on('clear', function(){
		var data = {user: user,
					time: (new Date()).getTime()};
		self.emit('clear',data, user/* not to the user that is painting*/);
	});
};
Channel.prototype.removeUser = function(user){
	var index = this.users.indexOf(user);
	this._colors.push(user.color);
	this.users.splice(index,1);
	this.sockets.splice(index,1);
	if(this.users.length===0){
		var channelIndex = channels.indexOf(this);
		channels.splice(channelIndex,1);
	}
	this.emit('useroff',user);
};
Channel.prototype.emit = function(type,msg,user){
	for (var i = this.users.length - 1; i >= 0; i--) {
		if(this.users[i]===user)
			continue;

		this.sockets[i].emit(type,msg);
	}
};

//User
function User(username,color){
	this.username = username;
	this.color = color;
}

//Start
server.listen(port, function() {
	log('listening on port: ' + port);
});
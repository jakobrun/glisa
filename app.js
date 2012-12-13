// My SocketStream 0.3 app

var http = require('http'),
    ss = require('socketstream'),
    auth = require('./auth'),
    User = require('./model').User,
    log = console.log;

//Log all out
User.logAllOut();

// Define a single-page client called 'main'
ss.client.define('main', {
  view: 'app.html',
  css:  ['libs/reset.css', 'app.styl'],
  code: ['libs/jquery.min.js','libs/html5slider.js','system', 'app'],
  tmpl: '*'
});

// Serve this client on the root URL
ss.http.route('/', function(req, res){
  res.serveClient('main');
});


ss.http.middleware.prepend(ss.http.connect.bodyParser());
ss.http.middleware.append(auth().middleware());

ss.events.on('disconnect', function(){
	log('disconnect');
});
// Code Formatters
ss.client.formatters.add(require('ss-stylus'));

// Use server-side compiled Hogan (Mustache) templates. Others engines available
ss.client.templateEngine.use(require('ss-hogan'));

// Minimize and pack assets if you type: SS_ENV=production node app.js
if (ss.env === 'production') ss.client.packAssets();

// Start web server
var server = http.Server(ss.http.middleware);
server.listen(3000);

// Start SocketStream
ss.start(server);
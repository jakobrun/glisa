var User = require('./model').User,
	url  = require('url');

function listUsers(req, res){
	User.findAll(function(err, docs){
		var html = "<!doctype html><meta charset=UTF-8/><meta name=viewport content='width=device-width, initial-scale=1.0'/><title>Glisa</title>";
		if(err){
			html += err;
		}else{
			html += "<ul>";
			docs.forEach(function(user){
				html += '<li><a href="/?user='+user._id+'">'+user.name+'</li>';
			});
			html += "</ul>";
		}
		res.end(html);
	});
}
function auth(req,res,next) {
	if(req.url==='/auth/google'){
		listUsers(req,res);
	}else{
		var urlParts = url.parse(req.url, true);
		if(urlParts.query.user){
			req.session.userId = urlParts.query.user;
			req.session.save();
		}
		next();			
	}
}

module.exports = function (){
	return {
		middleware: function(){
			return auth;
		}
	};
};
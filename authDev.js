var User = require('./model').User,
	url  = require('url');

function listUsers(req, res){
	User.findAll(function(err, docs){
		var html = "<html><head></head><body>";
		if(err){
			html += err;
		}else{
			html += "<ul>";
			docs.forEach(function(user){
				html += '<li><a href="/?user='+user._id+'">'+user.name+'</li>';
			});
			html += "</ul>";
		}
		html += "</body></html>";
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
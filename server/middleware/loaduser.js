var User = require('../../model').User;

exports.loaduser = function() {
	return function(req, res, next) {
		if(req.session && (req.session.userId)) {
			User.login(req.session.userId, function(err, doc) {
				if(err) {
					console.log(err);
					res(false);
				} else {
					req.user = doc;
					next();
				}
			});
		} else {
			return res(false);
		}
	};
};
module.exports = {
	setTimeout: setTimeout,
	now: function () {
		return Date.now();
	}
};
function TimeoutMonitor() {
	this._isInit = false;
	this._window = null;
	this._originalSetInterval = null;
	this._originalSetTimeout = null;
}

TimeoutMonitor.prototype.init = function (window) {
	if (this._isInit) {
		throw Error('Already initialized');
	}

	this._isInit = true;
	this._monitorIntervals();
	this._monitorTimeouts();
};

TimeoutMonitor.prototype.reset = function () {
	if (!this._isInit) {
		throw Error('Not yet initialized');
	}

	this._isInit = false;
	this._resetIntervals();
	this._resetTimeouts();
};

TimeoutMonitor.prototype._monitorIntervals = function () {
	const originalSetInterval = this._originalSetInterval = window.setInterval;
};

TimeoutMonitor.prototype._monitorTimeouts = function () {
	const originalSetTimeout = this._originalSetTimeout = window.setTimeout;
};

TimeoutMonitor.prototype._resetIntervals = function () {
	this._window.setInterval = this._originalSetInterval;
};

TimeoutMonitor.prototype._resetTimeouts = function () {
	this._window.setTimeout = this._originalSetTimeout;
};

module.exports = TimeoutMonitor;

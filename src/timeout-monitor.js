const findCallerLocation = require('./find-caller-location');

function TimeoutMonitor(global) {
	this._reset();
	if (global) {
		this.attach(global);
	}
}

TimeoutMonitor.prototype.attach = function (global) {
	if (this._isAttached) {
		throw Error('TimeoutMonitor: Already attached');
	}

	if (!isObjectWithTimeoutMethods(global)) {
		throw Error('TimeoutMonitor: Not a global object')
	}

	this._isAttached = true;
	this._global = global;
	this._originalSetInterval = global.setInterval;
	this._originalClearInterval = global.clearInterval;
	this._originalSetTimeout = global.setTimeout;
	this._originalClearTimeout = global.clearTimeout;

	this._monitorIntervals();
	this._monitorTimeouts();
};

TimeoutMonitor.prototype.detach = function () {
	if (!this._isAttached) {
		throw Error('TimeoutMonitor: Not yet attached');
	}

	this._global.setInterval = this._originalSetInterval;
	this._global.clearInterval = this._originalClearInterval;
	this._global.setTimeout = this._originalSetTimeout;
	this._global.clearTimeout = this._originalClearTimeout;

	this._reset();
};

TimeoutMonitor.prototype.report = function () {
	return {
		intervals: Array.from(this._intervals),
		timeouts: Array.from(this._timeouts)
	};
};

TimeoutMonitor.prototype._reset = function () {
	this._isAttached = false;
	this._global = null;
	this._originalSetInterval = null;
	this._originalClearInterval = null;
	this._originalSetTimeout = null;
	this._originalClearTimeout = null;
	this._intervals = new Map();
	this._timeouts = new Map();
};

TimeoutMonitor.prototype._monitorIntervals = function () {
	const monitor = this;

	monitor._global.setInterval = function (/* callback, interval, ...args */) {
		const intervalId = monitor._originalSetInterval.apply(this, arguments);
		const callLocation = findCallerLocation('setInterval');
		monitor._intervals.set(intervalId, callLocation);
		return intervalId;
	};

	monitor._global.clearInterval = function (intervalId) {
		monitor._intervals.delete(intervalId);
		monitor._originalClearInterval.apply(this, arguments);
	};
};

TimeoutMonitor.prototype._monitorTimeouts = function () {
	const monitor = this;

	monitor._global.setTimeout = function (callback, ...otherArgs) {
		function newCallback () {
			monitor._timeouts.delete(timeoutId);
			callback.apply(this, arguments);
		}
		const timeoutId = monitor._originalSetTimeout.apply(this, [newCallback, ...otherArgs]);
		const callLocation = findCallerLocation('setTimeout');
		monitor._timeouts.set(timeoutId, callLocation);
		return timeoutId;
	}

	monitor._global.clearTimeout = function (timeoutId) {
		monitor._timeouts.delete(timeoutId);
		monitor._originalClearTimeout.apply(this, arguments);
	}
};

function isObjectWithTimeoutMethods(global) {
	return (
		typeof global === 'object' &&
		isAFunction(global.setInterval) &&
		isAFunction(global.clearInterval) &&
		isAFunction(global.setTimeout) &&
		isAFunction(global.clearTimeout)
	);
}

function isAFunction(fn) {
	return typeof fn === 'function';
}

module.exports = TimeoutMonitor;

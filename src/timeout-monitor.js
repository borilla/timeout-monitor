const findCallerLocation = require('./find-caller-location');

function TimeoutMonitor() {
	this._reset();
}

TimeoutMonitor.prototype.init = function (window) {
	if (this._isInit) {
		throw Error('Already initialised');
	}

	this._isInit = true;
	this._window = window;
	this._originalSetInterval = window.setInterval;
	this._originalClearInterval = window.clearInterval;
	this._originalSetTimeout = window.setTimeout;
	this._originalClearTimeout = window.clearTimeout;

	this._monitorIntervals();
	this._monitorTimeouts();
};

TimeoutMonitor.prototype.restore = function () {
	if (!this._isInit) {
		throw Error('Not yet initialised');
	}

	this._window.setInterval = this._originalSetInterval;
	this._window.clearInterval = this._originalClearInterval;
	this._window.setTimeout = this._originalSetTimeout;
	this._window.clearTimeout = this._originalClearTimeout;

	this._reset();
};

TimeoutMonitor.prototype.report = function () {
	return {
		intervals: Array.from(this._intervals),
		timeouts: Array.from(this._timeouts)
	};
};

TimeoutMonitor.prototype._reset = function () {
	this._isInit = false;
	this._window = null;
	this._originalSetInterval = null;
	this._originalClearInterval = null;
	this._originalSetTimeout = null;
	this._originalClearTimeout = null;
	this._intervals = new Map();
	this._timeouts = new Map();
};

TimeoutMonitor.prototype._monitorIntervals = function () {
	const monitor = this;

	monitor._window.setInterval = function (/* callback, interval, ...args */) {
		const intervalId = monitor._originalSetInterval.apply(this, arguments);
		const callLocation = findCallerLocation('setInterval');
		monitor._intervals.set(intervalId, callLocation);
		return intervalId;
	};

	monitor._window.clearInterval = function (intervalId) {
		monitor._intervals.delete(intervalId);
		monitor._originalClearInterval.apply(this, arguments);
	};
};

TimeoutMonitor.prototype._monitorTimeouts = function () {
	const monitor = this;

	monitor._window.setTimeout = function (callback, ...otherArgs) {
		function newCallback () {
			monitor._timeouts.delete(timeoutId);
			callback.apply(this, arguments);
		}
		const timeoutId = monitor._originalSetTimeout.apply(this, [newCallback, ...otherArgs]);
		const callLocation = findCallerLocation('setTimeout');
		monitor._timeouts.set(timeoutId, callLocation);
		return timeoutId;
	}

	monitor._window.clearTimeout = function (timeoutId) {
		monitor._timeouts.delete(timeoutId);
		monitor._originalClearTimeout.apply(this, arguments);
	}
};

function removeFromArrayInPlace(array, value) {
	let toIndex = 0;
	for (let fromIndex = 0; fromIndex < array.length; ++fromIndex) {
		if (array[fromIndex] !== value) {
			array[toIndex] = array[fromIndex];
			++toIndex;
		}
	}
	array.length = toIndex;
}

module.exports = TimeoutMonitor;

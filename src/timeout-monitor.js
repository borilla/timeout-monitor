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
		intervals: this._intervalIds,
		timeouts: this._timeoutIds
	};
};

TimeoutMonitor.prototype._reset = function () {
	this._isInit = false;
	this._window = null;
	this._originalSetInterval = null;
	this._originalClearInterval = null;
	this._originalSetTimeout = null;
	this._originalClearTimeout = null;
	this._intervalIds = [];
	this._timeoutIds = [];
};

TimeoutMonitor.prototype._monitorIntervals = function () {
	const monitor = this;

	monitor._window.setInterval = function (/* callback, interval, ...args */) {
		const intervalId = monitor._originalSetInterval.apply(this, arguments);
		monitor._intervalIds.push(intervalId);
		return intervalId;
	};

	monitor._window.clearInterval = function (intervalId) {
		removeFromArrayInPlace(monitor._intervalIds, intervalId);
		monitor._originalClearInterval.apply(this, arguments);
	};
};

TimeoutMonitor.prototype._monitorTimeouts = function () {
	const monitor = this;

	monitor._window.setTimeout = function (callback, ...otherArgs) {
		function newCallback () {
			removeFromArrayInPlace(monitor._timeoutIds, timeoutId);
			callback.apply(this, arguments);
		}
		const timeoutId = monitor._originalSetTimeout.apply(this, [newCallback, ...otherArgs]);
		monitor._timeoutIds.push(timeoutId);
		return timeoutId;
	}

	monitor._window.clearTimeout = function (timeoutId) {
		removeFromArrayInPlace(monitor._timeoutIds, timeoutId);
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

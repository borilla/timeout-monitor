const TimeoutMonitor = require('../src/timeout-monitor');

describe('timeout-monitor', () => {
	let timeoutMonitor;

	beforeEach(() => {
		timeoutMonitor = new TimeoutMonitor();
	});

	it('is a constructor', () => {
		expect(TimeoutMonitor).toBeInstanceOf(Function);
		expect(timeoutMonitor).toBeInstanceOf(TimeoutMonitor);
	});

	it('has an init function', () => {
		expect(timeoutMonitor.init).toBeInstanceOf(Function);
	});

	it('has a report function', () => {
		expect(timeoutMonitor.report).toBeInstanceOf(Function);
	});

	it('has a restore function', () => {
		expect(timeoutMonitor.restore).toBeInstanceOf(Function);
	});

	describe('when init is called', () => {
		let mockWindow;
		let clearInterval, clearTimeout, setInterval, setTimeout;

		beforeEach(() => {
			let nextId = 1000;
			clearInterval = jest.fn();
			clearTimeout = jest.fn();
			setInterval = jest.fn(function () { return nextId++ });
			setTimeout = jest.fn(function () { return nextId++ });
			mockWindow = {
				clearInterval,
				clearTimeout,
				setInterval,
				setTimeout,
			}
			timeoutMonitor.init(mockWindow);
		});

		it('replaces window.setInterval function', () => {
			expect(mockWindow.setInterval).not.toEqual(setInterval);
		});

		it('replaces window.clearInterval function', () => {
			expect(mockWindow.clearInterval).not.toEqual(clearInterval);
		});

		it('replaces window.setTimeout function', () => {
			expect(mockWindow.setTimeout).not.toEqual(setTimeout);
		});

		it('replaces window.clearTimeout function', () => {
			expect(mockWindow.clearTimeout).not.toEqual(clearTimeout);
		});

		it('initially has no uncleared intervals or timeouts', () => {
			expect(timeoutMonitor.report()).toEqual({
				intervals: [],
				timeouts: []
			});
		});

		describe('then setInterval is called', () => {
			const interval = 500, arg1 = 'foo', arg2 = 'bar';
			let callback, intervalId;

			beforeEach(() => {
				callback = jest.fn();
				intervalId = mockWindow.setInterval(callback, interval, arg1, arg2);
			});

			it('calls the original setInterval function', () => {
				expect(setInterval).toHaveBeenCalledTimes(1);
				expect(setInterval).toHaveBeenCalledWith(callback, interval, arg1, arg2)
			});

			it('returns the interval ID from the original function', () => {
				const returnVal = setInterval.mock.results[0].value;
				expect(intervalId).toEqual(returnVal);
			});

			it('adds the returned interval ID to uncleared intervals', () => {
				expect(timeoutMonitor.report().intervals).toEqual([ intervalId ]);
			});

			describe('then clearInterval is called with the returned interval ID', () => {
				beforeEach(() => {
					mockWindow.clearInterval(intervalId);
				});

				it('calls the original clearInterval function', () => {
					expect(clearInterval).toHaveBeenCalledTimes(1);
					expect(clearInterval).toHaveBeenCalledWith(intervalId);
				});

				it('removes the interval ID from uncleared intervals', () => {
					expect(timeoutMonitor.report().intervals).toEqual([]);
				});
			});

			describe('then clearInterval is called with an unknown interval ID', () => {
				const unknownIntervalId = 9999;

				beforeEach(() => {
					mockWindow.clearInterval(unknownIntervalId);
				});

				it('still calls the original clearInterval function', () => {
					expect(clearInterval).toHaveBeenCalledTimes(1);
					expect(clearInterval).toHaveBeenCalledWith(unknownIntervalId);
				});

				it('does not change uncleared intervals', () => {
					expect(timeoutMonitor.report().intervals).toEqual([ intervalId ]);
				});
			});
		});

		describe('then setTimeout is called', () => {
			const timeout = 500, arg1 = 'foo', arg2 = 'bar';
			let callback, timeoutId, wrappedCallback;

			beforeEach(() => {
				callback = jest.fn();
				timeoutId = mockWindow.setTimeout(callback, timeout, arg1, arg2);
				wrappedCallback = setTimeout.mock.calls[0][0];
			});

			it('calls the original setTimeout function', () => {
				expect(setTimeout).toHaveBeenCalledTimes(1);
			});

			it('calls the original setTimeout function wth a wrapped callback', () => {
				expect(wrappedCallback).toBeInstanceOf(Function);
				expect(wrappedCallback).not.toEqual(callback);
				expect(setTimeout).toHaveBeenCalledWith(wrappedCallback, timeout, arg1, arg2);
			});

			it('returns the timeout ID from the original function', () => {
				const returnVal = setTimeout.mock.results[0].value;
				expect(timeoutId).toEqual(returnVal);
			});

			it('adds the returned timeout ID to uncleared timeouts', () => {
				expect(timeoutMonitor.report().timeouts).toEqual([ timeoutId ]);
			});

			describe('when the timeout triggers (after interval ms)', () => {
				beforeEach(() => {
					wrappedCallback(arg1, arg2);
				});

				it('calls the original callback function', ()=> {
					expect(callback).toHaveBeenCalledTimes(1);
				});

				it('passes call args to original callback', () => {
					expect(callback).toHaveBeenCalledWith(arg1, arg2);
				});

				it('removes the timeout ID from uncleared timeouts', () => {
					expect(timeoutMonitor.report().timeouts).toEqual([]);
				});
			});

			describe('then clearTimeout is called with the returned timeout ID', () => {
				beforeEach(() => {
					mockWindow.clearTimeout(timeoutId);
				});

				it('calls the original clearTimeout function', () => {
					expect(clearTimeout).toHaveBeenCalledTimes(1);
					expect(clearTimeout).toHaveBeenCalledWith(timeoutId);
				});

				it('removes the timeout ID from uncleared timeouts', () => {
					expect(timeoutMonitor.report().timeouts).toEqual([]);
				});
			});

			describe('then clearTimeout is called with an unknown timeout ID', () => {
				const unknownTimeoutId = 9999;

				beforeEach(() => {
					mockWindow.clearTimeout(unknownTimeoutId);
				});

				it('still calls the original clearTimeout function', () => {
					expect(clearTimeout).toHaveBeenCalledTimes(1);
					expect(clearTimeout).toHaveBeenCalledWith(unknownTimeoutId);
				});

				it('does not change uncleared timeouts', () => {
					expect(timeoutMonitor.report().timeouts).toEqual([ timeoutId ]);
				});
			});
		});

		describe('then restore is called', () => {
			beforeEach(() => {
				timeoutMonitor.restore();
			});

			it('restores window.setInterval function', () => {
				expect(mockWindow.setInterval).toEqual(setInterval);
			});

			it('restores window.clearInterval function', () => {
				expect(mockWindow.clearInterval).toEqual(clearInterval);
			});

			it('restores window.setTimeout function', () => {
				expect(mockWindow.setTimeout).toEqual(setTimeout);
			});

			it('restores window.clearTimeout function', () => {
				expect(mockWindow.clearTimeout).toEqual(clearTimeout);
			});
		});

		describe('if init is called again without restore', () => {
			function callInit() {
				timeoutMonitor.init(mockWindow);
			}

			it('throws an error', () => {
				expect(callInit).toThrow(Error);
			});
		});
	});

	describe('when restore is called before init', () => {
		function callRestore() {
			timeoutMonitor.restore();
		}

		it('throws an error', () => {
			expect(callRestore).toThrow(Error);
		});
	});
});

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

	it('has an attach function', () => {
		expect(timeoutMonitor.attach).toBeInstanceOf(Function);
	});

	it('has a report function', () => {
		expect(timeoutMonitor.report).toBeInstanceOf(Function);
	});

	it('has a detach function', () => {
		expect(timeoutMonitor.detach).toBeInstanceOf(Function);
	});

	describe('when attach is called', () => {
		let mockGlobal;
		let clearInterval, clearTimeout, setInterval, setTimeout;

		beforeEach(() => {
			let nextId = 1000;
			clearInterval = jest.fn();
			clearTimeout = jest.fn();
			setInterval = jest.fn(function () { return nextId++ });
			setTimeout = jest.fn(function () { return nextId++ });
			mockGlobal = {
				clearInterval,
				clearTimeout,
				setInterval,
				setTimeout,
			}
			timeoutMonitor.attach(mockGlobal);
		});

		it('replaces global.setInterval function', () => {
			expect(mockGlobal.setInterval).not.toEqual(setInterval);
		});

		it('replaces global.clearInterval function', () => {
			expect(mockGlobal.clearInterval).not.toEqual(clearInterval);
		});

		it('replaces global.setTimeout function', () => {
			expect(mockGlobal.setTimeout).not.toEqual(setTimeout);
		});

		it('replaces global.clearTimeout function', () => {
			expect(mockGlobal.clearTimeout).not.toEqual(clearTimeout);
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
				intervalId = mockGlobal.setInterval(callback, interval, arg1, arg2);
			});

			it('calls the original setInterval function', () => {
				expect(setInterval).toHaveBeenCalledTimes(1);
				expect(setInterval).toHaveBeenCalledWith(callback, interval, arg1, arg2)
			});

			it('returns the interval ID from the original function', () => {
				const returnVal = setInterval.mock.results[0].value;
				expect(intervalId).toEqual(returnVal);
			});

			it('adds the returned interval to uncleared intervals', () => {
				expect(timeoutMonitor.report().intervals).toEqual([
					[ intervalId, {
						line: expect.any(Number),
						char: expect.any(Number),
						file: 'test/timeout-monitor.test.js'
					}]
				]);
			});

			describe('then clearInterval is called with the returned interval ID', () => {
				beforeEach(() => {
					mockGlobal.clearInterval(intervalId);
				});

				it('calls the original clearInterval function', () => {
					expect(clearInterval).toHaveBeenCalledTimes(1);
					expect(clearInterval).toHaveBeenCalledWith(intervalId);
				});

				it('removes the interval from uncleared intervals', () => {
					expect(timeoutMonitor.report().intervals).toEqual([]);
				});
			});

			describe('then clearInterval is called with an unknown interval ID', () => {
				const unknownIntervalId = 9999;

				beforeEach(() => {
					mockGlobal.clearInterval(unknownIntervalId);
				});

				it('still calls the original clearInterval function', () => {
					expect(clearInterval).toHaveBeenCalledTimes(1);
					expect(clearInterval).toHaveBeenCalledWith(unknownIntervalId);
				});

				it('does not change uncleared intervals', () => {
					expect(timeoutMonitor.report().intervals).toEqual([
						[ intervalId, {
							line: expect.any(Number),
							char: expect.any(Number),
							file: 'test/timeout-monitor.test.js'
						}]
					]);
				});
			});
		});

		describe('then setTimeout is called', () => {
			const timeout = 500, arg1 = 'foo', arg2 = 'bar';
			let callback, timeoutId, wrappedCallback;

			beforeEach(() => {
				callback = jest.fn();
				timeoutId = mockGlobal.setTimeout(callback, timeout, arg1, arg2);
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

			it('adds the returned timeout to uncleared timeouts', () => {
				expect(timeoutMonitor.report().timeouts).toEqual([
					[ timeoutId, {
						line: expect.any(Number),
						char: expect.any(Number),
						file: 'test/timeout-monitor.test.js'
					}]
				]);
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

				it('removes the timeout from uncleared timeouts', () => {
					expect(timeoutMonitor.report().timeouts).toEqual([]);
				});
			});

			describe('then clearTimeout is called with the returned timeout ID', () => {
				beforeEach(() => {
					mockGlobal.clearTimeout(timeoutId);
				});

				it('calls the original clearTimeout function', () => {
					expect(clearTimeout).toHaveBeenCalledTimes(1);
					expect(clearTimeout).toHaveBeenCalledWith(timeoutId);
				});

				it('removes the timeout from uncleared timeouts', () => {
					expect(timeoutMonitor.report().timeouts).toEqual([]);
				});
			});

			describe('then clearTimeout is called with an unknown timeout ID', () => {
				const unknownTimeoutId = 9999;

				beforeEach(() => {
					mockGlobal.clearTimeout(unknownTimeoutId);
				});

				it('still calls the original clearTimeout function', () => {
					expect(clearTimeout).toHaveBeenCalledTimes(1);
					expect(clearTimeout).toHaveBeenCalledWith(unknownTimeoutId);
				});

				it('does not change uncleared timeouts', () => {
					expect(timeoutMonitor.report().timeouts).toEqual([
						[ timeoutId, {
							line: expect.any(Number),
							char: expect.any(Number),
							file: 'test/timeout-monitor.test.js'
						}]
					]);
				});
			});
		});

		describe('then detach is called', () => {
			beforeEach(() => {
				timeoutMonitor.detach();
			});

			it('restores global.setInterval function', () => {
				expect(mockGlobal.setInterval).toEqual(setInterval);
			});

			it('restores global.clearInterval function', () => {
				expect(mockGlobal.clearInterval).toEqual(clearInterval);
			});

			it('restores global.setTimeout function', () => {
				expect(mockGlobal.setTimeout).toEqual(setTimeout);
			});

			it('restores global.clearTimeout function', () => {
				expect(mockGlobal.clearTimeout).toEqual(clearTimeout);
			});
		});

		describe('if attach is called again without detach', () => {
			function callAttach() {
				timeoutMonitor.attach(mockGlobal);
			}

			it('throws an error', () => {
				expect(callAttach).toThrow(Error);
			});
		});
	});

	describe('if detach is called before attach', () => {
		function callDetach() {
			timeoutMonitor.detach();
		}

		it('throws an error', () => {
			expect(callDetach).toThrow(Error);
		});
	});

	describe('if constructor is called with an object', () => {
		let attach, timeoutMonitor, mockGlobal;

		beforeEach(() => {
			attach = jest.spyOn(TimeoutMonitor.prototype, 'attach');
			mockGlobal = {
				clearInterval: jest.fn(),
				clearTimeout: jest.fn(),
				setInterval: jest.fn(),
				setTimeout: jest.fn(),
			};
			timeoutMonitor = new TimeoutMonitor(mockGlobal);
		});

		afterEach(() => {
			jest.restoreAllMocks();
		});

		it('calls attach method with the provided object', () => {
			expect(attach).toHaveBeenCalledTimes(1);
			expect(attach.mock.instances[0]).toEqual(timeoutMonitor);
			expect(attach).toHaveBeenCalledWith(mockGlobal);
		});
	});

	describe('if attach is called with an object that does not have timeout and interval methods', () => {
		function attachToObject() {
			timeoutMonitor.attach({});
		}

		it('throws an error', () => {
			expect(attachToObject).toThrow(Error);
		});
	});
});

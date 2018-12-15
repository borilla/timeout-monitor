const TimeoutMonitor = require('./src/timeout-monitor');

describe('timeout-monitor', () => {
	let mockWindow, timeoutMonitor;

	beforeEach(() => {
		mockWindow = {
			_nextId: 1000,
			clearInterval: jest.fn(),
			clearTimeout: jest.fn(),
			setInterval: jest.fn(function () { return this._nextId++ }),
			setTimeout: jest.fn(function () { return this._nextId++ }),
		}
		timeoutMonitor = new TimeoutMonitor(mockWindow);
	});

	describe('mockWindow', () => {
		it('behaves as expected', () => {
			expect(mockWindow.setInterval()).toEqual(1000);
			expect(mockWindow.setInterval()).toEqual(1001);
			expect(mockWindow.setTimeout()).toEqual(1002);
			expect(mockWindow.setTimeout()).toEqual(1003);
		});
	});

	it('is a constructor', () => {
		expect(TimeoutMonitor).toBeInstanceOf(Function);
	});

	it('has an init function', () => {
		expect(timeoutMonitor.init).toBeInstanceOf(Function);
	});

	it('has a reset function', () => {
		expect(timeoutMonitor.reset).toBeInstanceOf(Function);
	});

	describe('when reset is called before init', () => {
		function callReset() {
			timeoutMonitor.reset();
		}

		it('throws an error', () => {
			expect(callReset).toThrow(Error);
		});
	});
});

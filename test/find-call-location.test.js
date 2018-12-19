const findCallLocation = require('../src/find-call-location');

const SAMPLE_STACK = `
    Error
        at Object.Error [as setInterval] (/timeout-monitor/src/timeout-monitor.js:60:27)
        at Object.setInterval (/timeout-monitor/test/timeout-monitor.test.js:75:29)
        at Object.asyncJestLifecycle (/timeout-monitor/node_modules/jest-jasmine2/build/jasmine_async.js:63:37)
        at resolve (/timeout-monitor/node_modules/jest-jasmine2/build/queue_runner.js:56:12)
        at new Promise (<anonymous>)
        at mapper (/timeout-monitor/node_modules/jest-jasmine2/build/queue_runner.js:43:19)
        at promise.then (/timeout-monitor/node_modules/jest-jasmine2/build/queue_runner.js:87:41)
        at process._tickCallback (internal/process/next_tick.js:68:7)
`;

describe('findCallLocation', () => {
	let stack, result;

	beforeEach(() => {
		stack = SAMPLE_STACK;
		jest.spyOn(global, 'Error').mockReturnValue({ stack });
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('is a function', () => {
		expect(findCallLocation).toBeInstanceOf(Function);
	});

	it('calls global Error() object to get the call-stack', () => {
		result = findCallLocation('setInterval');
		expect(global.Error).toBeCalledTimes(1);
	});

	describe('when a call to the method exists in the stack', () => {
		it('returns the code location where that method was called', () => {
			result = findCallLocation('setInterval');
			expect(result).toEqual('/timeout-monitor/test/timeout-monitor.test.js:75:29')
		});
	});

	describe('when a call to the method does NOT exist in the stack', () => {
		it('returns undefined', () => {
			result = findCallLocation('someOtherMethod');
			expect(result).toBeUndefined();
		});
	});
});

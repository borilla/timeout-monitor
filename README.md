# timeout-monitor

[![npm version](https://badge.fury.io/js/timeout-monitor.svg)](https://badge.fury.io/js/timeout-monitor)

Monitor `setTimeout` and `setInterval` to help detect uncleared timers

## Introduction

`timeout-monitor` is a tool to help detect uncleared timers in your code. It is particularly useful
when running tests where uncleared timers can prevent garbage collection, slow tests down, interfere
with later tests and even prevent the node test process from completing

## Installation

Install using npm:

```sh
npm install timeout-monitor
```

## Usage

### Import class from package

Firstly we need to import the `TimeoutMonitor` class from the `timeout-monitor` package:

```js
const TimeoutMonitor = require('timeout-monitor');
```
or, using ES6 modules

```js
import TimeoutMonitor from 'timeout-monitor';
```

### Create instance and attach it to global object

Then we need to create an instance of `TimeoutMonitor` and attach it to the `global` or `window`
object:

```js
const monitor = new TimeoutMonitor();
monitor.attach(window);
```

For convenience we can also supply the global object in the constructor

```js
const monitor = new TimeoutMonitor(window);
```

Attaching `timeout-monitor` replaces the global  `setInterval`, `clearinterval`, `setTimeout` and
`clearTimeout` functions. The replacements will behave the same as the originals so can be used as
usual by any other code

When a call is made to `setInterval` or `setTimeout`, the monitor will record it and will also
record the code location where the call was made. When a timer is cleared or a timeout is triggered,
the monitor will remove that reference

### Get current uncleared timers

We can call the `report()` method at any time to get currently open intervals and timeouts:

```js
const report = monitor.report());
```

### Detach from global object

Finally, to detach the monitor and restore the original global timer functions, we call the
`detach()` method:

```js
monitor.detach();
```

## Example

To find (and clear) uncleared timers produced by any test in a test suite, in our global test setup
file we can add a `beforeEach` and `afterEach` to run before and after every test, eg:

```js
const TimeoutMonitor = require('timeout-monitor');
const monitor = new TimeoutMonitor();

beforeEach(() => {
    monitor.attach(window);
});

afterEach(() => {
    const report = monitor.report();

    report.intervals.forEach([intervalId, location] => {
        const { file, line, char } = location;
        console.warn('Uncleared call to setInterval at "%s", line %d, column %d', file, line, char);
        window.clearInterval(inervalId);
    });

    report.timeouts.forEach([timeoutId, location] => {
        const { file, line, char } = location;
        console.warn('Uncleared call to setTimeout at "%s", line %d, column %d', file, line, char);
        window.clearTimeout(timeoutId);
    });

    monitor.detach();
});
```

## Combining with Jest or Sinon

If combining `timeout-monitor` with tests using [Jest's timer mocks](https://jestjs.io/docs/en/timer-mocks.html)
or [Sinon's fake timers](https://sinonjs.org/releases/latest/fake-timers/) we will usually
want to attach `timeout-monitor` _before_ the fake timers and detach _after_ the fake timers have
been restored. `timeout-monitor` won't be able to detect calls to fake timers but uncleared fake
timers should not interfere with subsequent tests anyway, so we want `timeout-monitor` to only look
for timers that are set outside the fake implementation

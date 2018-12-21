# timeout-monitor

[![npm version](https://badge.fury.io/js/timeout-monitor.svg)](https://badge.fury.io/js/timeout-monitor)

Monitor `setTimeout` and `setInterval` to help detect uncleared timers

## Introduction

`timeout-monitor` is a tool to help detect uncleared timers in your code. It is particularly useful
when running tests where, apart from using memory and slowing tests down, it is possible that
uncleared timers could interfere with later tests

## Installation

Install using npm:

```sh
npm install timeout-monitor
```

## Usage

Firstly we need to import the `TimeoutMonitor` class from the `timeout-monitor` module:

```js
import TimeoutMonitor from 'timeout-monitor';
/* or */
const TimeoutMonitor = require('timeout-monitor');
```

Then we need to create an instance of `TimeoutMonitor` and attach it to the `global` or `window`
object:

```js
const monitor = new TimeoutMonitor(window);
/* or */
const monitor = new TimeoutMonitor();
monitor.attach(window);
```

Attaching `timeout-monitor` replaces the global  `setInterval`, `clearinterval`, `setTimeout` and
`clearTimeout` functions. The replacements will behave the same as the originals so can be used as
usual by any other code

When a call is made to `setInterval` or `setTimeout`, the monitor will record it and will also
attempt to record the code location where the call was made. When a timer is cleared or a timeout
is triggered, the monitor will remove that reference

We can call the `.report()` method at any time to get currently open intervals and timeouts:

```js
const report = monitor.report());
```

Finally, to detach the monitor and restore the original global timer functions, we call the
`.detach()` method:

```js
monitor.detach();
```

## Example

To find uncleared timers produced by any test in a test suite, in our global test setup file we can
add a `beforeEach` and `afterEach` to run before and after every test, eg:

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
        clearInterval(inervalId);
    });

    report.timeouts.forEach([timeoutId, location] => {
        const { file, line, char } = location;
        console.warn('Uncleared call to setTimeout at "%s", line %d, column %d', file, line, char);
        clearTimeout(timeoutId);
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

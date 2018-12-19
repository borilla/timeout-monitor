const path = require('path');

function findCallerInCallStack(methodName, stack) {
	const line = stack.split('\n').find(str => str.includes('.' + methodName));
	if (line) {
		// bracketed part of line is call-location
		const match = /\(([^\)]+)/.exec(line);
		if (match) {
			return splitCallLocation(match[1]);
		}
	}
}

function splitCallLocation(callLocation) {
	const match = callLocation.match(/:([0-9]+):([0-9]+)$/);
	if (match) {
		const line = +match[1];
		const char = +match[2];
		const absolutePath = callLocation.slice(0, match.index);
		const file = getRelativePath(absolutePath);
		return { line, char, file };
	}
}

function getRelativePath(absolutePath) {
	return path.relative('./', absolutePath).replace(/\\/g, '/');
}

function findCallerLocation(methodName) {
	const stack = Error().stack;
	return findCallerInCallStack(methodName, stack);
}

module.exports = findCallerLocation;

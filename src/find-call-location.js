function findCallerInCallStack(methodName, stack) {
	const line = stack.split('\n').find(str => str.includes('.' + methodName));
	if (line) {
		// bracketed part of line is call-location
		const match = /\(([^\)]+)/.exec(line);
		if (match) {
			return match[1];
		}
	}
}

function findCallLocation(methodName) {
	const stack = Error().stack;
	return findCallerInCallStack(methodName, stack);
}

module.exports = findCallLocation;

const {run} = require('./helpers');

module.exports = () => {
	if (process.argv.TRAVIS !== undefined) {
		return travis();
	}

	return appveyor();
};

function travis() {
	if (!process.env.TRAVIS_PULL_REQUEST) {
    // Building against master last commit
		return run('git log -1 HEAD');
	}

	const cmd = `git log ${process.env.TRAVIS_COMMIT_RANGE}`;
	return run(cmd);
}

function appveyor() {
	if (!process.env.APPVEYOR_PULL_REQUEST_NUMBER) {
		return run('git log -1 HEAD');
	}

	const cmd =
    `git log origin/master...${process.env.APPVEYOR_PULL_REQUEST_HEAD_COMMIT}`;
	return run(cmd);
}

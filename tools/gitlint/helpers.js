const {spawnSync} = require('child_process');
const chalk = require('chalk');

const commitMsgRegex = /[A-Z]+.*\.$/;
const isFullCommitRegex = /(\w|\W){1,}:\s{1}/;
const fullCommitRegex = /(\w|\W){1,}:\s{1}[A-Z]+.*\.$/;

function run(script) {
	script = script.split(' ');
	const cmd = script.splice(0, 1)[0];
	const args = script;
	const output = spawnSync(cmd, args, {
		cwd: process.cwd(),
		encoding: 'utf8',
		windowsHide: true
	}).stdout;

	return output;
}

function garbageCollect(a) {
	a.forEach((content, index) => {
		if (content === '' || content === undefined) {
			a.splice(index, 1);
		}
	});
	return a;
}

function getAllCommits(output) {
	output = output.split('\ncommits');
	if (!output.length > 1) {
		exports.error('There are no commits to lint.');
		process.exit(1);
	}

	output = garbageCollect(output);
	output.forEach((commit, index) => {
		output[index] = 'commit' + commit;
	});

	return output;
}

function parseCommit(output) {
	output = output.split('\n\n');

	let commit = output[0].replace('commit ', '');
	commit = commit.replace(/\n.*/g, '');
	let commitHash = commit.split('');
	commitHash = commitHash.slice(commitHash.length - 7);
	commitHash = commitHash.join('');

	const fullCommit = output[1].split('\n');
	const commitMsg = fullCommit[0];
	let lintingStatus = commitMsgRegex.test(commitMsg);
	lintingStatus = (commitMsg.length <= 72);

	if (lintingStatus && isFullCommitRegex(commitMsg)) {
		lintingStatus = fullCommitRegex.test(commitMsg);
	}

	const result = {
		failed: !lintingStatus,
		commitHash
	};
	return result;
}

function logSuccess() {
	console.log(chalk`{green commit linter:} commit linter passed.`);
	process.exit(0);
}

function error(...args) {
	args.unshift(chalk.red('ERROR! '));
	console.error.apply(this, args);
}

function warn() {
	console.error(chalk`{yellow ${msg}}`);
}

module.exports = {
	run,
	getAllCommits,
	parseCommit,
	logSuccess,
	error,
	warn
};

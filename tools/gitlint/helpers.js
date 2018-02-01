#!/usr/bin/env bash

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

	// Exclude travis Merge ... into ... commit since it will cause
	// linting to fail for change not related to user's.
	if (process.env.TRAVIS_PULL_REQUEST) {
		const travisCommit = output.pop();
		console.log('Removing last commit: ', travisCommit);
	}

	return output;
}

function parseCommit(output) {
	output = output.split('\n\n');

	const reasons = [];
	let commit = output[0].replace('commit ', '');
	commit = commit.replace(/\n.*/g, '');
	let commitHash = commit.split('');
	commitHash = commitHash.slice(6, 13);
	commitHash = commitHash.join('');

	const fullCommit = output[1].split('\n');
	const commitMsg = fullCommit[0];
	let lintingStatus = commitMsgRegex.test(commitMsg);

	if (!lintingStatus) {
		const msg = `${commitHash} does not have capital letter at start or period at the end.`;
		reasons.push(msg);
		lintingStatus = true;
	}

	lintingStatus = (commitMsg.length <= 72);
	if (!lintingStatus) {
		reasons.push(`${commitHash} has commit msg title greater than 72 characters.`);
		lintingStatus = true;
	}

	if (isFullCommitRegex.test(commitMsg)) {
		lintingStatus = fullCommitRegex.test(commitMsg);
		if (!lintingStatus) {
			reasons.push(`${commitHash} does not follow style have capital letter at start or period at the end.`);
		}
	}

	const result = {
		failed: reasons.length > 0,
		reason: reasons.join('\n'),
		commitHash,
		commitMsg
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

function warn(msg) {
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

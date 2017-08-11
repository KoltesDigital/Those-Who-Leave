'use strict';

const { spawn } = require('child_process');

module.exports = function(command, args) {
	return new Promise((resolve, reject) => {
		const cp = spawn(command, args);

		cp.stdout.on('data', (data) => {
			console.log(data.toString());
		});

		cp.stderr.on('data', (data) => {
			console.error(data.toString());
		});

		cp.on('close', (code, signal) => {
			if (code)
				return reject(new Error(command + ' exited with code ' + code + '.'));
			else if (signal)
				return reject(new Error(command + ' was stopped by signal ' + signal + '.'));
			else
				return resolve();
		});
	});
};

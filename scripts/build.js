'use strict';

const { readFile, writeFile } = require('fs');
const makeDir = require('make-dir');
const { join } = require('path');
const rimrafPromise = require('rimraf-promise');
const spawnPromise = require('./spawn-promise');

const shaderFilename = 'shader.stoy';
const uniforms = [
	'synth_Time',
	'synth_Width',
	'synth_Height',
];

console.log('Cleaning build directory.');
rimrafPromise(join('out', '*'))
.then(() => {
	console.log('Creating build directory.');
	return makeDir('out');
})
.then(() => {
	console.log('Preparing shader.');
	return new Promise((resolve, reject) => {
		return readFile(join('shaders', shaderFilename), (err, contents) => {
			if (err)
				return reject(err);

			const lines = contents.toString().split('\n');
			const index = lines.indexOf('');
			lines.splice(0, index + 1);

			let shader = [
				'//! FRAGMENT',
				'uniform float _[' + uniforms.length + '];',
				'vec2 synth_Resolution = vec2(_[1], _[2]);',
			]
			.concat(lines)
			.join('\n')
			.replace(/#ifdef\s+SYNTHCLIPSE_ONLY[\s\S]*?(?:#else([\s\S]*?))?#endif/g, '$1')
			.replace(/\bconst\b/g, '');

			uniforms.forEach((name, index) => {
				const re = new RegExp('\\b' + name + '\\b', 'g');
				shader = shader.replace(re, '_[' + index + ']');
			});

			return writeFile(join('out', 'shader.glsl'), shader, (err) => {
				if (err)
					return reject(err);
				else
					return resolve();
			});
		});
	});
})
.then(() => {
	console.log('Minifying shader.');
	return spawnPromise('node', [
		join('node_modules', 'glsl-unit', 'bin', 'template_glsl_compiler.js'),
		'--input=' + join('out', 'shader.glsl'),
		'--variable_renaming=INTERNAL',
		'--output=' + join('out', 'shader.min.glsl'),
	]);
})
.then(() => {
	console.log('Generating shader header.');
	return new Promise((resolve, reject) => {
		return readFile(join('out', 'shader.min.glsl'), (err, contents) => {
			if (err)
				return reject(err);

			const lines = contents.toString().split('\n');
			const shader = lines[lines.length - 1];

			const headerContents = [
				'static const char *shaderSource = "' + shader + '";',
				'#define UNIFORM_COUNT ' + uniforms.length,
				'float uniforms[UNIFORM_COUNT];'
			];

			uniforms.forEach((name, index) => {
				headerContents.push('#define uniform_' + name + ' uniforms[' + index + ']');
			});

			return writeFile(join('out', 'shader.h'), headerContents.join('\n'), (err) => {
				if (err)
					return reject(err);
				else
					return resolve();
			});
		});
	});
})
.then(() => {
	console.log('Compiling demo.');
	return spawnPromise('cl', [
		'/O1',
		'/Oi',
		'/Oy',
		'/GR-',
		'/GS-',
		'/fp:fast',
		'/QIfist',
		'/arch:IA32',
		'/I.',
		'/FA',
		'/Faout\\intro.asm',
		'/c',
		'/Foout\\intro.obj',
		'src\\intro.cpp',
	]);
})
.then(() => {
	console.log('Linking demo.');
	return spawnPromise('crinkler', [
		'/ENTRY:entry',
		'/PRIORITY:NORMAL',
		'/COMPMODE:FAST',
		'/UNSAFEIMPORT',
		'/REPORT:out\\stats.html',
		'/OUT:out\\intro.exe',
		'out\\intro.obj',
		'winmm.lib',
		'gdi32.lib',
		'opengl32.lib',
		'kernel32.lib',
		'user32.lib',
	]);
})
.catch(console.error);

'use strict';

const { readFile, readFileSync, writeFile } = require('fs');
const { safeLoad } = require('js-yaml');
const makeDir = require('make-dir');
const { dirname, join } = require('path');
const rimrafPromise = require('rimraf-promise');
const spawnPromise = require('./spawn-promise');

const config = safeLoad(readFileSync('config.yml'));
const buildDirectory = 'build';
const distDirectory = 'dist';
const shadersDirectory = 'shaders';
const srcDirectory = 'src';

function dir(path) {
	return rimrafPromise(join(path, '*'))
		.then(() => makeDir(path));
}

console.log('Creating directories.');
Promise.all([
	dir(buildDirectory),
	dir(join(distDirectory, dirname(config.distFile)))
])
.then(() => {
	console.log('Preparing shader.');
	return new Promise((resolve, reject) => {
		return readFile(join(shadersDirectory, config.shaderFile), (err, shaderContents) => {
			if (err)
				return reject(err);

			shaderContents = shaderContents.toString();

			const constants = {};
			const presetMatch = shaderContents.match(/\/\/!\s+<preset\s+file="(.+)"\s*\/>/);
			if (!presetMatch)
				return reject(new Error('Shader does not have any preset file.'));

			return readFile(join(shadersDirectory, presetMatch[1]), (err, presetContents) => {
				if (err)
					return reject(err);

				presetContents = presetContents.toString();

				const presetRegExp = /\/\*\!([\s\S]*?<preset\s+name="(\w+?)"[\s\S]*?)\*\//g;
				let presetMatch;
				let presetFound = false;
				while ((presetMatch = presetRegExp.exec(presetContents)) !== null) {
					if (presetMatch[2] === config.constantsPreset) {
						presetFound = true;

						const constantRegExp = /(_\w+) = <.*?> ([\d\.]+)/g;
						let constantMatch;
						while ((constantMatch = constantRegExp.exec(presetMatch[1])) !== null) {
							constants[constantMatch[1]] = constantMatch[2];
						}
					}
				}

				if (!presetFound)
					return reject(new Error('Preset was not found.'));

				const beginMatch = shaderContents.match(/^\/\/\s*?begin([\s\S]+)/m);
				if (!beginMatch)
					return reject(new Error('Shader does not contain the magic line "// begin".'));

				const shaderLines = beginMatch[1].split('\n');

				let shader = [
					'//! FRAGMENT',
					'uniform float _[' + config.uniforms.length + '];',
					'vec2 synth_Resolution = vec2(synth_Width, synth_Height);',
					'float ' + Object.keys(constants).map(constantName => constantName + ' = ' + constants[constantName]).join(',\n\t') + ';',
				]
				.concat(shaderLines)
				.join('\n')
				.replace(/#ifdef\s+SYNTHCLIPSE_ONLY[\s\S]*?(?:#else([\s\S]*?))?#endif/g, '$1')
				.replace(/#ifndef\s+SYNTHCLIPSE_ONLY([\s\S]*?)(?:#else[\s\S]*?)?#endif/g, '$1')
				.replace(/\bconst\b/g, '');

				config.uniforms.forEach((name, index) => {
					const re = new RegExp('\\b' + name + '\\b', 'g');
					shader = shader.replace(re, '_[' + index + ']');
				});

				return writeFile(join(buildDirectory, 'shader.glsl'), shader, (err) => {
					if (err)
						return reject(err);
					else
						return resolve();
				});
			});
		});
	});
})
.then(() => {
	console.log('Minifying shader.');
	return spawnPromise('node', [
		join('node_modules', 'glsl-unit', 'bin', 'template_glsl_compiler.js'),
		'--input=' + join(buildDirectory, 'shader.glsl'),
		'--variable_renaming=INTERNAL',
		'--output=' + join(buildDirectory, 'shader.min.glsl'),
	]);
})
.then(() => {
	console.log('Generating shader header.');
	return new Promise((resolve, reject) => {
		return readFile(join(buildDirectory, 'shader.min.glsl'), (err, contents) => {
			if (err)
				return reject(err);

			const lines = contents.toString().split('\n');
			const shader = lines[lines.length - 1];

			const headerContents = [
				'static const char *shaderSource = "' + shader.replace(/\r/g, '') + '";',
				'#define UNIFORM_COUNT ' + config.uniforms.length,
				'static float uniforms[UNIFORM_COUNT];'
			];

			config.uniforms.forEach((name, index) => {
				name = name
				.replace(/^\w|\b\w/g, letter => letter.toUpperCase())
				.replace(/_+/g, '');
				headerContents.push('#define uniform' + name + ' uniforms[' + index + ']');
			});

			return writeFile(join(buildDirectory, 'shader.h'), headerContents.join('\n'), (err) => {
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
		'/Fa' + join(buildDirectory, 'intro.asm'),
		'/c',
		'/Fo' + join(buildDirectory, 'intro.obj'),
		join(srcDirectory, 'intro.cpp'),
	]);
})
.then(() => {
	console.log('Linking demo.');
	return spawnPromise('crinkler', [
		'/ENTRY:entry',
		'/PRIORITY:NORMAL',
		'/COMPMODE:FAST',
		'/UNSAFEIMPORT',
		'/REPORT:' + join(buildDirectory, 'stats.html'),
		'/OUT:' + join(distDirectory, config.distFile),
		join(buildDirectory, 'intro.obj'),
		'winmm.lib',
		'gdi32.lib',
		'opengl32.lib',
		'kernel32.lib',
		'user32.lib',
	]);
})
.catch(console.error);

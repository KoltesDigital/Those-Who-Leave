'use strict';

const { audioDirectory, buildDirectory, distDirectory, shadersDirectory, srcDirectory } = require('./directories');
const { readFile, readFileSync, stat, writeFile } = require('fs');
const { safeLoad } = require('js-yaml');
const makeDir = require('make-dir');
const { Notification } = require('node-notifier');
const { dirname, join, resolve } = require('path');
const rimrafPromise = require('rimraf-promise');
const spawnPromise = require('./spawn-promise');

const config = safeLoad(readFileSync('config.yml'));

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
			else
				return resolve(shaderContents.toString());
		});
	})
		.then(shaderContents => {
			return new Promise((resolve, reject) => {
				const constantsMap = {};
				const presetMatch = shaderContents.match(/\/\/!\s+<preset\s+file="(.+)"\s*\/>/);
				if (!presetMatch) {
					console.warn('Shader does not have any preset file.');
					return resolve({ shaderContents, constantsMap });
				}

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

							const constantRegExp = /(\w+) = <.*?> (.*)/g;
							let constantMatch;
							while ((constantMatch = constantRegExp.exec(presetMatch[1])) !== null) {
								const name = constantMatch[1];
								if (config.uniforms.indexOf(name) !== -1)
									continue;

								const components = constantMatch[2].split(', ');
								switch (components.length) {
								case 1:
									constantsMap[name] = {
										type: 'float',
										value: components[0],
									};
									break;

								case 2:
									constantsMap[name] = {
										type: 'vec2',
										value: 'vec2(' + components.join(', ') + ')',
									};
									break;

								case 3:
									constantsMap[name] = {
										type: 'vec3',
										value: 'vec3(' + components.join(', ') + ')',
									};
									break;

								case 4:
									constantsMap[name] = {
										type: 'vec4',
										value: 'vec4(' + components.join(', ') + ')',
									};
									break;
								}
							}
						}
					}

					if (!presetFound)
						console.warn('Preset was not found.');

					return resolve({ shaderContents, constantsMap });
				});
			});
		})
		.then(({ shaderContents, constantsMap }) => {
			return new Promise((resolve, reject) => {
				const beginMatch = shaderContents.match(/^\/\/\s*?begin([\s\S]+)/m);
				if (!beginMatch)
					return reject(new Error('Shader does not contain the magic line "// begin".'));

				let shader = beginMatch[1]
					.replace(/#ifdef\s+SYNTHCLIPSE_ONLY[\s\S]*?(?:#else([\s\S]*?))?#endif/g, '$1')
					.replace(/#ifndef\s+SYNTHCLIPSE_ONLY([\s\S]*?)(?:#else[\s\S]*?)?#endif/g, '$1')
					.replace(/\bconst\b/g, '');

				function addGlobal(type, value) {
					if (!config.globals[type])
						config.globals[type] = [];
					config.globals[type].push(value);
				}

				if (config.capture) {
					addGlobal('vec2', 'synth_Resolution = vec2(' + config.capture.width + ', ' + config.capture.height + ')');
				} else if (config.forceResolution) {
					addGlobal('vec2', 'synth_Resolution = vec2(' + config.forceResolution.width + ', ' + config.forceResolution.height + ')');
				} else {
					const uniformWidthName = 'resolutionWidth',
						uniformHeightName = 'resolutionHeight';
					addGlobal('vec2', 'synth_Resolution = vec2(' + uniformWidthName + ', ' + uniformHeightName + ')');
					config.uniforms.push(uniformWidthName, uniformHeightName);
				}

				Object.keys(constantsMap).forEach(constantName => {
					const constantEntry = constantsMap[constantName];

					const re = new RegExp('\\b' + constantName + '\\b', 'g');
					let occurences = 0;
					while (re.exec(shader) !== null) {
						++occurences;
					}

					if (occurences > 1) {
						addGlobal(constantEntry.type, constantName + ' = ' + constantEntry.value);
					} else if (occurences === 1) {
						shader = shader.replace(re, constantEntry.value);
					}
				});

				const shaderLines = shader.split('\n');

				let newShader = [
					'//! FRAGMENT',
					'uniform float _[' + config.uniforms.length + '];',
				]
					.concat(Object.keys(config.globals).map(type => {
						return type + ' ' + config.globals[type].join(', ') + ';';
					}))
					.concat(shaderLines)
					.join('\n');

				config.uniforms.forEach((name, index) => {
					const re = new RegExp('\\b' + name + '\\b', 'g');
					newShader = newShader.replace(re, '_[' + index + ']');
				});

				return writeFile(join(buildDirectory, 'shader.glsl'), newShader, (err) => {
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
		'--input=' + join(buildDirectory, 'shader.glsl'),
		'--variable_renaming=INTERNAL',
		'--output=' + join(buildDirectory, 'shader.min.glsl'),
	]);
})
.then(() => {
	console.log('Generating header.');
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

			if (config.capture) {
				headerContents.push(
					'#define FORCE_RESOLUTION',
					'#define CAPTURE_FRAMES',
					'static const constexpr int width = ' + config.capture.width + ';',
					'static const constexpr int height = ' + config.capture.height + ';',
					'static const constexpr float fps = ' + config.capture.fps + ';'
				);
			} else if (config.forceResolution) {
				headerContents.push(
					'#define FORCE_RESOLUTION',
					'static const constexpr int width = ' + config.forceResolution.width + ';',
					'static const constexpr int height = ' + config.forceResolution.height + ';'
				);
			} else {
				headerContents.push(
					'static int width, height;'
				);
			}

			return writeFile(join(buildDirectory, 'generated.hpp'), headerContents.join('\n'), (err) => {
				if (err)
					return reject(err);
				else
					return resolve();
			});
		});
	});
})
.then(() => {
	console.log('Compiling intro.cpp.');
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
	console.log('Compiling audio.inc.');
	return spawnPromise('nasm', [
		'-f',
		'win32',
		'-o',
		resolve(buildDirectory, '4klang.obj'),
		'4klang.asm',
	], {
		cwd: audioDirectory,
	});
})
.then(() => {
	console.log('Linking demo.');
	return spawnPromise('crinkler', [
		'/ENTRY:entry',
		'/PRIORITY:NORMAL',
		'/COMPMODE:FAST',
		'/RANGE:opengl32',
		// '/TRUNCATEFLOATS:16',
		'/UNSAFEIMPORT',
		'/REPORT:' + join(buildDirectory, 'stats.html'),
		'/OUT:' + join(distDirectory, config.distFile),
		join(buildDirectory, 'intro.obj'),
		join(buildDirectory, '4klang.obj'),
		'winmm.lib',
		'gdi32.lib',
		'opengl32.lib',
		'kernel32.lib',
		'user32.lib',
	]);
})
.then(() => {
	return new Promise((resolve, reject) => {
		return stat(join(distDirectory, config.distFile), (err, stats) => {
			if (err)
				return reject(err);
			else
				return resolve(stats.size);
		});
	});
})
.then((size) => {
	const notifier = new Notification({
		withFallback: true,
	});

	notifier.notify({
		title: 'Final size',
		message: size + ' bytes',
		wait: true,
	});

	notifier.on('click', () => {
		spawnPromise(join(distDirectory, config.distFile))
		.catch(console.error);
	});
})
.catch(console.error);

'use strict';

const { audioDirectory, distDirectory } = require('./directories');
const { readFileSync } = require('fs');
const { safeLoad } = require('js-yaml');
const { dirname, join } = require('path');
const spawnPromise = require('./spawn-promise');

const config = safeLoad(readFileSync('config.yml'));

spawnPromise('ffmpeg', [
	'-y',
	'-f',
	'image2',
	'-r',
	config.capture.fps,
	'-s',
	config.capture.width + 'x' + config.capture.height,
	'-pix_fmt',
	'rgb24',
	'-start_number',
	'0',
	'-i',
	join(distDirectory, dirname(config.distFile), 'frame%05d.raw'),
	'-i',
	join(audioDirectory, '4klang.mp3'),
	'-vf',
	'vflip',
	'-codec:v',
	'libx264',
	'-crf',
	'18',
	'-bf',
	'2',
	'-flags',
	'+cgop',
	'-pix_fmt',
	'yuv420p',
	'-codec:a',
	'aac',
	'-strict',
	'-2',
	'-b:a',
	'384k',
	'-movflags',
	'faststart',
	join(distDirectory, 'intro.mp4'),
])
.catch(console.error);

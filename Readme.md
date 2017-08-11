# Flower

4k for evoke 2017.

## Demoscene is a big family

Framework derived from [wsmind](https://github.com/wsmind), himself took from iq...

## Build instructions

Requirements:

1. Windows only.
2. [Visual Studio](https://www.visualstudio.com/) for the compiler.
3. [Crinkler](http://www.crinkler.net/) for the linker, unzipped somewhere and available in the PATH.
4. [Node.js](https://nodejs.org/) for the toolchain.

Open a *VS x86 tools prompt* and execute:

	npm install
	npm run build

## Development

Shaders are developed within [Synthclipse](http://synthclipse.sourceforge.net/).

In order to automatically build when a file changes, execute:

	npm run watch

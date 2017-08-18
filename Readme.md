# Flower

> 4k for evoke 2017.

Koltes: direction, optimization, toolchain.

ponk: modeling.

Unix: music.

## Demoscene is a big family

Framework derived from [wsmind](https://github.com/wsmind) and [halcy](https://github.com/halcy/), themselves took from iq...

Shader contains snippets from IQ, Mercury, LJ, Duke...

## Build instructions

Requirements:

1. Windows only.
2. [Visual Studio](https://www.visualstudio.com/) for the C++ compiler.
3. [NASM](http://www.nasm.us) for the ASM compiler.
4. [Crinkler](http://www.crinkler.net/) for the linker, unzipped somewhere and available in the PATH.
5. [Node.js](https://nodejs.org/) for the toolchain.

Open a *VS x86 tools prompt* and execute:

	npm install
	npm run build

## Development

Shaders are developed within [Synthclipse](http://synthclipse.sourceforge.net/).

In order to automatically build when a file changes, execute:

	npm run watch

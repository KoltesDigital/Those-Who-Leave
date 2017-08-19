#define WIN32_LEAN_AND_MEAN
#define WIN32_EXTRA_LEAN
#include <windows.h>

#include <GL/gl.h>
#include <MMSystem.h>
#include <MMReg.h>

#define HALF_SCREEN

#include <audio/4klang.h>
#include <build/generated.hpp>

#include "audio.hpp"
#include "gl.hpp"
#include "shots.hpp"
#include "time.hpp"
#include "window.hpp"

void entry()
{
#ifndef FORCE_RESOLUTION
	width = GetSystemMetrics(SM_CXSCREEN);
	height = GetSystemMetrics(SM_CYSCREEN);

#ifdef HALF_SCREEN
	width /= 4;
	height /= 4;
#endif
#endif

	auto hwnd = CreateWindow("static", NULL, WS_POPUP | WS_VISIBLE, 0, 0, width, height, NULL, NULL, NULL, 0);
	auto hdc = GetDC(hwnd);
	SetPixelFormat(hdc, ChoosePixelFormat(hdc, &pfd), &pfd);
	wglMakeCurrent(hdc, wglCreateContext(hdc));
	ShowCursor(FALSE);

	for (auto i = 0; i < GL_EXT_FUNCTION_COUNT; ++i)
		glExtFunctions[i] = wglGetProcAddress(glExtFunctionNames[i]);

	GLint program = glCreateProgram();
	GLint fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
	glShaderSource(fragmentShader, 1, &shaderSource, 0);
	glCompileShader(fragmentShader);
	glAttachShader(program, fragmentShader);
	glLinkProgram(program);
	glUseProgram(program);

	CreateThread(0, 0, (LPTHREAD_START_ROUTINE)_4klang_render, soundBuffer, 0, 0);
	waveOutOpen(&waveOut, WAVE_MAPPER, &waveFormat, NULL, 0, CALLBACK_NULL);
	waveOutPrepareHeader(waveOut, &waveHDR, sizeof(waveHDR));
	waveOutWrite(waveOut, &waveHDR, sizeof(waveHDR));

	startTime();

	float startBeat{};
	Shot *currentShot = shots;

	do
	{
		// avoid 'not responding' system messages
		PeekMessage(NULL, NULL, 0, 0, PM_REMOVE);

		float beat = (BPM / 60.f) * getTime();
		//beat += 44;
		//beat *= 16;

		if (beat >= currentShot->endBeat)
		{
			startBeat = currentShot->endBeat;
			++ currentShot;
		}

		uniformBeat = beat;
		uniformEndCameraAnglesX = currentShot->endCameraAngles[0];
		uniformEndCameraAnglesY = currentShot->endCameraAngles[1];
		uniformEndCameraAnglesZ = currentShot->endCameraAngles[2];
		uniformEndCameraPositionX = currentShot->endCameraPosition[0];
		uniformEndCameraPositionY = currentShot->endCameraPosition[1];
		uniformEndCameraPositionZ = currentShot->endCameraPosition[2];
		uniformEndSeedPositionX = currentShot->endSeedPosition[0];
		uniformEndSeedPositionY = currentShot->endSeedPosition[1];
		uniformEndSeedPositionZ = currentShot->endSeedPosition[2];
		uniformStartCameraAnglesX = currentShot->startCameraAngles[0];
		uniformStartCameraAnglesY = currentShot->startCameraAngles[1];
		uniformStartCameraAnglesZ = currentShot->startCameraAngles[2];
		uniformStartCameraPositionX = currentShot->startCameraPosition[0];
		uniformStartCameraPositionY = currentShot->startCameraPosition[1];
		uniformStartCameraPositionZ = currentShot->startCameraPosition[2];
		uniformStartSeedPositionX = currentShot->startSeedPosition[0];
		uniformStartSeedPositionY = currentShot->startSeedPosition[1];
		uniformStartSeedPositionZ = currentShot->startSeedPosition[2];
		uniformStartEndRatio = (beat - startBeat) / (currentShot->endBeat - startBeat);

#ifndef FORCE_RESOLUTION
		uniformResolutionHeight = (float)height;
		uniformResolutionWidth = (float)width;
#endif

		// hack - assume that the uniforms u[] will always be linked to locations [0-n]
		// given that they are the only uniforms in the shader, it is likely to work on all drivers
		glUniform1fv(0, UNIFORM_COUNT, uniforms);

		glRects(-1, -1, 1, 1);

		capture();

		wglSwapLayerBuffers(hdc, WGL_SWAP_MAIN_PLANE);
	} while (
		// mmTime.u.sample < MAX_PATTERNS * SAMPLES_PER_TICK * PATTERN_SIZE &&
		!GetAsyncKeyState(VK_ESCAPE));

	ExitProcess(0);
}

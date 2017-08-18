#define WIN32_LEAN_AND_MEAN
#define WIN32_EXTRA_LEAN
#include <windows.h>

#include <GL/gl.h>
#include <MMSystem.h>
#include <MMReg.h>

#define HALF_SCREEN
// #define CAPTURE_FRAMES

#include "audio.hpp"
#include "gl.hpp"
#include "time.hpp"
#include "window.hpp"

#include <build/shader.h>

struct Shot
{
	float endBeat;
	float startCameraPosition[3];
	float startCameraAngles[3];
	float endCameraPosition[3];
	float endCameraAngles[3];
};

static Shot shots[] = {
	{
		208.f,
		{ 0.f, 5.f, -5.f },
		{ 0.5f, 0.f, 0.f },
		{ 0.f, 5.f, -5.f },
		{ 0.5f, 0.f, 0.f },
	},
};

void entry()
{
	unsigned int i;

	DWORD width = GetSystemMetrics(SM_CXSCREEN);
	DWORD height = GetSystemMetrics(SM_CYSCREEN);

#ifdef HALF_SCREEN
	width /= 2;
	height /= 2;
#endif

	HWND hwnd = CreateWindow("static", NULL, WS_POPUP | WS_VISIBLE, 0, 0, width, height, NULL, NULL, NULL, 0);
	HDC hdc = GetDC(hwnd);
	SetPixelFormat(hdc, ChoosePixelFormat(hdc, &pfd), &pfd);
	wglMakeCurrent(hdc, wglCreateContext(hdc));

	CreateThread(0, 0, (LPTHREAD_START_ROUTINE)_4klang_render, soundBuffer, 0, 0);
	waveOutOpen(&waveOut, WAVE_MAPPER, &waveFormat, NULL, 0, CALLBACK_NULL);
	waveOutPrepareHeader(waveOut, &waveHDR, sizeof(waveHDR));
	waveOutWrite(waveOut, &waveHDR, sizeof(waveHDR));

	for (i = 0; i < GL_EXT_FUNCTION_COUNT; ++i)
		glExtFunctions[i] = wglGetProcAddress(glExtFunctionNames[i]);

	GLint program = glCreateProgram();
	GLint fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
	glShaderSource(fragmentShader, 1, &shaderSource, 0);
	glCompileShader(fragmentShader);
	glAttachShader(program, fragmentShader);
	glLinkProgram(program);
	glUseProgram(program);

	startTime();

	float startBeat{};
	Shot *currentShot = shots;

	do
	{
		// avoid 'not responding' system messages
		PeekMessage(NULL, NULL, 0, 0, PM_REMOVE);

		float beat = (BPM / 60.f) * getTime();

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
		uniformStartCameraAnglesX = currentShot->startCameraAngles[0];
		uniformStartCameraAnglesY = currentShot->startCameraAngles[1];
		uniformStartCameraAnglesZ = currentShot->startCameraAngles[2];
		uniformStartCameraPositionX = currentShot->startCameraPosition[0];
		uniformStartCameraPositionY = currentShot->startCameraPosition[1];
		uniformStartCameraPositionZ = currentShot->startCameraPosition[2];
		uniformStartEndRatio = (beat - startBeat) / (currentShot->endBeat - startBeat);
		uniformSynthHeight = (float)height;
		uniformSynthWidth = (float)width;

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

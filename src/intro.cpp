#define WIN32_LEAN_AND_MEAN
#define WIN32_EXTRA_LEAN
#include <windows.h>
#include <mmsystem.h>
#include <GL/gl.h>
#include <stdio.h>

// #define CAPTURE_FRAMES

#include "gl.hpp"
#include "time.hpp"
#include "window.hpp"

#include <out/shader.h>

void entry()
{
	unsigned int i;
	MSG msg;

	DWORD width = GetSystemMetrics(SM_CXSCREEN);
	DWORD height = GetSystemMetrics(SM_CYSCREEN);

	HWND hwnd = CreateWindow("static", NULL, WS_POPUP | WS_VISIBLE, 0, 0, width, height, NULL, NULL, NULL, 0);
	HDC hdc = GetDC(hwnd);
	SetPixelFormat(hdc, ChoosePixelFormat(hdc, &pfd), &pfd);
	wglMakeCurrent(hdc, wglCreateContext(hdc));

	for (i = 0; i < GL_EXT_FUNCTION_COUNT; ++i)
		glExtFunctions[i] = wglGetProcAddress(glExtFunctionNames[i]);

	GLint program = glCreateProgram();
	GLint fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
	glShaderSource(fragmentShader, 1, &shaderSource, 0);
	glCompileShader(fragmentShader);
	glAttachShader(program, fragmentShader);
	glLinkProgram(program);
	glUseProgram(program);

	ShowCursor(FALSE);

	startTime();

	while (!GetAsyncKeyState(VK_ESCAPE))
	{
		float time;

		// avoid 'not responding' system messages
		PeekMessage(&msg, NULL, 0, 0, PM_REMOVE);

		time = getTime();

		uniformSynthHeight = (float)height;
		uniformSynthTime = time;
		uniformSynthWidth = (float)width;

		// hack - assume that the uniforms u[] will always be linked to locations [0-n]
		// given that they are the only uniforms in the shader, it is likely to work on all drivers
		glUniform1fv(0, UNIFORM_COUNT, uniforms);

		glRects(-1, -1, 1, 1);

		capture();

		wglSwapLayerBuffers(hdc, WGL_SWAP_MAIN_PLANE);
	}

	ExitProcess(0);
}

#pragma once

#ifdef CAPTURE_FRAMES

static int frameNumber;
static HANDLE frameFile;
static DWORD frameBytesWritten;
static char *frameBuffer;

static char *frameFilename(int n)
{
	static char *name = "frame00000.raw";
	char *ptr = name + 9;

	while (n > 0)
	{
		*ptr-- = (n - (n / 10) * 10) + '0';
		n /= 10;
	}

	return name;
}

#define startTime() \
	frameNumber = 0; \
	frameBuffer = (char *)HeapAlloc(GetProcessHeap(), 0, width * height * 3 /* RGB8 */)

#define getTime() \
	(float)frameNumber / 60.0f; \
	if (time > 120.f) \
		break

#define capture() \
	glReadPixels(0, 0, width, height, GL_RGB, GL_UNSIGNED_BYTE, frameBuffer); \
	frameFile = CreateFile(frameFilename(frameNumber), GENERIC_WRITE, FILE_SHARE_READ, NULL, CREATE_NEW, FILE_ATTRIBUTE_NORMAL, NULL); \
	if (frameFile) \
	{ \
		WriteFile(frameFile, frameBuffer, width * height * 3, &frameBytesWritten, NULL); \
		CloseHandle(frameFile); \
	} \
	frameNumber++

#else

static void startTime()
{
}

static float getTime()
{
	waveOutGetPosition(waveOut, &mmTime, sizeof(MMTIME));
	return (float)mmTime.u.sample / (float)SAMPLE_RATE;
}

static void capture()
{
}

#endif

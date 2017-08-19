#pragma once

static SAMPLE_TYPE soundBuffer[MAX_SAMPLES * 2];
static HWAVEOUT waveOut;

#pragma data_seg(".wavefmt")
static const WAVEFORMATEX waveFormat = {
#ifdef FLOAT_32BIT
	WAVE_FORMAT_IEEE_FLOAT,
#else
	WAVE_FORMAT_PCM,
#endif
	2,									   // channels
	SAMPLE_RATE,						   // samples per sec
	SAMPLE_RATE * sizeof(SAMPLE_TYPE) * 2, // bytes per sec
	sizeof(SAMPLE_TYPE) * 2,			   // block alignment;
	sizeof(SAMPLE_TYPE) * 8,			   // bits per sample
	0,									   // extension not needed
};

#pragma data_seg(".wavehdr")
static WAVEHDR waveHDR = {
	(LPSTR)soundBuffer,
	MAX_SAMPLES * sizeof(SAMPLE_TYPE) * 2, // MAX_SAMPLES*sizeof(float)*2(stereo)
	0,
	0,
	0,
	0,
	0,
	0,
};

static MMTIME mmTime = {
	TIME_SAMPLES,
	0,
};

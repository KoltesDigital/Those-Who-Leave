
uniform vec2 synth_Resolution;
uniform float synth_Time;
uniform mat4 synth_ViewMatrix;

//! <group name="Audio"/>
uniform float BPM; //! slider[10, 100, 200]
#define Beat (synth_Time*BPM/60.)

//! <group name="Scene"/>
uniform float CamHeight; //! slider[5, 21, 50]
uniform float Octaves; //! slider[0, 4, 10]
uniform vec3 GroundTopColor0; //! color[1, 1, 1]
uniform vec3 GroundTopColor1; //! color[1, 1, 1]
uniform vec3 GroundBottomColor; //! color[1, 1, 1]
uniform vec3 SeedColor; //! color[1, 1, 1]
uniform vec3 RootColor0; //! color[1, 1, 1]
uniform vec3 RootColor1; //! color[1, 1, 1]
uniform float RootFadeDamping; //! slider[0, .5, 5]
uniform float RootAmplitude; //! slider[0, .5, 5]
uniform float RootPulsation; //! slider[0, 5, 10]
uniform float RootDamping; //! slider[0, .5, 50]
uniform float RootSubRadius; //! slider[0, .05, .3]
uniform float RootSubHelixStep; //! slider[0, 5, 10]
uniform float RootFall; //! slider[0, 5, 10]
uniform vec3 StemColor0; //! color[1, 1, 1]
uniform vec3 StemColor1; //! color[1, 1, 1]
uniform float StemRadius; //! slider[0, .5, 1]
uniform float StemGrowFactor; //! slider[0, 20, 300]
uniform float StemMaxHeight; //! slider[0, 20, 300]
uniform vec3 FlowerColor0; //! color[1, 1, 1]
uniform vec3 FlowerColor1; //! color[1, 1, 1]
uniform float Exposure; //! slider[0, 5, 10]
uniform vec3 CloudColor0; //! color[1, 1, 1]
uniform vec3 CloudColor1; //! color[1, 1, 1]
uniform vec3 SkyColor0; //! color[1, 1, 1]
uniform vec3 SkyColor1; //! color[1, 1, 1]
uniform vec3 StarColor; //! color[1, 1, 1]

//! <group name="Raymarching"/>
uniform float Steps; //! slider[5, 10, 50]

//! <group name="Shot"/>
uniform bool SynthclipseCamera; //! checkbox[false]
uniform float StartEndRatio; //! slider[0, 0.5, 1]
uniform float StartCameraPositionX; //! slider[-10, 0, 10]
uniform float StartCameraPositionY; //! slider[-10, 0, 30]
uniform float StartCameraPositionZ; //! slider[-10, 0, 10]
uniform float StartCameraAnglesX; //! slider[-8, 0, 8]
uniform float StartCameraAnglesY; //! slider[-8, 0, 8]
uniform float StartCameraAnglesZ; //! slider[-8, 0, 8]
uniform float EndCameraPositionX; //! slider[-10, 0, 10]
uniform float EndCameraPositionY; //! slider[-10, 0, 30]
uniform float EndCameraPositionZ; //! slider[-10, 0, 10]
uniform float EndCameraAnglesX; //! slider[-8, 0, 8]
uniform float EndCameraAnglesY; //! slider[-8, 0, 8]
uniform float EndCameraAnglesZ; //! slider[-8, 0, 8]
uniform float StartSeedPositionX; //! slider[-10, 0, 10]
uniform float StartSeedPositionY; //! slider[-10, 0, 30]
uniform float StartSeedPositionZ; //! slider[-10, 0, 10]
uniform float EndSeedPositionX; //! slider[-10, 0, 10]
uniform float EndSeedPositionY; //! slider[-10, 0, 30]
uniform float EndSeedPositionZ; //! slider[-10, 0, 10]

//! <group name="Timing"/>
uniform float FadeInStart; //! slider[0, 0.1, 300]
uniform float FadeInEnd; //! slider[0, 1, 300]
uniform float RootStart; //! slider[0, 5.1, 300]
uniform float RootEnd; //! slider[0, 15, 300]
uniform float StemStart; //! slider[0, 7.2, 300]
uniform float StemEnd; //! slider[0, 87.2, 300]
uniform float FlowerStart; //! slider[0, 70, 300]
uniform float FlowerEnd; //! slider[0, 100, 300]
uniform float DissolutionStart; //! slider[0, 102, 300]
uniform float DissolutionEnd; //! slider[0, 118, 300]
uniform float FadeOutStart; //! slider[0, 120, 300]
uniform float FadeOutEnd; //! slider[0, 124, 300]

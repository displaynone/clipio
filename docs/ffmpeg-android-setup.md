# FFmpeg Android Setup

## Objetivo

Empaquetar un binario `ffmpeg` por ABI dentro de las native libraries de la app Android para que `FFmpegExportModule` pueda ejecutarlo directamente en el dispositivo.

## Rutas esperadas

Los binarios deben acabar aquí:

```text
android/app/src/main/jniLibs/arm64-v8a/libffmpeg.so
android/app/src/main/jniLibs/armeabi-v7a/libffmpeg.so
android/app/src/main/jniLibs/x86_64/libffmpeg.so
```

## Flujo recomendado

1. Clona FFmpeg dentro de:

```text
android/ffmpeg/source
```

2. Exporta el NDK:

```bash
export ANDROID_NDK_ROOT=/ruta/al/android-ndk
```

3. Compila y copia los binarios:

```bash
npm run ffmpeg:build:android
```

4. Comprueba el estado:

```bash
npm run ffmpeg:doctor
cd android && ./gradlew ffmpegDoctor
```

5. Fuerza validación durante la build:

```bash
cd android && ./gradlew app:assembleDebug -Pclipio.requireFfmpeg=true
```

## Variables soportadas por el script

- `FFMPEG_SOURCE_DIR`: ruta al checkout de FFmpeg
- `FFMPEG_BUILD_DIR`: carpeta temporal de build
- `ANDROID_NDK_ROOT` o `ANDROID_NDK_HOME`: NDK a usar
- `ANDROID_API_LEVEL`: API Android objetivo, por defecto `24`
- `FFMPEG_ABIS`: lista de ABIs, por defecto `arm64-v8a armeabi-v7a x86_64`
- `ANDROID_NDK_HOST_TAG`: host tag del toolchain, por defecto `linux-x86_64`

## Qué deja preparado esta integración

- `FFmpegExportModule` busca el binario empaquetado dentro de `nativeLibraryDir`.
- El módulo sustituye `<output-path>` del comando generado por un archivo real.
- El progreso se estima parseando `time=` desde `stderr`.
- El script de build activa `JNI` y `MediaCodec` para poder usar `h264_mediacodec` en Android.

## Qué no hace todavía

- No compila FFmpeg automáticamente desde internet.
- No añade codecs opcionales externos.

## Notas

- Si solo vas a probar en un móvil ARM64, el ABI realmente crítico es `arm64-v8a`.
- `x86_64` es útil para emulador.
- Si quieres que el build falle cuando falte FFmpeg, usa `-Pclipio.requireFfmpeg=true`.

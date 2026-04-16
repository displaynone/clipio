#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ANDROID_DIR="$PROJECT_ROOT/android"
APP_JNI_LIBS_DIR="$ANDROID_DIR/app/src/main/jniLibs"
FFMPEG_SOURCE_DIR="${FFMPEG_SOURCE_DIR:-$ANDROID_DIR/ffmpeg/source}"
FFMPEG_BUILD_DIR="${FFMPEG_BUILD_DIR:-$ANDROID_DIR/ffmpeg/build}"
FFMPEG_REPOSITORY="${FFMPEG_REPOSITORY:-https://github.com/FFmpeg/FFmpeg.git}"
FFMPEG_REF="${FFMPEG_REF:-b47a4598677f009cafc860803aef1bfa1ffd1a71}"
HOST_TAG="${ANDROID_NDK_HOST_TAG:-linux-x86_64}"
NDK_ROOT="${ANDROID_NDK_ROOT:-${ANDROID_NDK_HOME:-}}"
API_LEVEL="${ANDROID_API_LEVEL:-24}"
read -r -a ABIS <<< "${FFMPEG_ABIS:-arm64-v8a armeabi-v7a x86_64}"
HAS_NASM=0

if command -v nasm >/dev/null 2>&1; then
  HAS_NASM=1
fi

if [[ -z "$NDK_ROOT" && -n "${ANDROID_SDK_ROOT:-}" && -d "${ANDROID_SDK_ROOT}/ndk" ]]; then
  NDK_ROOT="$(find "${ANDROID_SDK_ROOT}/ndk" -mindepth 1 -maxdepth 1 -type d | sort -V | tail -n 1)"
fi

if [[ -z "$NDK_ROOT" && -n "${ANDROID_HOME:-}" && -d "${ANDROID_HOME}/ndk" ]]; then
  NDK_ROOT="$(find "${ANDROID_HOME}/ndk" -mindepth 1 -maxdepth 1 -type d | sort -V | tail -n 1)"
fi

if [[ -z "$NDK_ROOT" && -n "${ANDROID_SDK_ROOT:-}" ]]; then
  sdk_parent="$(dirname "${ANDROID_SDK_ROOT}")"
  if [[ -d "${sdk_parent}/ndk" ]]; then
    NDK_ROOT="$(find "${sdk_parent}/ndk" -mindepth 1 -maxdepth 1 -type d | sort -V | tail -n 1)"
  fi
fi

if [[ -z "$NDK_ROOT" ]]; then
  echo "ANDROID_NDK_ROOT o ANDROID_NDK_HOME no está definido."
  exit 1
fi

ensure_ffmpeg_source() {
  if [[ ! -d "$FFMPEG_SOURCE_DIR/.git" ]]; then
    echo "No existe FFMPEG_SOURCE_DIR: $FFMPEG_SOURCE_DIR"
    echo "Clonando FFmpeg desde $FFMPEG_REPOSITORY..."
    rm -rf "$FFMPEG_SOURCE_DIR"
    mkdir -p "$(dirname "$FFMPEG_SOURCE_DIR")"
    git clone --filter=blob:none "$FFMPEG_REPOSITORY" "$FFMPEG_SOURCE_DIR"
  fi

  pushd "$FFMPEG_SOURCE_DIR" >/dev/null
  git fetch --filter=blob:none origin "$FFMPEG_REF"
  git checkout --detach "$FFMPEG_REF"
  popd >/dev/null
}

if [[ ! -d "$FFMPEG_SOURCE_DIR" ]]; then
  ensure_ffmpeg_source
elif [[ ! -d "$FFMPEG_SOURCE_DIR/.git" ]]; then
  echo "FFMPEG_SOURCE_DIR existe pero no es un repo Git: $FFMPEG_SOURCE_DIR"
  echo "Bórralo o exporta FFMPEG_SOURCE_DIR apuntando a un checkout válido de FFmpeg."
  exit 1
else
  ensure_ffmpeg_source
fi

mkdir -p "$APP_JNI_LIBS_DIR"
mkdir -p "$FFMPEG_BUILD_DIR"

build_abi() {
  local abi="$1"
  local arch=""
  local cpu=""
  local target=""
  local cross_prefix=""
  local cflags=""
  local extra_config=()

  case "$abi" in
    arm64-v8a)
      arch="aarch64"
      cpu="armv8-a"
      target="aarch64-linux-android"
      ;;
    armeabi-v7a)
      arch="arm"
      cpu="armv7-a"
      target="armv7a-linux-androideabi"
      cflags="-march=armv7-a -mfloat-abi=softfp"
      ;;
    x86_64)
      arch="x86_64"
      cpu="x86-64"
      target="x86_64-linux-android"
      if [[ "$HAS_NASM" -eq 0 ]]; then
        echo "nasm no está instalado. Se compilará x86_64 con --disable-x86asm."
        extra_config+=(--disable-x86asm)
      fi
      ;;
    *)
      echo "ABI no soportada: $abi"
      exit 1
      ;;
  esac

  local toolchain="$NDK_ROOT/toolchains/llvm/prebuilt/$HOST_TAG"
  local build_dir="$FFMPEG_BUILD_DIR/$abi"
  local prefix_dir="$build_dir/prefix"
  local sysroot="$toolchain/sysroot"
  local cc="$toolchain/bin/${target}${API_LEVEL}-clang"
  local cxx="$toolchain/bin/${target}${API_LEVEL}-clang++"
  cross_prefix="$toolchain/bin/llvm-"

  rm -rf "$build_dir"
  mkdir -p "$build_dir" "$prefix_dir"

  pushd "$FFMPEG_SOURCE_DIR" >/dev/null
  make distclean >/dev/null 2>&1 || true

  ./configure \
    --prefix="$prefix_dir" \
    --target-os=android \
    --arch="$arch" \
    --cpu="$cpu" \
    --cc="$cc" \
    --cxx="$cxx" \
    --cross-prefix="$cross_prefix" \
    --sysroot="$sysroot" \
    --enable-cross-compile \
    --enable-pic \
    --disable-shared \
    --enable-static \
    --disable-doc \
    --enable-ffmpeg \
    --disable-ffplay \
    --disable-ffprobe \
    --disable-avdevice \
    --enable-jni \
    --enable-mediacodec \
    --enable-gpl \
    --enable-small \
    "${extra_config[@]}" \
    --extra-cflags="$cflags"

  make -j"$(nproc)"

  mkdir -p "$APP_JNI_LIBS_DIR/$abi"
  cp ffmpeg "$APP_JNI_LIBS_DIR/$abi/libffmpeg.so"
  chmod +x "$APP_JNI_LIBS_DIR/$abi/libffmpeg.so"
  popd >/dev/null
}

for abi in "${ABIS[@]}"; do
  build_abi "$abi"
done

echo "FFmpeg Android binaries copiadas a $APP_JNI_LIBS_DIR"

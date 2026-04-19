#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
JNI_LIBS_DIR="$PROJECT_ROOT/android/app/src/main/jniLibs"
ABIS=(arm64-v8a armeabi-v7a x86_64)
missing=()

for abi in "${ABIS[@]}"; do
  binary="$JNI_LIBS_DIR/$abi/libffmpeg.so"
  if [[ ! -f "$binary" ]]; then
    missing+=("$abi")
  fi
done

if [[ "${#missing[@]}" -eq 0 ]]; then
  echo "FFmpeg Android binaries already exist."
  "$PROJECT_ROOT/scripts/ffmpeg/check-android-ffmpeg.sh"
  exit 0
fi

echo "Missing FFmpeg Android binaries for: ${missing[*]}"
echo "Building FFmpeg before the native Android build..."
"$PROJECT_ROOT/scripts/ffmpeg/build-android-ffmpeg.sh"
"$PROJECT_ROOT/scripts/ffmpeg/check-android-ffmpeg.sh"

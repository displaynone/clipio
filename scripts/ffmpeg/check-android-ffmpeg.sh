#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
JNI_LIBS_DIR="$PROJECT_ROOT/android/app/src/main/jniLibs"
ABIS=("arm64-v8a" "armeabi-v7a" "x86_64")

echo "Clipio FFmpeg doctor"
echo "JNI libs dir: $JNI_LIBS_DIR"

missing=0

for abi in "${ABIS[@]}"; do
  binary="$JNI_LIBS_DIR/$abi/libffmpeg.so"
  if [[ -f "$binary" ]]; then
    echo " - $abi: OK ($binary)"
  else
    echo " - $abi: MISSING ($binary)"
    missing=1
  fi
done

if [[ $missing -ne 0 ]]; then
  echo ""
  echo "Faltan binarios FFmpeg. Usa:"
  echo "  npm run ffmpeg:build:android"
  echo "o copia manualmente los binarios a android/app/src/main/jniLibs/<abi>/libffmpeg.so"
  exit 1
fi

echo ""
echo "Todos los binarios FFmpeg requeridos están presentes."

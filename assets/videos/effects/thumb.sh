#!/bin/bash

mkdir -p thumbs

for f in *.mp4; do
  # Obtener duración en segundos
  duration=$(ffprobe -v error \
    -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 \
    "$f")

  # Calcular mitad
  half=$(awk "BEGIN {print $duration/2}")

  # Extraer frame en la mitad (sobrescribe si existe)
  ffmpeg -y -ss "$half" -i "$f" \
    -frames:v 1 \
    -q:v 2 \
    "thumbs/${f%.*}.jpg"

done

#!/bin/bash

mkdir -p half

for f in *.mp4; do
  ffmpeg -i "$f" \
    -vf "scale=2*floor(iw/4):2*floor(ih/4)" \
    -c:v libx264 -crf 23 -preset medium \
    -c:a copy \
    "half/$f"
done

#!/bin/bash

# Ensure ImageMagick is installed
command -v convert >/dev/null 2>&1 || { echo "ImageMagick is required but not installed. Aborting."; exit 1; }

# Navigate to static directory
cd "$(dirname "$0")/static" || exit

# Generate favicon.ico from favicon.png (16x16, 32x32, and 48x48 sizes)
convert favicon.png -define icon:auto-resize=16,32,48 favicon.ico

# Generate apple-touch-icon variations (various sizes)
convert favicon.png -resize 180x180 apple-touch-icon.png
cp apple-touch-icon.png apple-touch-icon-precomposed.png

# Generate specific sizes requested by browsers
convert favicon.png -resize 120x120 apple-touch-icon-120x120.png
cp apple-touch-icon-120x120.png apple-touch-icon-120x120-precomposed.png

echo "Icons generated successfully!"

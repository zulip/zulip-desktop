#!/bin/bash

set -e
cd "$(dirname "$0")/.."

if [ "$(uname -s)" != Darwin ]; then
  echo "This script only runs on macOS since it needs 'iconutil'"
  exit 1
fi

if ! command -v inkscape &> /dev/null; then
  echo "Please make sure to have 'inkscape' on your PATH!"
  exit 1
fi

input_svg="build/icon-macos.svg"
tmp_dir="$(mktemp -dt zulip-icon)"
output_dir="$tmp_dir.iconset"
output_icns="build/icon.icns"

mv "$tmp_dir" "$output_dir"

trap "rm -rf '$output_dir'" EXIT

echo "==> Generating icons from $input_svg..."

for size in 16 32 64 128 256 512 1024; do
  echo "Generating icon of size $size..."
  icon_prefix="icon_${size}x${size}"
  inkscape -o "$output_dir/$icon_prefix.png"  -w $size     "$input_svg"
  inkscape -o "$output_dir/$icon_prefix@2x.png" -w $((size * 2)) "$input_svg"
done

echo "==> Updating ICNS icons..."

for icns in "${output_icns[@]}"; do
  echo "Updating $icns..."
  iconutil -c icns -o "$icns" "$output_dir"
done

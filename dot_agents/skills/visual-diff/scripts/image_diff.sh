#!/usr/bin/env bash
set -euo pipefail

usage='Usage: image_diff.sh <before.png> <after.png> <diff.png> [threshold]'

if (( $# < 3 || $# > 4 )); then
  printf '%s\n' "$usage" >&2
  exit 1
fi

before_path="$1"
after_path="$2"
output_path="$3"
threshold="${4:-12}"

if [[ ! "$threshold" =~ ^[0-9]+$ ]]; then
  printf 'Threshold must be an integer from 0 to 255\n' >&2
  exit 1
fi

normalized_threshold="${threshold#"${threshold%%[!0]*}"}"
normalized_threshold="${normalized_threshold:-0}"
if (( ${#normalized_threshold} > 3 )) || \
  (( 10#$normalized_threshold > 255 )); then
  printf 'Threshold must be an integer from 0 to 255\n' >&2
  exit 1
fi
threshold=$((10#$normalized_threshold))

if ! command -v magick >/dev/null; then
  printf 'ImageMagick 7 is required: magick was not found\n' >&2
  exit 1
fi

if [[ -e "$output_path" ]] && \
  { [[ "$output_path" -ef "$before_path" ]] || \
    [[ "$output_path" -ef "$after_path" ]]; }; then
  printf 'Output path must not refer to either source screenshot\n' >&2
  exit 1
fi

read -r before_width before_height < <(
  magick identify -format '%w %h\n' "$before_path"
)
read -r after_width after_height < <(
  magick identify -format '%w %h\n' "$after_path"
)

if (( before_width != after_width || before_height != after_height )); then
  printf 'Screenshots must have identical dimensions (before: %sx%s, after: %sx%s)\n' \
    "$before_width" "$before_height" "$after_width" "$after_height" >&2
  exit 1
fi

temporary_dir="$(mktemp -d)"
trap 'rm -rf "$temporary_dir"' EXIT

threshold_percent="$(awk -v value="$threshold" \
  'BEGIN { printf "%.10f%%", value / 255 * 100 }')"

magick "$before_path" -background white -alpha remove -alpha off \
  "$temporary_dir/before.png"
magick "$after_path" -background white -alpha remove -alpha off \
  "$temporary_dir/after.png"
magick "$temporary_dir/before.png" "$temporary_dir/after.png" \
  -compose difference -composite -fx 'max(max(r,g),b)' \
  -threshold "$threshold_percent" "$temporary_dir/mask.png"
magick "$temporary_dir/after.png" -fill white -colorize 85% \
  "$temporary_dir/faint.png"
magick -size "${after_width}x${after_height}" xc:'#ff0080' \
  "$temporary_dir/mask.png" -alpha off -compose CopyOpacity -composite \
  "$temporary_dir/changed.png"

mkdir -p "$(dirname "$output_path")"
magick "$temporary_dir/faint.png" "$temporary_dir/changed.png" \
  -compose Over -composite "$output_path"

changed_pixels="$(magick "$temporary_dir/mask.png" \
  -format '%[fx:round(mean*w*h)]' info:)"
total_pixels=$((after_width * after_height))
changed_percent="$(awk -v changed="$changed_pixels" -v total="$total_pixels" \
  'BEGIN { printf "%.2f", changed / total * 100 }')"

printf 'Wrote %s (%s changed pixels, %s%%)\n' \
  "$output_path" "$changed_pixels" "$changed_percent"

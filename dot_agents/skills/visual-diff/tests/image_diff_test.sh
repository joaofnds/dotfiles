#!/usr/bin/env bash
set -euo pipefail

skill_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
image_diff="$skill_dir/scripts/image_diff.sh"
test_dir="$(mktemp -d)"
trap 'rm -rf "$test_dir"' EXIT

assert_contains() {
  local actual="$1"
  local expected="$2"
  local behavior="$3"

  if [[ "$actual" == *"$expected"* ]]; then
    return
  fi

  printf 'FAIL: %s\nexpected: %s\nactual: %s\n' "$behavior" "$expected" "$actual" >&2
  exit 1
}

assert_rejects_dimensions() {
  local candidate="$1"
  local case_name="$2"
  local error

  if bash "$image_diff" "$test_dir/before.png" "$candidate" "$test_dir/no.png" \
    >"$test_dir/$case_name.stdout" 2>"$test_dir/$case_name.stderr"; then
    printf 'FAIL: accepts %s dimension mismatch\n' "$case_name" >&2
    exit 1
  fi

  error="$(<"$test_dir/$case_name.stderr")"
  assert_contains "$error" 'Screenshots must have identical dimensions' \
    "rejects $case_name dimension mismatch"
}

assert_rejects_threshold() {
  local threshold="$1"
  local case_name="$2"
  local error

  if bash "$image_diff" \
    "$test_dir/before.png" \
    "$test_dir/after.png" \
    "$test_dir/no.png" \
    "$threshold" \
    >"$test_dir/$case_name.stdout" 2>"$test_dir/$case_name.stderr"; then
    printf 'FAIL: accepts %s threshold\n' "$case_name" >&2
    exit 1
  fi

  error="$(<"$test_dir/$case_name.stderr")"
  assert_contains "$error" 'Threshold must be an integer from 0 to 255' \
    "rejects $case_name threshold"
}

assert_rejects_source_output() {
  local source="$1"
  local output="$2"
  local case_name="$3"
  local hash_before
  local hash_after
  local error

  hash_before="$(shasum -a 256 "$source")"

  if bash "$image_diff" "$source" "$test_dir/after.png" "$output" \
    >"$test_dir/$case_name.stdout" 2>"$test_dir/$case_name.stderr"; then
    printf 'FAIL: accepts %s source screenshot as output\n' "$case_name" >&2
    exit 1
  fi

  hash_after="$(shasum -a 256 "$source")"
  error="$(<"$test_dir/$case_name.stderr")"
  if [[ "$hash_before" != "$hash_after" ]]; then
    printf 'FAIL: modifies %s source screenshot while rejecting it\n' \
      "$case_name" >&2
    exit 1
  fi

  assert_contains "$error" \
    'Output path must not refer to either source screenshot' \
    "rejects $case_name source screenshot as output"
}

magick -size 3x1 'xc:rgba(0,0,0,0)' \
  -fill 'rgb(10,20,30)' -draw 'point 1,0' \
  -fill 'rgb(20,40,60)' -draw 'point 2,0' \
  "$test_dir/before.png"
magick -size 3x1 'xc:rgba(255,255,255,0)' \
  -fill 'rgb(80,20,30)' -draw 'point 1,0' \
  -fill 'rgb(20,40,60)' -draw 'point 2,0' \
  "$test_dir/after.png"

result="$(bash "$image_diff" \
  "$test_dir/before.png" \
  "$test_dir/after.png" \
  "$test_dir/diff.png")"
changed_pixel="$(magick "$test_dir/diff.png" -format '%[pixel:p{1,0}]' info:)"
unchanged_pixel="$(magick "$test_dir/diff.png" -depth 8 txt:- | sed -n '4p')"

assert_contains "$result" '(1 changed pixels, 33.33%)' \
  'marks only the visible changed pixel'
assert_contains "$changed_pixel" '255,0,128' \
  'renders changed pixels in magenta'
assert_contains "$unchanged_pixel" '#DCDFE2' \
  'washes unchanged content toward white'

cp "$test_dir/before.png" "$test_dir/exact-source.png"
assert_rejects_source_output \
  "$test_dir/exact-source.png" "$test_dir/exact-source.png" 'exact-path'

cp "$test_dir/before.png" "$test_dir/linked-source.png"
ln "$test_dir/linked-source.png" "$test_dir/source-output.png"
assert_rejects_source_output \
  "$test_dir/linked-source.png" "$test_dir/source-output.png" 'hard-link'

override_result="$(bash "$image_diff" \
  "$test_dir/before.png" \
  "$test_dir/after.png" \
  "$test_dir/override.png" \
  070)"
assert_contains "$override_result" '(0 changed pixels, 0.00%)' \
  'applies a zero-padded decimal threshold override'

zero_padded_result="$(bash "$image_diff" \
  "$test_dir/before.png" \
  "$test_dir/after.png" \
  "$test_dir/zero-padded.png" \
  08 2>"$test_dir/zero-padded.stderr")"
if [[ -s "$test_dir/zero-padded.stderr" ]]; then
  printf 'FAIL: emits an arithmetic error for a decimal threshold\n' >&2
  exit 1
fi
assert_contains "$zero_padded_result" '(1 changed pixels, 33.33%)' \
  'accepts decimal thresholds containing eight or nine'

maximum_result="$(bash "$image_diff" \
  "$test_dir/before.png" \
  "$test_dir/after.png" \
  "$test_dir/maximum.png" \
  0255)"
assert_contains "$maximum_result" '(0 changed pixels, 0.00%)' \
  'accepts the zero-padded maximum threshold'

magick -size 1x1 xc:black "$test_dir/threshold-before.png"
magick -size 1x1 'xc:rgb(12,0,0)' "$test_dir/threshold-equal.png"
magick -size 1x1 'xc:rgb(13,0,0)' "$test_dir/threshold-over.png"
default_equal_result="$(bash "$image_diff" \
  "$test_dir/threshold-before.png" \
  "$test_dir/threshold-equal.png" \
  "$test_dir/threshold-equal-diff.png")"
default_over_result="$(bash "$image_diff" \
  "$test_dir/threshold-before.png" \
  "$test_dir/threshold-over.png" \
  "$test_dir/threshold-over-diff.png")"

assert_contains "$default_equal_result" '(0 changed pixels, 0.00%)' \
  'leaves a change equal to the default threshold unmarked'
assert_contains "$default_over_result" '(1 changed pixels, 100.00%)' \
  'marks a change above the default threshold'

magick -size 4x1 xc:white "$test_dir/wide.png"
magick -size 3x2 xc:white "$test_dir/tall.png"
assert_rejects_dimensions "$test_dir/wide.png" 'width-only'
assert_rejects_dimensions "$test_dir/tall.png" 'height-only'

assert_rejects_threshold 256 'out-of-range'
assert_rejects_threshold 0256 'zero-padded out-of-range'
assert_rejects_threshold noise 'non-numeric'
assert_rejects_threshold -1 'negative'
assert_rejects_threshold 999999999999999999999999999999999999 \
  'overflow-sized'

printf 'PASS: image diff behavior\n'

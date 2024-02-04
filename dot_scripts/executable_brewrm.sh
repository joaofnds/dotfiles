#!/usr/bin/env sh

formula=""
dry_run=false

function usage() {
  echo "Usage: $0 <formula> [--dry-run]"
  exit 1
}

while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      usage
      ;;
    --dry-run)
      dry_run=true
      shift
      ;;
    *)
      formula=$1
      shift
      ;;
  esac
done

[[ -z $formula ]] && usage

echo "querying $formula uses"
uses=$(brew uses --installed "$formula")

echo "uses found:" $(xargs <<< $uses | tr ' ' ',')

echo "removing $formula"
if [[ $dry_run == true ]]; then
  echo "brew rm $formula --ignore-dependencies"
else
  brew rm "$formula" --ignore-dependencies
fi

for use in $uses; do
  echo "installing $use dependencies"
  if [[ $dry_run == true ]]; then
    echo "brew install $use --only-dependencies"
  else
    brew install "$use" --only-dependencies
  fi
done

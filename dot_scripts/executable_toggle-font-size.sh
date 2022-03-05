#!/usr/bin/env zsh

cmdata=".chezmoidata.toml"
current=28
changeto=18

pushd ~/code/dotfiles

grep $current $cmdata

if [[ ! $? -eq 0 ]]; then
  current=18
  changeto=28
fi

sd -s $current $changeto $cmdata

chezmoi apply -v $(ag --files-with-matches --fixed-strings --ignore  "dot_scripts" ".font.size" | xargs -n1 chezmoi target-path)

popd

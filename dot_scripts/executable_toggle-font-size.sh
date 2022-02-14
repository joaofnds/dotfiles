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

chezmoi diff
printf "should apply?(y/n) "
read -q

if [[ $REPLY =~ ^[Yy]$ ]]; then
  chezmoi apply -v
fi

popd

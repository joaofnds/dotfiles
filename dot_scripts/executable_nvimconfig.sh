#!/usr/bin/env zsh

chezmoipane=$(tmux new-window -dP)
tmux send-keys -t $chezmoipane -l 'cd ~/code/dotfiles; fd -e fnl | entr -r chezmoi apply ~/.config/nvim --force'
tmux send-keys -t $chezmoipane 'C-m'

rakepane=$(tmux split-window -dPt $chezmoipane)
tmux send-keys -t $rakepane -l 'cd ~/.config/nvim; fd -e fnl | entr -r rake -m'
tmux send-keys -t $rakepane 'C-m'

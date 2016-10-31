#!/usr/bin/env sh

dotfiles="$HOME/.dotfiles"

echo "Home dir $HOME"
echo "dotfiles dir $dotfiles"

warn() {
	echo "$1" >$2
}

die() {
	warn "$1"
	exit 1
}

lnif() {
	if [ ! -e $2 ]; then
		ln -sf $1 $1
	fi
}

echo "Installing/Updating dotfiles..."

if [ ! -e $dotfiles/.git ]; then
	echo "Cloning dotfile."
	git clone https://github.com/joaofnds/dotfiles.git $dotfiles
else
	cd $dotfiles && git pull
fi

# Bash
echo "Setting up bash..."
lnif $dotfiles/user.bashrc $HOME/.bashrc
lnif $dotfiles/.aliases $HOME/.aliases
lnif $dotfiles/.env $HOME/.env

# Vim
echo "Setting up vim..."
lnif $dotfiles/.vimrc $HOME/.vimrc
lnif $dotfiles/.vimrc_background $HOME/.vimrc_background
lnif $dotfiles/.gvimrc $HOME/.gvimrc
lnif $dotfiles/.vim $HOME/.vim

# Emacs
echo "Setting up emacs..."
lnif $dotfiles/.emacs $HOME/.emacs
lnif $dotfiles/.emacs.d $HOME/.emacs.d

# zsh
echo "Setting up zsh..."
lnif $dotfiles/.zshrc $HOME/.zshrc

# fish
echo "Setting up fish..."

if [ ! -d $HOME/.config ];then
	mkdir -p $HOME/.config
fi

lnif $dotfiles/.config/fish $HOME/.config/fish

# tmux
echo "Setting up tmux..."
lnif $dotfiles/.tmux.conf $HOME/.tmux.conf

# urxvt
echo "Setting up urxvt..."
lnif $dotfiles/.Xdefaults $HOME/.Xdefaults
lnif $dotfiles/.Xresources $HOME/.Xresources

# termite
echo "Setting up terminte..."

if [ ! -d $HOME/.config ];then
	mkdir -p $HOME/.config
fi

lnif $dotfiles/.config/termite $HOME/.config/termite

# git
echo "Setting up gitconfig..."
lnif $dotfiles/.gitconfig $HOME/.gitconfig

# ssh
echo "Setting up ssh public key..."
lnif $dotfiles/.ssh $HOME/.ssh

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
git clone https://github.com/scrooloose/nerdtree.git ~/.vim/bundle/nerdtree
git clone https://github.com/Xuyuanp/nerdtree-git-plugin.git ~/.vim/bundle/nerdtree-git-plugin
git clone https://github.com/tomtom/tlib_vim.git ~/.vim/bundle/tlib_vim
git clone https://github.com/MarcWeber/vim-addon-mw-utils.git ~/.vim/bundle/vim-addon-mw-utils
git clone git://github.com/tpope/vim-fugitive.git ~/.vim/bundle/vim-fugitive
git clone https://github.com/xolox/vim-misc.git ~/.vim/bundle/vim-misc
git clone https://github.com/xolox/vim-notes.git ~/.vim/bundle/vim-notes
git clone https://github.com/garbas/vim-snipmate.git ~/.vim/bundle/vim-snipmate
git clone git://github.com/tpope/vim-surround.git ~/.vim/bundle/vim-surround


# powerline-status
echo "Setting up powerline"
## Installing and upgrading pip
echo "Installing python-pip"
sudo apt install python-pip

echo "Upgrading pip"
pip install --upgrade pip

## Installing powerline
echo "Installing powerline"
pip install --user powerline-status
wget https://github.com/powerline/fonts/blob/master/Inconsolata/Inconsolata%20for%20Powerline.otf

## Installing powerline fonts
echo "Moving powerline fonts to appropriate folders"
if [ ! -d $HOME/.fonts ]; then
		mkdir $HOME/.fonts
fi
mv Inconsolata\ for\ Powerline.otf $HOME/.fonts/
echo "Updating fonts cache"
sudo fc-cache -vf $HOME/.fonts/

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

#!/usr/bin/env sh

dotfiles="$HOME/.dotfiles"
backupdir="$HOME/old_dotfiles"

warn() {
	echo "$1" >$2
}

die() {
	warn "$1"
	exit 1
}

lnif() {
	if [ -e $2 ] && [ ! -h $2 ]; then
		if [ ! -d $backupdir ]; then
			echo "All your old dotfiles will be stored inside '$backupdir'"
			mkdir $backupdir
		fi
		echo "Saving $2 inside '$backupdir'"
		mv -f $2 $backupdir
	fi
	ln -fs $1 $2
}

echo "Installing/Updating dotfiles..."

if [ ! -e $dotfiles/.git ]; then
	echo "Cloning dotfiles repo."
	git clone https://github.com/joaofnds/dotfiles.git $dotfiles
else
	echo "Applying pull to dotfiles repo."
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
if [ -e $dotfiles/.vim/bundle/nerdtree ]; then
	echo "Applying pull to NERDTree"
	git --git-dir=$dotfiles/.vim/bundle/nerdtree/.git pull
else
	echo "Cloning NERDTree"
	git clone https://github.com/scrooloose/nerdtree.git $dotfiles/.vim/bundle/nerdtree
fi

if [ -e $dotfiles/.vim/bundle/nerdtree-git-plugin ]; then
	echo "Applying pull to NERDTree-git-plugin"
	git --git-dir=$dotfiles/.vim/bundle/nerdtree-git-plugin/.git pull
else
	echo "Cloning NERDTree-git-git-plugin"
	git clone https://github.com/Xuyuanp/nerdtree-git-plugin.git $dotfiles/.vim/bundle/nerdtree-git-plugin
fi

if [ -e $dotfiles/.vim/bundle/tlib_vim ]; then
	echo "Applying pull to tlib_vim"
	git --git-dir=$dotfiles/.vim/bundle/tlib_vim/.git pull
else
	echo "Cloning tlib_vim"
	git clone https://github.com/tomtom/tlib_vim.git $dotfiles/.vim/bundle/tlib_vim
fi

if [ -e $dotfiles/.vim/bundle/vim-addon-mw-utils ]; then
	echo "Applying pull to vim-addon-mw-utils"
	git --git-dir=$dotfiles/.vim/bundle/vim-addon-mw-utils/.git pull
else
	echo "Cloning vim-addon-mw-utils"
	git clone https://github.com/MarcWeber/vim-addon-mw-utils.git $dotfiles/.vim/bundle/vim-addon-mw-utils
fi

if [ -e $dotfiles/.vim/bundle/vim-fugitive ]; then
	echo "Applying pull to vim-fugitive"
	git --git-dir=$dotfiles/.vim/bundle/vim-fugitive/.git pull
else
	echo "Cloning vim-fugitive"
	git clone git://github.com/tpope/vim-fugitive.git $dotfiles/.vim/bundle/vim-fugitive
fi

if [ -e $dotfiles/.vim/bundle/vim-misc ]; then
	echo "Applying pull to vim-misc"
	git --git-dir=$dotfiles/.vim/bundle/vim-misc/.git pull
else
	echo "Cloning vim-misc"
	git clone https://github.com/xolox/vim-misc.git $dotfiles/.vim/bundle/vim-misc
fi

if [ -e $dotfiles/.vim/bundle/vim-notes ]; then
	echo "Applying pull to vim-notes"
	git --git-dir=$dotfiles/.vim/bundle/vim-notes/.git pull
else
	echo "Cloning vim-notes"
	git clone https://github.com/xolox/vim-notes.git $dotfiles/.vim/bundle/vim-notes
fi

if [ -e $dotfiles/.vim/bundle/vim-snipmate ]; then
	echo "Applying pull to vim-snipmate"
	git --git-dir=$dotfiles/.vim/bundle/vim-snipmate/.git pull
else
	echo "Cloning vim-snipmate"
	git clone https://github.com/garbas/vim-snipmate.git $dotfiles/.vim/bundle/vim-snipmate
fi

if [ -e $dotfiles/.vim/bundle/vim-surround ]; then
	echo "Applying pull to vim-surround"
	git --git-dir=$dotfiles/.vim/bundle/vim-surround/.git pull
else
	echo "Cloning vim-surround"
	git clone git://github.com/tpope/vim-surround.git $dotfiles/.vim/bundle/vim-surround
fi



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

## Installing powerline fonts
echo "Installing Inconsolata For Powerline font"
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

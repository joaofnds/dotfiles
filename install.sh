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
		mv -rf $2 $backupdir
	elif [ -h $2 ]; then
		rm -f $2
	fi
	ln -fsv $1 $2
}

# git
echo "Setting up gitconfig..."
sudo apt install git
lnif $dotfiles/.gitconfig $HOME/.gitconfig

# dotfiles dir
echo "Installing/Updating dotfiles..."

if [ ! -e $dotfiles/.git ]; then
	echo "Cloning dotfiles repo."
	git clone https://github.com/joaofnds/dotfiles.git $dotfiles
else
	echo "Applying pull to dotfiles repo."
	cd $dotfiles && git pull
fi

# Font
echo "Installing Inconsolata and Monaco Nerd font"
if [ ! -d $HOME/.fonts ]; then
		mkdir $HOME/.fonts
fi
cp -f $dotfiles/.fonts/Monaco\ Nerd\ Font\ Complete\ Mono.ttf $HOME/.fonts/
cp -f $dotfiles/.fonts/Inconsolata\ Nerd\ Font\ Complete.ttf $HOME/.fonts/
echo "Updating fonts cache"
sudo fc-cache -vf $HOME/.fonts/

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

if [ -e $dotfiles/.vim/bundle/ultisnips ]; then
	echo "Applying pull to ultisnips"
	git --git-dir=$dotfiles/.vim/bundle/ultisnips/.git pull
else
	echo "Cloning ultisnips"
	git clone git://github.com/SirVer/ultisnips.git $dotfiles/.vim/bundle/ultisnips
fi

if [ -e $dotfiles/.vim/bundle/vim-snippets ]; then
	echo "Applying pull to vim-snippets"
	git --git-dir=$dotfiles/.vim/bundle/vim-snippets/.git pull
else
	echo "Cloning vim-snippets"
	 git clone https://github.com/honza/vim-snippets.git $dotfiles/.vim/bundle/vim-snippets
fi

if [ -e $dotfiles/.vim/bundle/vim-surround ]; then
	echo "Applying pull to vim-surround"
	git --git-dir=$dotfiles/.vim/bundle/vim-surround/.git pull
else
	echo "Cloning vim-surround"
	git clone https://github.com/tpope/vim-surround.git $dotfiles/.vim/bundle/vim-surround
fi

if [ -e $dotfiles/.vim/bundle/vim-devicons ]; then
	echo "Applying pull to vim-devicons"
	git --git-dir=$dotfiles/.vim/bundle/vim-devicons/.git pull
else
	echo "Cloning vim-devicons"
	git clone https://github.com/ryanoasis/vim-devicons $dotfiles/.vim/bundle/vim-devicons
fi

if [ -e $dotfiles/.vim/bundle/emmet-vim ]; then
	echo "Applying pull to emmet-vim"
	git --git-dir=$dotfiles/.vim/bundle/emmet-vim/.git pull
else
	echo "Cloning emmet-vim"
	git clone https://github.com/mattn/emmet-vim $dotfiles/.vim/bundle/emmet-vim
fi

if [ -e $dotfiles/.vim/bundle/auto-pairs ]; then
	echo "Applying pull to auto-pairs"
	git --git-dir=$dotfiles/.vim/bundle/auto-pairs/.git pull
else
	echo "Cloning auto-pairs"
	git clone git://github.com/jiangmiao/auto-pairs.git $dotfiles/.vim/bundle/auto-pairs
fi

if [ -e $dotfiles/.vim/bundle/ctrlp-vim ]; then
	echo "Applying pull to ctrlp-vim"
	git --git-dir=$dotfiles/.vim/bundle/ctrlp-vim/.git pull
else
	echo "Cloning ctrlp-vim"
	git clone https://github.com/ctrlpvim/ctrlp.vim.git $dotfiles/.vim/bundle/ctrlp-vim
fi

if [ -e $dotfiles/.vim/bundle/vim-vue ]; then
	echo "Applying pull to vim-vue"
	git --git-dir=$dotfiles/.vim/bundle/vim-vue/.git pull
else
	echo "Cloning vim-vue"
	git clone https://github.com/posva/vim-vue.git $dotfiles/.vim/bundle/vim-vue
fi

if [ -e $dotfiles/.vim/bundle/syntastic ]; then
	echo "Applying pull to syntastic"
	git --git-dir=$dotfiles/.vim/bundle/syntastic/.git pull
else
	echo "Cloning syntastic"
	git clone https://github.com/scrooloose/syntastic.git $dotfiles/.vim/bundle/syntastic
fi

echo "Installing cmake..."
sudo apt install cmake

if [ -e $dotfiles/.vim/bundle/YouCompleteMe ]; then
	echo "Applying pull to YouCompleteMe"
	git --git-dir=$dotfiles/.vim/bundle/YouCompleteMe/.git pull --recurse-submodules
	bash $dotiles/.vim/bundle/YouCompleteMe/install.sh --clang-completer
else
	echo "Cloning YouCompleteMe"
	git clone https://github.com/Valloric/YouCompleteMe.git $dotfiles/.vim/bundle/YouCompleteMe
	git --git-dir=$dotfiles/.vim/bundle/YouCompleteMe/.git submodule update --init --recursive
	python $dotiles/.vim/bundle/YouCompleteMe/install.py --clang-completer
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

# Emacs
echo "Setting up emacs..."
lnif $dotfiles/.emacs $HOME/.emacs
lnif $dotfiles/.emacs.d $HOME/.emacs.d

# zsh
echo "Setting up zsh..."
sudo apt install zsh
lnif $dotfiles/.zshrc $HOME/.zshrc
echo " ######### ZSH was installed, to change your default shell for it run chsh -s `which zsh` #########"

## oh-my-zsh
echo "Installing oh-my-zsh"

git clone git://github.com/robbyrussell/oh-my-zsh.git $dotfiles/.oh-my-zsh

lnif $dotfiles/.oh-my-zsh $HOME/.oh-my-zsh

echo "Installing powerlevel9k theme"

if [ ! -d $HOME/.oh-my-zsh/custom/themes ]; then
	mkdir -p $dotfiles/.oh-my-zsh/custom/themes
fi
git clone https://github.com/bhilburn/powerlevel9k.git $HOME/.oh-my-zsh/custom/themes/powerlevel9k

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
lnif $dotfiles/.Xresources $HOME/.Xdefaults
lnif $dotfiles/.Xresources $HOME/.Xresources

# termite
echo "Setting up termite..."

if [ ! -d $HOME/.config ];then
	mkdir -p $HOME/.config
fi

lnif $dotfiles/.config/termite $HOME/.config/termite

# base16-shell

if [ ! -d $HOME/.config ]; then
	mkdir -p $HOME/.config
fi

if [ -d $dotfiles/.config/base16-shell ]; then
	git --git-dir=$dotfiles/.config/base16-shell/.git pull
else
	git clone https://github.com/chriskempson/base16-shell.git $dotfiles/.config/base16-shell
fi
lnif $dotfiles/.config/base16-shell $HOME/.config/base16-shell

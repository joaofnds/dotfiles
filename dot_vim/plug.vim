" Install vim-plug if not installed
if empty(glob('~/.vim/autoload/plug.vim'))
  silent !curl -fLo ~/.vim/autoload/plug.vim --create-dirs
    \ https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
  autocmd VimEnter * PlugInstall --sync | source $MYVIMRC
endif

call plug#begin()
" General plugins
Plug 'tpope/vim-surround'   " mappings to {delete,change,add} surrounding pairs
Plug 'tpope/vim-commentary' " comment stuf out
Plug 'tpope/vim-repeat'     " repeat commands event after a plugin map
Plug 'tpope/vim-sensible'   " Sensible vim defaults
Plug 'tpope/vim-rsi'        " Readline keybinds
Plug 'scrooloose/nerdtree'

" # Formatting
Plug 'junegunn/vim-easy-align'
Plug 'Yggdroot/indentLine'

" # Shell util integrations
Plug '/usr/local/opt/fzf'
Plug 'junegunn/fzf.vim'

Plug 'christoomey/vim-tmux-navigator'
Plug 'christoomey/vim-tmux-runner'
Plug 'thoughtbot/vim-rspec'

" # Git
Plug 'tpope/vim-fugitive'
Plug 'airblade/vim-gitgutter'

" # Languages and Projects

Plug 'tpope/vim-projectionist' " granular project configuration

" ## LSP
Plug 'neoclide/coc.nvim', {'branch': 'release'}

" ## Rails
Plug 'tpope/vim-rails'

" # Visual
Plug 'lifepillar/vim-solarized8'


" Status line
Plug 'vim-airline/vim-airline'
Plug 'vim-airline/vim-airline-themes'

call plug#end()

" Load plugged settings
let vimsettings = $VIM_HOME.'/settings'

for fpath in split(globpath(vimsettings, '*.vim'), '\n')
  exe 'source' fpath
endfor

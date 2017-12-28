" Always show statusline
set laststatus=2

" Use 256 colours (Use this setting only if your terminal supports 256 colours)
set t_Co=256

" Set encoding
set encoding=utf8

" Enable line Numbers
set number

" Disable line wrap
set nowrap

" Enable relative line numbers
set relativenumber

" 'autoindent' does nothing more than copy the indentation from the previous
"  line, when starting a new line.
set autoindent

" 'smartindent' automatically inserts one extra level of indentation in some
"  cases, and works for C-like files.
set smartindent

" Set tab lenght
set tabstop=2
set shiftwidth=2

" Enable show commands
set showcmd

" map jj to <Esc>
imap jj <Esc>

" Nerd tree toggle on Ctrl+n
map <C-n> :NERDTreeToggle<CR>

" Detect filetype and set syntax
filetype plugin on

" Set CWD when as rootdir when opening vim
set autochdir

let base16colorspace=256  " Access colors present in 256 colorspace"
syntax on
color dracula

" remap ',c' to open current file in chrome
" nnoremap ,c :exe ':silent !google-chrome-stable %'<CR>

" Set airline theme
let g:airline_powerline_fonts = 1
let g:airline_theme='bubblegum'

" Install vim-plug, if not installed
if empty(glob('~/.vim/autoload/plug.vim'))
	silent !curl -fLo ~/.vim/autoload/plug.vim --create-dirs
		\ https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
	autocmd VimEnter * PlugInstall
endif

call plug#begin()
" General plugins
Plug 'tpope/vim-surround'
Plug 'tpope/vim-commentary'
Plug 'tpope/vim-repeat'
Plug 'tpope/vim-sensible'

Plug 'scrooloose/nerdtree'

Plug 'Raimondi/delimitMate'

Plug 'junegunn/fzf', { 'dir': '~/.fzf', 'do': './install --all' }
Plug 'junegunn/fzf.vim'

Plug 'Valloric/YouCompleteMe', { 'do': './install.py --go-completer --js-completer' }

" Git plugins
Plug 'tpope/vim-fugitive'
Plug 'airblade/vim-gitgutter'

""" Languages

" Go plugins
Plug 'fatih/vim-go', { 'do': ':GoInstallBinaries' }

" Javascript plugins
Plug 'pangloss/vim-javascript'

" HTML plugins
Plug 'mattn/emmet-vim'

""" Visual

" Airline
Plug 'vim-airline/vim-airline'
Plug 'vim-airline/vim-airline-themes'
Plug 'ryanoasis/vim-devicons'

" Theme
Plug 'dracula/vim'

call plug#end()

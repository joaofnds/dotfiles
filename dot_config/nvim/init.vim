let $NVIM_HOME = $HOME.'/.config/nvim'

let mapleader = "\<Space>"

""""""""""
" General Config 

set encoding=utf8  " Set encoding
set laststatus=2   " Always show statusline
set number         " Enable line Numbers
set relativenumber " Enable relative line numbers
set nowrap         " Disable line wrap
set showcmd        " Show incomplete cmds down the bottom
set showmode       " Show current mode down the bottom
set visualbell     " No sounds"
set noautochdir    " Dont set CWD when as rootdir when opening vim
set autoread       " Reload files changed outside vim
set hidden         " This makes vim act like all other editors, buffers can exist in the background without being in a window. http://items.sjbach.com/319/configuring-vim-right
set colorcolumn=80 " Display a column at the 80th column
set tags=./tags
set nocompatible

set splitbelow " Default horizontal split direction
set splitright " Default vertical split direction

" Better diff algorithms
set diffopt+=algorithm:patience
set diffopt+=indent-heuristic

" Re-balance when vim is resized
autocmd VimResized * :wincmd =

" Remove visual selection with <esc>
nnoremap <esc> :nohlsearch<return><esc>
nnoremap <esc>^[ <esc>^[

""""""""""
" Indentation

set autoindent
set smartindent
set smarttab
set shiftwidth=2
set softtabstop=2
set tabstop=2
set expandtab
set list listchars=tab:⇥\ ,trail:·

filetype indent on

" Identation for python files
autocmd BufNewFile,BufRead *.py
    \ set expandtab         " replace tabs with spaces
    \ set autoindent        " copy indent when starting a new line
    \ set tabstop=4
    \ set softtabstop=4
    \ set shiftwidth=4
    \ set foldmethod=indent " indent based on spaces

""""""""""
" Turn Off Swap Files

set noswapfile
set nobackup
set nowb

""""""""""
" Persistent Undo

" Keep undo history across sessions, by storing in file.
if !isdirectory($NVIM_HOME.'/backups')
  silent !mkdir $NVIM_HOME/backups > /dev/null 2>&1
endif

set noswapfile
set nobackup
set undodir=$NVIM_HOME/backups
set undofile

""""""""""
" Folds

set foldmethod=indent " fold based on indent
set foldnestmax=3     " deepest fold is 3 levels
set nofoldenable      " dont fold by default

""""""""""
" Completion

set wildmode=list:longest
set wildmenu              " enable ctrl-n and ctrl-p to scroll thru matches

" stuff to ignore when tab completing
set wildignore=*.o,*.obj,*~
set wildignore+=*vim/backups*
set wildignore+=*sass-cache*
set wildignore+=*DS_Store*
set wildignore+=vendor/rails/**
set wildignore+=vendor/cache/**
set wildignore+=*.gem
set wildignore+=log/**
set wildignore+=tmp/**

set rtp+=/usr/local/opt/fzf

""""""""""
" Search

set incsearch       " Find the next match as we type the search
set hlsearch        " Highlight searches by default
set ignorecase      " Ignore case when searching...
set smartcase       " ...unless we type a capital

so $NVIM_HOME/plug.vim

let $NVIM_HOME = $HOME.'/.config/nvim'
" ================ General Config ====================

set encoding=utf8  " Set encoding
set laststatus=2   " Always show statusline
set number         " Enable line Numbers
set relativenumber " Enable relative line numbers
set nowrap         " Disable line wrap
set showcmd        "Show incomplete cmds down the bottom
set showmode       "Show current mode down the bottom
set visualbell     "No sounds"
set noautochdir    " Dont set CWD when as rootdir when opening vim
set autoread       "Reload files changed outside vim
set hidden         " This makes vim act like all other editors, buffers can exist in the background without being in a window. http://items.sjbach.com/319/configuring-vim-right

" ================ Indentation ================

set autoindent
set smartindent
set smarttab
set shiftwidth=2
set softtabstop=2
set tabstop=2
set expandtab

" Auto indent pasted text
nnoremap p p=`]<C-o>
nnoremap P P=`]<C-o>

filetype indent on

" ================ Colors ==============

set t_Co=256                " Use 256 colours (Use this setting only if your terminal supports 256 colors)

syntax on
filetype plugin on " Detect filetype and set syntax

"Use 24-bit (true-color) mode in Vim/Neovim when outside tmux.
"If you're using tmux version 2.2 or later, you can remove the outermost $TMUX check and use tmux's 24-bit color support
"(see < http://sunaku.github.io/tmux-24bit-color.html#usage > for more information.)
if (empty($TMUX))
  set termguicolors
endif

" ================ Turn Off Swap Files ==============

set noswapfile
set nobackup
set nowb

" ================ Persistent Undo ==================
" Keep undo history across sessions, by storing in file.
if has('persistent_undo') && isdirectory($NVIM_HOME.'/backups')
  silent !mkdir $NVIM_HOME/backups > /dev/null 2>&1
  set undodir=$NVIM_HOME/backups
  set undofile
endif

" ================ Folds ================

set foldmethod=indent   "fold based on indent
set foldnestmax=3       "deepest fold is 3 levels
set nofoldenable        "dont fold by default

" ================ Completion =======================

set wildmode=list:longest
set wildmenu                "enable ctrl-n and ctrl-p to scroll thru matches
set wildignore=*.o,*.obj,*~ "stuff to ignore when tab completing
set wildignore+=*vim/backups*
set wildignore+=*sass-cache*
set wildignore+=*DS_Store*
set wildignore+=vendor/rails/**
set wildignore+=vendor/cache/**
set wildignore+=*.gem
set wildignore+=log/**
set wildignore+=tmp/**

" ================ Search ===========================

set incsearch       " Find the next match as we type the search
set hlsearch        " Highlight searches by default
set ignorecase      " Ignore case when searching...
set smartcase       " ...unless we type a capital


" map jj to <Esc>
imap jj <Esc>

so $NVIM_HOME/plug.vim

" Heavely inspired by github.com/skwp/dotfiles

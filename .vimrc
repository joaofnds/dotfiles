" Powerline
set rtp+=$HOME/.local/lib/python2.7/site-packages/powerline/bindings/vim/

" Always show statusline
set laststatus=2

" Set colorscheme
colorscheme dracula

" Use 256 colours (Use this setting only if your terminal supports 256 colours)
set t_Co=256

" Set encoding
set encoding=utf8

" Enable line Numbers
set number

" Enable relative line numbers
set relativenumber

" Set tab lenght
set tabstop=4
set shiftwidth=4

" Enable show commands
set showcmd

" Pathogen
execute pathogen#infect()
filetype plugin indent on
syntax on

" Map NERDTree
"
" Toggle NERDTree with ctrl+n
map <C-n> :NERDTreeToggle<CR>
" Open NERDTree on file context with \+n
map <Leader>n :NERDTreeFind<CR>
" Show hidden files inside NERDTree ( "I" cand toggle this without bindings )
" let NERDTreeShowHidden=1
" Automatically delete the buffer of the file you just deleted with NerdTree
let NERDTreeAutoDeleteBuffer = 1

" vim-smooth-scroll bindings
noremap <silent> <c-u> :call smooth_scroll#up(&scroll, 25, 2)<CR>
noremap <silent> <c-d> :call smooth_scroll#down(&scroll, 25, 2)<CR>
noremap <silent> <c-b> :call smooth_scroll#up(&scroll*2, 25, 4)<CR>
noremap <silent> <c-f> :call smooth_scroll#down(&scroll*2, 25, 4)<CR>

" map jj -> <Esc>
imap jj <Esc>

filetype plugin on
set autochdir

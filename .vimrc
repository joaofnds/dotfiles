" Powerline
" Desktop powerline path
" set rtp+=/usr/local/lib/python3.5/dist-packages/powerline/bindings/vim/
" Notebook powerline path
set rtp+=/home/joaofnds/.local/lib/python2.7/site-packages/powerline/bindings/vim/

" Always show statusline
set laststatus=2

" Set colorscheme
colorscheme dracula

" Use 256 colours (Use this setting only if your terminal supports 256 colours)
set t_Co=256

" Enable line Numbers
set number

" Enable relative line numbers
set relativenumber

" Set tab lenght
set tabstop=4

" Enable show commands
set showcmd

" Set things for GUI
set guifont=Inconsolata\ for\ Powerline\ Medium\ 14
" guioptions can be abreviated to 'go'
set guioptions-=m  "remove menu bar
set guioptions-=T  "remove toolbar
set guioptions-=r  "remove right-hand scroll bar
set guioptions-=L  "remove left-hand scroll bar


" Pathogen
execute pathogen#infect()
filetype plugin indent on
syntax on

" Map NERDTree
map <C-n> :NERDTreeToggle<CR>
" Show hidden files inside NERDTree ( "I" cand toggle this without bindings )
" let NERDTreeShowHidden=1

" vim-smooth-scroll bindings
noremap <silent> <c-u> :call smooth_scroll#up(&scroll, 25, 2)<CR>
noremap <silent> <c-d> :call smooth_scroll#down(&scroll, 25, 2)<CR>
noremap <silent> <c-b> :call smooth_scroll#up(&scroll*2, 25, 4)<CR>
noremap <silent> <c-f> :call smooth_scroll#down(&scroll*2, 25, 4)<CR>

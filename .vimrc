" Powerline
set rtp+=$HOME/.local/lib/python2.7/site-packages/powerline/bindings/vim/

" Always show statusline
set laststatus=2

" Set colorscheme
" colorscheme dracula

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
set tabstop=4
set shiftwidth=4

" Enable show commands
set showcmd

let g:Powerline_symbols = 'fancy'

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

" ultisnips
" Trigger configuration. Do not use <tab> if you use https://github.com/Valloric/YouCompleteMe.
let g:UltiSnipsExpandTrigger="<c-j>"
let g:UltiSnipsJumpForwardTrigger="<c-j>"
let g:UltiSnipsJumpBackwardTrigger="<c-k>"

let base16colorspace=256  " Access colors present in 256 colorspace"
colorscheme base16-oceanicnext

" Syntastic
set statusline+=%#warningmsg#
set statusline+=%{SyntasticStatuslineFlag()}
set statusline+=%*

let g:syntastic_always_populate_loc_list = 1
let g:syntastic_auto_loc_list = 1
let g:syntastic_check_on_open = 1
let g:syntastic_check_on_wq = 0
let g:ycm_global_ycm_extra_conf = '~/.vim/bundle/YouCompleteMe/third_party/ycmd/cpp/ycm/.ycm_extra_conf.py'
nnoremap ,c :exe ':silent !google-chrome-stable %'<CR>

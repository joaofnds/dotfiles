filetype plugin on " Detect filetype and set syntax

syntax enable
set background=dark
set termguicolors
colorscheme solarized8

set t_8f="\<Esc>[38;2;%lu;%lu;%lum"
set t_8b="\<Esc>[48;2;%lu;%lu;%lum"
set t_Co=16777216

highlight Visual     gui=NONE guibg=#073642 guifg=NONE
highlight VisualNOS  gui=NONE guibg=#073642 guifg=NONE
highlight VisualMode gui=NONE guibg=#073642 guifg=NONE
highlight Search     gui=NONE guibg=#073642 guifg=NONE gui=undercurl,italic
highlight IncSearch  gui=NONE guibg=#073642 guifg=NONE gui=undercurl,italic

noremap <silent><esc> <esc>:nohl<CR><esc>

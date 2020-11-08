filetype plugin on " Detect filetype and set syntax

syntax enable
set background=dark
set termguicolors
colorscheme solarized8

let &t_8f = "\<Esc>[38;2;%lu;%lu;%lum"
let &t_8b = "\<Esc>[48;2;%lu;%lu;%lum"
let &t_Co = 16777216

highlight Search guibg=NONE guifg='#00FFFF' gui=undercurl,italic
highlight IncSearch guibg=NONE guifg='#00FFFF' gui=undercurl,italic
noremap <silent><esc> <esc>:nohl<CR><esc>

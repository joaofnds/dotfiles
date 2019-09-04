" ================ Install vim-plug if not installed ==============

if empty(glob('~/.vim/autoload/plug.vim'))
  silent !curl -fLo ~/.vim/autoload/plug.vim --create-dirs
    \ https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
  autocmd VimEnter * PlugInstall --sync | source $MYVIMRC
endif

call plug#begin()
" General plugins
Plug 'tpope/vim-surround'
Plug 'tpope/vim-commentary'
Plug 'tpope/vim-repeat'
Plug 'tpope/vim-sensible'
Plug 'tpope/vim-rsi'
Plug 'scrooloose/nerdtree'

" Snippets plugin
Plug 'sirver/ultisnips'

" Snippets bundle
Plug 'honza/vim-snippets'

" Formatting
Plug 'jiangmiao/auto-pairs'
Plug 'junegunn/vim-easy-align'
Plug 'Yggdroot/indentLine'

" Shell util integrations
Plug 'junegunn/fzf', { 'dir': '~/.fzf', 'do': './install --all' }
Plug 'junegunn/fzf.vim'

Plug 'jremmen/vim-ripgrep'

Plug 'christoomey/vim-tmux-navigator'
Plug 'christoomey/vim-tmux-runner'
Plug 'thoughtbot/vim-rspec'

" Git plugins
Plug 'tpope/vim-fugitive'
Plug 'airblade/vim-gitgutter'

""" Languages

" General language syntax highlight
Plug 'sheerun/vim-polyglot'

" Language server protocal integrations
Plug 'neoclide/coc.nvim', {'do': { -> coc#util#install()}}

" Rails
Plug 'tpope/vim-rails'

" Ruby
Plug 'tpope/vim-endwise'
Plug 'kana/vim-textobj-user'
Plug 'nelstrom/vim-textobj-rubyblock'

" Go plugins
Plug 'fatih/vim-go'

" HTML plugins
Plug 'mattn/emmet-vim'

""" Visual
" Status line
Plug 'vim-airline/vim-airline'
Plug 'vim-airline/vim-airline-themes'

call plug#end()

" Load plugged settings
let vimsettings = $VIM_HOME.'/settings'

for fpath in split(globpath(vimsettings, '*.vim'), '\n')
  exe 'source' fpath
endfor

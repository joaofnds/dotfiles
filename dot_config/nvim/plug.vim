" ================ Install vim-plug if not installed ==============

if empty(glob('~/.config/nvim/autoload/plug.vim'))
  silent !curl -fLo ~/.config/nvim/autoload/plug.vim --create-dirs
        \ https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
  autocmd VimEnter * PlugInstall
endif

call plug#begin()
" General plugins
Plug 'tpope/vim-surround'
Plug 'tpope/vim-commentary'
Plug 'tpope/vim-repeat'
Plug 'tpope/vim-sensible'
Plug 'tpope/vim-rsi'

Plug 'scrooloose/nerdtree'

" Asynchronous completion framework
Plug 'Shougo/deoplete.nvim', { 'do': ':UpdateRemotePlugins' }

" Keyword completion system
Plug 'shougo/neocomplete.vim'

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
Plug 'sheerun/vim-polyglot'
" Plug 'w0rp/ale'
" Plug 'scrooloose/syntastic'

" Rails
Plug 'tpope/vim-rails'

" Ruby
Plug 'tpope/vim-endwise'

" Go plugins
Plug 'fatih/vim-go'

" Elixir
Plug 'elixir-lang/vim-elixir'

" Javascript plugins
Plug 'pangloss/vim-javascript'

" Graphql
" Plug 'jparise/vim-graphql'

" HTML plugins
Plug 'mattn/emmet-vim'

""" Visual
Plug 'chriskempson/base16-vim'

" Status line
Plug 'vim-airline/vim-airline'
Plug 'vim-airline/vim-airline-themes'

call plug#end()

" Load plugged settings
let vimsettings = $NVIM_HOME.'/settings'

for fpath in split(globpath(vimsettings, '*.vim'), '\n')
  exe 'source' fpath
endfor

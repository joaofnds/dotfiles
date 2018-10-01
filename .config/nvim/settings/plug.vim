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

Plug 'jiangmiao/auto-pairs'

Plug 'junegunn/vim-easy-align'

Plug 'scrooloose/nerdtree'

Plug 'Shougo/deoplete.nvim', { 'do': ':UpdateRemotePlugins' }
Plug 'zchee/deoplete-go', { 'do': 'make'}

Plug 'junegunn/fzf', { 'dir': '~/.fzf', 'do': './install --all' }
Plug 'junegunn/fzf.vim'

Plug 'jremmen/vim-ripgrep'

" Git plugins
Plug 'tpope/vim-fugitive'
Plug 'airblade/vim-gitgutter'

""" Languages
Plug 'sheerun/vim-polyglot'
Plug 'w0rp/ale'
" Plug 'scrooloose/syntastic'

" Go plugins
Plug 'fatih/vim-go', { 'do': ':GoInstallBinaries' }

" Javascript plugins
Plug 'pangloss/vim-javascript'
" Plug 'carlitux/deoplete-ternjs', { 'do': 'yarn global add tern' }
" Plug 'marijnh/tern_for_vim'

" Graphql
" Plug 'jparise/vim-graphql'

" HTML plugins
Plug 'mattn/emmet-vim'

""" Visual

" Lightline
Plug 'itchyny/lightline.vim'

call plug#end()

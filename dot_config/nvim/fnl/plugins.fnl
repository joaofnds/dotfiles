(let [lazypath (.. (vim.fn.stdpath "data") "/lazy/lazy.nvim")]
  (when (not (vim.loop.fs_stat lazypath))
    (vim.fn.system ["git" "clone" "--filter=blob:none" "--branch=stable" "https://github.com/folke/lazy.nvim.git" lazypath]))
  (vim.opt.rtp:prepend lazypath))

(let [lazy (require :lazy)]
  (lazy.setup
    ["tpope/vim-sensible"      ;; sensible vim defaults
     "tpope/vim-rsi"           ;; readline keybinds
     "tpope/vim-repeat"        ;; repeat commands even after a plugin map
     "tpope/vim-commentary"    ;; comment stuf out
     "tpope/vim-surround"      ;; mappings to {delete,change,add} surrounding pairs
     "nvim-lua/plenary.nvim"   ;; the entire ecosystem uses this
     "junegunn/vim-easy-align" ;; ain't nobody got time to align things manually
     "github/copilot.vim"      ;; tab completion on steroids

     ;; git
     "NeogitOrg/neogit"        ;; git interface
     "sindrets/diffview.nvim"  ;; git diff interface
     "lewis6991/gitsigns.nvim" ;; in-buffer git stuff

     "preservim/nerdtree"   ;; does the job (pretty well tbh)
     "folke/which-key.nvim" ;; because I can't remeber every keybind
     "mbbill/undotree"      ;; because history is not linear

     ;; shell integration
     {1 "junegunn/fzf"
      :build (fn [] (vim.call "fzf#install"))}
     "junegunn/fzf.vim"

     "christoomey/vim-tmux-navigator" ;; jumping between vim and tmux, seamlessly
     "christoomey/vim-tmux-runner"    ;; run stuff on tmux, from vim

     ;; lsp
     "williamboman/mason.nvim" ;; lsp tools management
     "williamboman/mason-lspconfig.nvim"
     "neovim/nvim-lspconfig"

     "ray-x/lsp_signature.nvim"        ;; floating signature hint
     "nvimtools/none-ls.nvim"          ;; hook tools into nvim lsp api
     "folke/trouble.nvim"              ;; make it double.

     "hrsh7th/nvim-cmp"       ;; complete with:
     "hrsh7th/cmp-nvim-lsp"   ;; - lsp
     "hrsh7th/cmp-buffer"     ;; - buffer
     "hrsh7th/cmp-path"       ;; - paths
     "hrsh7th/cmp-nvim-lua"   ;; - neovim lua api

     ;; visual
     "ishan9299/nvim-solarized-lua" ;; works great with lua plugins
     "hoob3rt/lualine.nvim"         ;; pretty line
     {1 "romgrk/barbar.nvim"        ;; pretty tabline
      :init (fn [] (set vim.g.barbar_auto_setup false))}           
     "vigoux/notifier.nvim"         ;; non-intrusive notification system

     ;; languages
     "nvim-treesitter/nvim-treesitter"         ;; oh that's pretty - Kramer
     "nvim-treesitter/nvim-treesitter-context" ;; I keep forgetting where I am

     "mfussenegger/nvim-dap" ;; debugger
     "rcarriga/nvim-dap-ui"  ;; debugger ui

     {1 "iamcco/markdown-preview.nvim" ;; 'cause I can't render markdown mentally
      :build (fn [] (vim.call "mkdp#util#install"))
      :lazy true
      :cmd ["MarkdownPreviewToggle" "MarkdownPreview" "MarkdownPreviewStop"]
      :ft ["markdown"]}

     "Wansmer/treesj"

     "echasnovski/mini.pairs"

     {1 "eraserhd/parinfer-rust" ;; the superior way of writing lisp
      :build "cargo build --release"}]))

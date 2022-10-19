(let [install-path (.. (vim.fn.stdpath "data") "/site/pack/packer/start/packer.nvim")]
  (when (= "" (vim.fn.glob install-path))
    (print "installing packer...")
    (vim.fn.system ["git" "clone" "https://github.com/wbthomason/packer.nvim" install-path])
    (vim.api.nvim_command "packadd packer.nvim")))

(vim.cmd "packadd packer.nvim")

(let [packer (require :packer)
      lsp (require :config.lsp)]
  (packer.startup
   (fn [use]
     (use "wbthomason/packer.nvim")

     ;; General plugins
     (use "tpope/vim-sensible")      ;; sensible vim defaults
     (use "tpope/vim-rsi")           ;; readline keybinds
     (use "tpope/vim-repeat")        ;; repeat commands even after a plugin map
     (use "tpope/vim-commentary")    ;; comment stuf out
     (use "tpope/vim-surround")      ;; mappings to {delete,change,add} surrounding pairs
     (use "TimUntersberger/neogit")  ;; git interface
     (use "sindrets/diffview.nvim")  ;; git diff interface

     (use "jiangmiao/auto-pairs")
     (use {1 "eraserhd/parinfer-rust"  ;; the superior way of writing lisp
           "run" "cargo build --release"})

     (use "preservim/nerdtree")      ;; does the job (pretty well tbh)
     (use "lewis6991/gitsigns.nvim") ;; in buffer git stuff
     (use "folke/which-key.nvim")    ;; because I can't remeber every keybind
     (use "nat-418/boole.nvim")      ;; increment and decrement functionality

     ;; formatting
     (use "junegunn/vim-easy-align")         ;; ain't nobody got time to align things manually
     (use "nvim-treesitter/nvim-treesitter") ;; oh that's pretty - Kramer
     (use "nvim-treesitter/nvim-treesitter-context")

     ;; shell integration
     (use {1 "junegunn/fzf" "run" (fn [] (vim.call "fzf#install"))})
     (use "junegunn/fzf.vim")

     (use "christoomey/vim-tmux-navigator") ;; jumping between vim and tmux, seamlessly
     (use "christoomey/vim-tmux-runner")    ;; run stuff on tmux, from vim

     ;; lsp
     (use ["williamboman/nvim-lsp-installer"
           "ray-x/lsp_signature.nvim"
           {1 "neovim/nvim-lspconfig" :config lsp.config}])
     (use "jose-elias-alvarez/null-ls.nvim")
     (use "folke/trouble.nvim")

     (use "hrsh7th/nvim-cmp")     ;; complete with:
     (use "hrsh7th/cmp-nvim-lsp") ;; - lsp
     (use "hrsh7th/cmp-buffer")   ;; - buffer
     (use "hrsh7th/cmp-path")     ;; - paths

     (use "nvim-lua/plenary.nvim") ;; the world depends on this

     (use {1 "iamcco/markdown-preview.nvim"
           "run" (fn [] (vim.call "mkdp#util#install"))})

     ;; visual
     (use "ishan9299/nvim-solarized-lua") ;; works great with lua plugins
     (use "romgrk/barbar.nvim")           ;; pretty tabline
     (use "hoob3rt/lualine.nvim")         ;; pretty line

     ;; languages
     (use "bakpakin/fennel.vim")
     (use "nvim-orgmode/orgmode"))))

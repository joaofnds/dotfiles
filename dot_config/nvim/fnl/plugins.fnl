(let [install-path (.. (vim.fn.stdpath "data") "/site/pack/packer/start/packer.nvim")]
  (when (= "" (vim.fn.glob install-path))
    (print "installing packer...")
    (vim.fn.system ["git" "clone" "https://github.com/wbthomason/packer.nvim" install-path])
    (vim.api.nvim_command "packadd packer.nvim")))

(vim.cmd "packadd packer.nvim")

(let [packer (require :packer)]
  (packer.startup
   (fn [use]
     (use "wbthomason/packer.nvim")

     ;; General plugins
     (use "tpope/vim-sensible")      ;; sensible vim defaults
     (use "tpope/vim-rsi")           ;; readline keybinds
     (use "tpope/vim-repeat")        ;; repeat commands event after a plugin map
     (use "tpope/vim-commentary")    ;; comment stuf out
     (use "tpope/vim-surround")      ;; mappings to {delete,change,add} surrounding pairs
     (use "tpope/vim-fugitive")      ;; git interface
     (use "tpope/vim-projectionist") ;; granular project configuration

     (use "jiangmiao/auto-pairs")

     (use "lewis6991/gitsigns.nvim")
     (use "kyazdani42/nvim-tree.lua")
     (use "folke/which-key.nvim")
     (use "romgrk/barbar.nvim") ;; pretty tabline

     ;; Formatting
     (use "junegunn/vim-easy-align")
     (use "Yggdroot/indentLine")
     (use "nvim-treesitter/nvim-treesitter")
     (use "sbdchd/neoformat")

     ;; Shell integrations
     (use {1 "junegunn/fzf"
           "run" (fn [] (vim.call "fzf#install"))})
     (use "junegunn/fzf.vim")

     (use "christoomey/vim-tmux-navigator")
     (use "christoomey/vim-tmux-runner")
     ;; (use "thoughtbot/vim-rspec")


     ;; Languages and Projects
     (use "neovim/nvim-lspconfig")
     (use "williamboman/nvim-lsp-installer")
     (use "glepnir/lspsaga.nvim")
     (use "onsails/lspkind-nvim")
     (use "hrsh7th/nvim-compe")
     (use "folke/trouble.nvim")

     (use "nvim-lua/popup.nvim")
     (use "nvim-lua/plenary.nvim")
     (use "nvim-telescope/telescope.nvim")

     (use {1 "iamcco/markdown-preview.nvim"
           "run" (fn [] (vim.call "mkdp#util#install"))})

     (use "kristijanhusak/orgmode.nvim")

     ;; Visual
     (use "ishan9299/nvim-solarized-lua")
     (use "folke/twilight.nvim")
     (use "ryanoasis/vim-devicons")
     (use "kyazdani42/nvim-web-devicons")
     (use {1 "eraserhd/parinfer-rust"
           "run" "cargo build --release"})

     ;; Status line
     (use "hoob3rt/lualine.nvim"))))

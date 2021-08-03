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
     (use "scrooloose/nerdtree")
     (use "folke/which-key.nvim")
     (use "romgrk/barbar.nvim") ;; pretty tabline

     ;; Formatting
     (use "junegunn/vim-easy-align")
     (use "Yggdroot/indentLine")
     (use "nvim-treesitter/nvim-treesitter")
     (use "sbdchd/neoformat")

     ;; Shell integrations
     (use "/usr/local/opt/fzf")
     (use "junegunn/fzf.vim")

     (use "christoomey/vim-tmux-navigator")
     (use "christoomey/vim-tmux-runner")
     ;; (use "thoughtbot/vim-rspec")


     ;; Languages and Projects
     (use "neovim/nvim-lspconfig")
     (use "kabouzeid/nvim-lspinstall")
     (use "glepnir/lspsaga.nvim")
     (use "hrsh7th/nvim-compe")

     (use "nvim-lua/popup.nvim")
     (use "nvim-lua/plenary.nvim")
     (use "nvim-telescope/telescope.nvim")

     ;; Visual
     (use "lifepillar/vim-solarized8")
     (use "folke/twilight.nvim")

     ;; Status line
     (use "hoob3rt/lualine.nvim"))))

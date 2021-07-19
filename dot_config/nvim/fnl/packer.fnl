(fn use-packages [use]
  (use "wbthomason/packer.nvim")

  ;; General plugins
  (use "tpope/vim-sensible")   ;; Sensible vim defaults
  (use "tpope/vim-rsi")        ;; Readline keybinds
  (use "tpope/vim-repeat")     ;; repeat commands event after a plugin map
  (use "tpope/vim-commentary") ;; comment stuf out
  (use "tpope/vim-surround")   ;; mappings to {delete,change,add} surrounding pairs
  (use "scrooloose/nerdtree")
  (use "folke/which-key.nvim")
  (use "romgrk/barbar.nvim")  ;; pretty tabline

  ;; Formatting
  (use "junegunn/vim-easy-align")
  (use "Yggdroot/indentLine")
  (use {0 "nvim-treesitter/nvim-treesitter" "run" ":TSUpdate"})

  ;; Shell integrations
  (use "/usr/local/opt/fzf")
  (use "junegunn/fzf.vim")

  (use "christoomey/vim-tmux-navigator")
  (use "christoomey/vim-tmux-runner")
  ;; (use "thoughtbot/vim-rspec")

  ;; Git
  (use "tpope/vim-fugitive")
  (use "airblade/vim-gitgutter")

  ;; Languages and Projects
  (use "neovim/nvim-lspconfig")
  (use "kabouzeid/nvim-lspinstall")
  (use "glepnir/lspsaga.nvim")
  (use "hrsh7th/nvim-compe")

  (use "nvim-lua/popup.nvim")
  (use "nvim-lua/plenary.nvim")
  (use "nvim-telescope/telescope.nvim")
  ;; (use "tpope/vim-projectionist") ;; granular project configuration

  ;; Visual
  (use "lifepillar/vim-solarized8")

  ;; Status line
  (use "vim-airline/vim-airline")
  (use "vim-airline/vim-airline-themes"))

(let [install_path (.. vim.fn.stdpath("data") "/site/pack/packer/start/packer.nvim")]
  (if (= "" (vim.fn.glob install_path))
      (vim.fn.system ["git" "clone" "https://github.com/wbthomason/packer.nvim" install_path])
      (vim.api.nvim_command "packadd packer.nvim")))

(vim.cmd "packadd packer.nvim")

(let [packer (require :packer)]
  (packer.startup use-packages))

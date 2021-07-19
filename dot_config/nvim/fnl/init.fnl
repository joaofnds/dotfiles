(require :settings)
(vim.cmd "source ~/.config/nvim/plug.vim")
(require :keybinds)

(require :config.fzf)
(require :config.vim-tmux-runner)
(require :config.gitgutter)
(require :config.easy-align)
(require :config.which-key)
(require :config.indent-line)

(require :config.treesitter)
(require :config.telescope)

(require :config.saga)
(let [lsp-config (require :config.lsp)]
  (lsp-config.init))
(require :config.compe)
(require :config.barbar)

(require :settings)
(vim.cmd "source ~/.config/nvim/plug.vim")
(require :config.saga)
(let [lsp-config (require :config.lsp)]
  (lsp-config.init))
(require :config.telescope)
(require :config.which-key)
(require :config.treesitter)

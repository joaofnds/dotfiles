(global dump (fn [...] (print (vim.inspect ...))))

(require :plugins)
(require :settings)
(require :keybinds)

(require :config.fzf)
(require :config.vim-tmux-runner)
(require :config.nerdtree)
(require :config.easy-align)
(require :config.which-key)
(require :config.indent-line)
(require :config.lualine)
(require :config.treesitter)

(let [lsp-config (require :config.lsp)]
  (lsp-config.init))
(require :config.null-ls)
(require :config.trouble)
(require :config.cmp)
(require :config.barbar)
(require :config.gitsigns)

(let [switch-theme (require :switch-theme)]
  (switch-theme))

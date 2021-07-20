(global dump (fn [...] (print (vim.inspect ...))))

(require :plugins)
(require :settings)
(require :keybinds)

(require :config.fzf)
(require :config.vim-tmux-runner)
(require :config.gitgutter)
(require :config.nerdtree)
(require :config.ultisnips)
(require :config.easy-align)
(require :config.which-key)
(require :config.indent-line)
(require :config.airline)

(require :config.treesitter)
(require :config.telescope)

(require :config.saga)
(let [lsp-config (require :config.lsp)]
  (lsp-config.init))
(require :config.compe)
(require :config.barbar)
(require :config.twilight)

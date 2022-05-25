(global dump (fn [...] (print (vim.inspect ...))))

(require :plugins)
(require :settings)
(require :keybinds)

(require :config.fzf)
(require :config.easy-align)
(require :config.which-key)
(require :config.lualine)
(require :config.treesitter)
(require :config.neogit)

(require :config.null-ls)
(require :config.trouble)
(require :config.cmp)
(require :config.barbar)
(require :config.gitsigns)

(let [switch-theme (require :switch-theme)]
  (switch-theme))

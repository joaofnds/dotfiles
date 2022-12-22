(global dump (fn [...] (print (vim.inspect ...))))

(require :plugins)
(require :settings)
(require :keybinds)

(require :config.barbar)
(require :config.cmp)
(require :config.diffview)
(require :config.easy-align)
(require :config.fzf)
(require :config.gitsigns)
(require :config.lsp)
(require :config.lualine)
(require :config.neogit)
(require :config.noice)
(require :config.null-ls)
(require :config.tokyonight)
(require :config.treesitter)
(require :config.trouble)
(require :config.which-key)

(let [switch-theme (require :switch-theme)]
  (switch-theme))

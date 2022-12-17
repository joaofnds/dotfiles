(local lualine (require :config.lualine))
(local overrides (require :theme-overrides))
(local {: is-macos} (require :utils))

(fn is-macos-dark []
  (let [preference (vim.fn.system "defaults read -g AppleInterfaceStyle")]
    (~= nil (string.find preference "Dark"))))

(fn set-dark []
  (set vim.opt.background "dark")
  (lualine "solarized")
  (overrides.dark))

(fn set-light []
  (set vim.opt.background "light")
  (lualine "solarized_light")
  (overrides.light))

(fn switch-theme []
  (if (or (not (is-macos)) (is-macos-dark))
     (set-dark)
     (set-light)))

(vim.api.nvim_create_autocmd
  ["Signal"]
  {:pattern "*"
   :callback switch-theme})

switch_theme

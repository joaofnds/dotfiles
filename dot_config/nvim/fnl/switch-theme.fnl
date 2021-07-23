(fn is-macos-dark []
  (let [preference (vim.fn.system "defaults read -g AppleInterfaceStyle")]
    (~= nil (string.find preference "Dark"))))

(fn set-dark []
  (set vim.opt.background "dark")
  (let [setup-fn (require :config.lualine)]
    (setup-fn "solarized_dark")))

(fn set-light []
  (set vim.opt.background "light")
  (let [setup-fn (require :config.lualine)]
    (setup-fn "solarized_light")))

(global
 switch_theme
 (fn []
   (if (is-macos-dark)
      (set-dark)
      (set-light))))

(vim.api.nvim_exec "autocmd Signal * call v:lua.switch_theme()" false)

switch_theme

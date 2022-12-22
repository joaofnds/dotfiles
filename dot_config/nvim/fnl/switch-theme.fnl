(local lualine (require :config.lualine))
(local {: is-macos} (require :utils))

(fn is-macos-dark []
  (let [preference (vim.fn.system "defaults read -g AppleInterfaceStyle")]
    (~= nil (string.find preference "Dark"))))

(fn dark []
  (vim.cmd.colorscheme "tokyonight")
  (lualine "tokyonight"))

(fn light []
  (vim.cmd.colorscheme "tokyonight-day")
  (lualine "tokyonight-day"))

(fn switch-theme []
  (if (or (not (is-macos)) (is-macos-dark))
    (dark)
    (light)))

(vim.api.nvim_create_autocmd
  ["Signal"]
  {:pattern "*"
   :callback switch-theme})

switch_theme






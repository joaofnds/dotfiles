(local lualine (require :config.lualine))
(local {: is-macos} (require :utils))

(fn is-macos-dark []
  (let [preference (vim.fn.system "defaults read -g AppleInterfaceStyle")]
    (~= nil (string.find preference "Dark"))))

(fn dark []
  (set vim.opt.background "dark")

  (vim.cmd.colorscheme "solarized")
  (lualine "solarized")

  (vim.cmd.highlight "Visual     gui=NONE guibg=#073642 guifg=NONE")
  (vim.cmd.highlight "VisualNOS  gui=NONE guibg=#073642 guifg=NONE")
  (vim.cmd.highlight "VisualMode gui=NONE guibg=#073642 guifg=NONE")
  (vim.cmd.highlight "Search     gui=NONE guibg=#073642 guifg=NONE gui=undercurl,italic")
  (vim.cmd.highlight "IncSearch  gui=NONE guibg=#073642 guifg=NONE gui=undercurl,italic"))

(fn light []
  (set vim.opt.background "light")

  (vim.cmd.colorscheme "solarized")
  (lualine "solarized_light")

  (vim.cmd.highlight "Visual     gui=NONE guibg=#eee9d4 guifg=NONE")
  (vim.cmd.highlight "VisualNOS  gui=NONE guibg=#eee9d4 guifg=NONE")
  (vim.cmd.highlight "VisualMode gui=NONE guibg=#eee9d4 guifg=NONE")
  (vim.cmd.highlight "Search     gui=NONE guibg=#eee9d4 guifg=NONE gui=undercurl,italic")
  (vim.cmd.highlight "IncSearch  gui=NONE guibg=#eee9d4 guifg=NONE gui=undercurl,italic"))

(fn switch-theme []
  (if (or (not (is-macos)) (is-macos-dark))
    (dark)
    (light)))

(vim.api.nvim_create_autocmd
  ["Signal"]
  {:pattern "*"
   :callback switch-theme})

switch_theme

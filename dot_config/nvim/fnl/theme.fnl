{:lazydef
 {1 "ishan9299/nvim-solarized-lua"
  :event "VeryLazy"
  :init
  (fn []
    (vim.cmd.colorscheme "solarized")

    (vim.api.nvim_set_hl 0 "Visual" {:bg "#073642" :fg "NONE"})
    (vim.api.nvim_set_hl 0 "VisualNOS" {:bg "#073642" :fg "NONE"})
    (vim.api.nvim_set_hl 0 "VisualMode" {:bg "#073642" :fg "NONE"})
    (vim.api.nvim_set_hl 0 "Search" {:bg "#073642" :fg "NONE" :undercurl true :italic true})
    (vim.api.nvim_set_hl 0 "IncSearch" {:bg "#073642" :fg "NONE" :undercurl true :italic true})

    (vim.api.nvim_set_hl 0 "LeapMatch" {:bg "#d33682" :fg "#002b36" :bold true})
    (vim.api.nvim_set_hl 0 "LeapLabelPrimary" {:fg "#d33682" :bold true})
    (vim.api.nvim_set_hl 0 "LeapLabelSecondary" {:fg "#859900" :bold true}))}}

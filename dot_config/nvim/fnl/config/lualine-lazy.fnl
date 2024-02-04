(let [lualine (require :config.lualine)]
  {1 "hoob3rt/lualine.nvim"
    :event "VeryLazy"
    :options (lualine.config "solarized")})

(fn config [theme]
  {:options
    {:theme theme
     :icons_enabled false}

    :sections
    {:lualine_a ["mode"]
     :lualine_b ["branch"]
     :lualine_c ["filename" "diff" "diagnostics"]

     :lualine_x ["encoding" "fileformat" "filetype"]
     :lualine_y ["progress"]
     :lualine_z ["location"]}})

(fn setup [theme]
  (let [lualine (require :lualine)]
    (lualine.setup (config theme))))

{:config config
  :setup setup
  :lazydef
    {1 "hoob3rt/lualine.nvim"
      :event "UIEnter"
      :opts (config "solarized")}}

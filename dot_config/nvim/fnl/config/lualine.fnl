{:lazydef
 {1 "hoob3rt/lualine.nvim"
  :event "UIEnter"
  :opts
  { :options
    {:theme :solarized
     :icons_enabled false}

    :sections
    {:lualine_a [:mode]
     :lualine_b [:branch]
     :lualine_c [:filename :diff :diagnostics]

     :lualine_x [:encoding :fileformat :filetype]
     :lualine_y [:progress]
     :lualine_z [:location]}}}}

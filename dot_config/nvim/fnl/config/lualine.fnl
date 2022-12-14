(fn [theme]
  (let [lualine (require :lualine)]
   (lualine.setup
    {"options"
     {"icons_enabled" false
      "theme" theme
      "component_separators" ["" ""]
      "section_separators" ["" ""]}

     "sections"
     {"lualine_a" ["mode"]
      "lualine_b" ["branch" "diff" "diagnostics"]
      "lualine_c" ["filename"]

      "lualine_x" ["encoding" "fileformat" "filetype"]
      "lualine_y" ["progress"]
      "lualine_z" ["location"]}})))

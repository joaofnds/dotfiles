(let [bl (or (. vim.g "bufferline") {})]
  (tset bl "animation" false)
  (tset bl "icons" false)
  (tset bl "icon_separator_active" "▎")
  (tset bl "icon_separator_inactive" "▎")
  (tset bl "icon_close_tab" "✗ ")
  (tset bl "icon_close_tab_modified" "●")

  (set vim.g.bufferline bl))

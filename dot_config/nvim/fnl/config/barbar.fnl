(let [bl (require :bufferline)]
  (bl.setup
   {:animation false
    :icons "buffer_number"
    :icon_separator_active "▎"
    :icon_separator_inactive "▎"
    :icon_close_tab "✗ "
    :icon_close_tab_modified "● "}))

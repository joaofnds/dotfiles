(let [b (require :barbar)]
  (b.setup
    {:animation false
     :icons
     {:filetype {:enabled false} ;; requires nvim-web-devicons if enabled
      :separator {:left "▎" :right ""}
      :button "✗ "
      :inactive {:button "×"}
      :modified {:button "● "}
      :current {:buffer_index true}
      :visible {:modified {:buffer_number false}}}}))

{:lazydef
  {1 "romgrk/barbar.nvim"
    :event "UIEnter"
    :init (fn [] (set vim.g.barbar_auto_setup false))
    :opts
      {:animation false
       :icons
       {:filetype {:enabled false} ;; requires nvim-web-devicons if enabled
        :separator {:left "▎" :right ""}
        :button "✗ "
        :inactive {:button "×"}
        :modified {:button "● "}
        :current {:buffer_index true}
        :visible {:modified {:buffer_number false}}}}}}           

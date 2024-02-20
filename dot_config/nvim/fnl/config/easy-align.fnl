{:lazydef
  {1 "junegunn/vim-easy-align"
    :keys [{1 "gl" 2 "<Plug>(EasyAlign)" :mode "n"}
           {1 "gL" 2 "<Plug>(LiveEasyAlign)" :mode "n"}
           {1 "gl" 2 "<Plug>(EasyAlign)" :mode "x"}
           {1 "gL" 2 "<Plug>(LiveEasyAlign)" :mode "x"}]
    :config
      (fn []
        (set vim.g.easy_align_delimiters
             {";" {:pattern ";" :right_margin 0}}))}}

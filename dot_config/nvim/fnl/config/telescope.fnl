(let [telescope (require :telescope)
      previewers (require :telescope.previewers)
      sorters (require :telescope.sorters)
      actions (require :telescope.actions)
      {: nnoremap} (require :utils)]

  (nnoremap "<leader>ff" "<cmd>Telescope find_files<cr>")
  (nnoremap "<leader>fg" "<cmd>Telescope live_grep<cr>")
  (nnoremap "<leader>fb" "<cmd>Telescope buffers<cr>")
  (nnoremap "<leader>fh" "<cmd>Telescope help_tags<cr>")

  (telescope.setup
   {"defaults"
    {"mappings" {"i" {"<esc>" actions.close}}
     "vimgrep_arguments" ["rg" "--color=never" "--no-heading" "--with-filename" "--line-number" "--column" "--smart-case"]
     "prompt_prefix" "🔎 "
     "selection_caret" "👉"
     "entry_prefix" "  "
     "initial_mode" "insert"
     "selection_strategy" "reset"
     "sorting_strategy" "descending"
     "layout_strategy" "horizontal"
     "layout_config" {"horizontal" {"mirror" false}
                        "vertical" {"mirror" false}}
     "file_sorter" sorters.get_fuzzy_file
     "file_ignore_patterns" []
     "generic_sorter" sorters.get_generic_fuzzy_sorter
     "winblend" 0
     "border" {}
     "borderchars" [ "─" "│" "─" "│" "╭" "╮" "╯" "╰"]
     "color_devicons" true
     "use_less" false
     "path_display" {}
     "set_env" {}
     "file_previewer" previewers.vim_buffer_cat.new
     "grep_previewer" previewers.vim_buffer_vimgrep.new
     "qflist_previewer" previewers.vim_buffer_qflist.new}}))

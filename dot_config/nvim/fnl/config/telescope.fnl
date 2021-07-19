(let [telescope (require :telescope)
      actions (require :telescope.actions)
      {: nnoremap} (require :utils)]

  (nnoremap "<leader>ff" "<cmd>Telescope find_files<cr>")
  (nnoremap "<leader>fg" "<cmd>Telescope live_grep<cr>")
  (nnoremap "<leader>fb" "<cmd>Telescope buffers<cr>")
  (nnoremap "<leader>fh" "<cmd>Telescope help_tags<cr>")

  (telescope.setup
   {"defaults"
    {"mappings"
     {"i"
      {"<esc>" actions.close}}}}))

(let [trouble (require :trouble)
      {: nnoremap } (require :utils)]
  (trouble.setup
   {"icons" false})
  (nnoremap "<leader>cxx" "<cmd>TroubleToggle<cr>")
  (nnoremap "<leader>cxw" "<cmd>TroubleToggle lsp_workspace_diagnostics<cr>")
  (nnoremap "<leader>cxd" "<cmd>TroubleToggle lsp_document_diagnostics<cr>")
  (nnoremap "<leader>cxq" "<cmd>TroubleToggle quickfix<cr>")
  (nnoremap "<leader>cxl" "<cmd>TroubleToggle loclist<cr>")
  (nnoremap "gR ""<cmd>TroubleToggle lsp_references<cr>"))

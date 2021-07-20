(set vim.g.NERDTreeIgnore [".git"])

(let [{: nnoremap} (require :utils)]
  (nnoremap "<leader>op" ":NERDTreeToggle<cr>")
  (nnoremap "<leader>pp" ":NERDTreeFocus<cr>")
  (nnoremap "<leader>o." ":NERDTreeFind<cr>"))

(let [twilight (require :twilight)]
  (twilight.setup {"context" 0}))

(let [{: nnoremap} (require :utils)]
  (nnoremap "<leader>tt" ":Twilight<cr>"))

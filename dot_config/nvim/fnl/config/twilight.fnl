(let [twilight (require :twilight)]
  (twilight.setup))

(let [{: nnoremap} (require :utils)]
  (nnoremap "<leader>tt" ":Twilight<cr>"))

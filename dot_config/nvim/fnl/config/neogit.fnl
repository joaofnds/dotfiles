(let [neogit (require :neogit)]
  (neogit.setup {}))

(let [{: nnoremap} (require :utils)]
  (nnoremap "<leader>gg" "<cmd>lua require('neogit').open()<CR>"))

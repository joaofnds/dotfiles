(let [bl (or (. vim.g "bufferline") {})]
  (tset bl "animation" false)
  (tset bl "icons" false)
  (tset bl "icon_separator_active" "▎")
  (tset bl "icon_separator_inactive" "▎")
  (tset bl "icon_close_tab" "✗ ")
  (tset bl "icon_close_tab_modified" "● ")

  (set vim.g.bufferline bl))


(let [{: nnoremap } (require :utils)]
  (nnoremap "<leader>bp" ":BufferPrevious<cr>")
  (nnoremap "<leader>bn" ":BufferNext<cr>")
  (nnoremap "<leader>bs" ":BufferPick<cr>")

  (nnoremap "<leader>b>" ":BufferMovePrevious<cr>")
  (nnoremap "<leader>b<" ":BufferMoveNext<cr>")

  (nnoremap "<leader>b1" ":BufferGoto 1<CR>")
  (nnoremap "<leader>b2" ":BufferGoto 2<CR>")
  (nnoremap "<leader>b3" ":BufferGoto 3<CR>")
  (nnoremap "<leader>b4" ":BufferGoto 4<CR>")
  (nnoremap "<leader>b5" ":BufferGoto 5<CR>")
  (nnoremap "<leader>b6" ":BufferGoto 6<CR>")
  (nnoremap "<leader>b7" ":BufferGoto 7<CR>")
  (nnoremap "<leader>b8" ":BufferGoto 8<CR>")
  (nnoremap "<leader>b9" ":BufferLast<CR>")

  (nnoremap "<leader>bdd" ":BufferClose<cr>")
  (nnoremap "<leader>bda" ":BufferWipeout<cr>")
  (nnoremap "<leader>bdo" ":BufferCloseAllButCurrent<cr>")
  (nnoremap "<leader>bdl" ":BufferCloseBuffersLeft<cr>")
  (nnoremap "<leader>bdr" ":BufferCloseBuffersRight<cr>"))

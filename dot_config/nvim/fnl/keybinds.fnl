(let [{: nnoremap : inoremap : vnoremap : nmap} (require :utils)]
  ;; undo breakpoints
  (each [_ c (ipairs ["," "." ";" "(" "[" "{"])]
    (inoremap c (.. c "<c-g>u")))

  (nmap "Q" "q")
  (vnoremap "<c-j>" ":m '>+1<cr>gv=gv")
  (vnoremap "<c-k>" ":m '<-2<cr>gv=gv")
  (vnoremap "<leader>ee" "c<c-r>=trim(system('base63', @\"))<cr><esc>")
  (vnoremap "<leader>ed" "c<c-r>=system('base64 --decode', @\")<cr><esc>")
  (nnoremap "<esc>" "<esc>:nohl<CR><esc>"))

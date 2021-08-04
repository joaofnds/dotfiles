(let [{: nnoremap : inoremap : vnoremap} (require :utils)]
  ;;; Git

  ;; git status: open git
  (nnoremap "<leader>gg" ":Git<cr>")

  ;; git add: git add current buffer
  (nnoremap "<silent>" "<leader>ga :silent !git add %<cr>")

  ;;; Windows

  ;; zoom in
  (nnoremap "<leader>w-" ":wincmd _<cr>:wincmd |<cr>")

  ;; re-balance windows
  (nnoremap "<leader>w=" ":wincmd =<cr>")

  ;; max out the height of the current split
  (nnoremap "<leader>w_" ":wincmd _<cr>")
  (nnoremap "<leader>wms" ":wincmd _<cr>")

  ;; max out the width of the current split
  (nnoremap "<leader>w|" ":wincmd |<cr>")
  (nnoremap "<leader>wmv" ":wincmd |<cr>")

  ;; window new: new empty window
  (nnoremap "<leader>wN" ":new<cr>")

  ;; window vertical new: new vertical empty window
  (nnoremap "<leader>wV" ":bnew<cr>")

  ;; window split: open a horizontal split
  (nnoremap "<leader>ws" ":sp<cr>")

  ;; window vertical split: open a vertical split
  (nnoremap "<leader>wv" ":vsp<cr>")

  ;; window quit: close current window
  (nnoremap "<leader>wq" ":q<cr>")

  ;; window breakout: break out split into window
  (nnoremap "<leader>wB" ":wincmd T<cr>")

  ;; window kill others: kill other windows
  (nnoremap "<leader>wo" ":wincmd o<cr>")

  ;; window rotate: swaps windows
  (nnoremap "<leader>wr" ":wincmd r<cr>")

  ;; window left: moves the cursor buffer on the left
  (nnoremap "<leader>wh" ":wincmd h<cr>")

  ;; window down: moves the cursor buffer on the bottom
  (nnoremap "<leader>wj" ":wincmd j<cr>")

  ;; window up: moves the cursor buffer on the top
  (nnoremap "<leader>wk" ":wincmd k<cr>")

  ;; window right: moves the cursor buffer on the right
  (nnoremap "<leader>wl" ":wincmd l<cr>")

  ;; window move left: moves buffer to the left
  (nnoremap "<leader>wH" ":wincmd H<cr>")

  ;; window move down: moves the buffer to the bottom
  (nnoremap "<leader>wJ" ":wincmd J<cr>")

  ;; window move up: moves the buffer to the top
  (nnoremap "<leader>wK" ":wincmd K<cr>")

  ;; window move right: moves cursor buffer to the right
  (nnoremap "<leader>wL" ":wincmd L<cr>")

  ;;; Files

  ;; file todo: opens TODO.md in a vertical split
  (nnoremap "<leader>ft" ":vsplit ~/TODO.md<cr>")

  ;; find files: searches whole project for a file
  (nnoremap "<leader><leader>" ":FZF<cr>")

  ;; find here: searches for a file in the current directory
  (nnoremap "<leader>." ":FZF %:p:h<cr>")

  ;; search using ag
  (nnoremap "<leader>sp" ":Ag<cr>")

  ;; search buffers using fzf
  (nnoremap "<leader>bb" ":Buffers<cr>")

  ;; file save: writes the buffer (same as <leader>bs)
  (nnoremap "<leader>fs" ":w<cr>")

  ;; Open

  ;; open dired: open the current folder
  (nnoremap "<leader>o-" ":e .<cr>")

  ;; undo breakpoints
  (each [_ c (ipairs ["," "." ";" "(" "[" "{"])]
    (inoremap c (.. c "<c-g>u")))

  (vnoremap "<c-j>" ":m '>+1<cr>gv=gv")
  (vnoremap "<c-k>" ":m '<-2<cr>gv=gv")

  (inoremap "<C-j>" "<esc>:m .+1<cr>==i")
  (inoremap "<C-k>" "<esc>:m .-2<cr>==i")

  (nnoremap "<leader>k" ":m .-2<cr>==")
  (nnoremap "<leader>j" ":m .+1<cr>==")
  (nnoremap "<leader>cf" ":Neoformat<cr>")

  (nnoremap "<esc>" "<esc>:nohl<CR><esc>"))

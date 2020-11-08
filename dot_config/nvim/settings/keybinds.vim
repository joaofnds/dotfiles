""""""""""
" Buffers

" buffer next: Go to next buffer
nnoremap <leader>bn :bn<cr>
nnoremap <leader>b] :bn<cr>

" buffer previous: Go to previous buffer
nnoremap <leader>bp :bp<cr>
nnoremap <leader>b[ :bp<cr>

" buffer delete: Delete current buffer
nnoremap <leader>bd :bd<cr>
nnoremap <leader>bk :bd<cr>

" buffer last: Go to last oppened buffer
nnoremap <leader>bl :bl<cr>

" buffer save: Writes buffer
nnoremap <leader>bs :w<cr>

""""""""""
" Git

" git status: open git
nnoremap <leader>gs :Gst<cr>

" git add: git add current buffer
nnoremap <silent> <leader>ga :silent !git add %<cr>

""""""""""
" Windows

" Zoom in
nnoremap <leader>w- :wincmd _<cr>:wincmd \|<cr>

" Re-balance windows
nnoremap <leader>w= :wincmd =<cr>

"Max out the height of the current split
nnoremap <leader>w_ :wincmd _<cr>
nnoremap <leader>wms :wincmd _<cr>

"Max out the width of the current split
nnoremap <leader>w\| :wincmd \|<cr>
nnoremap <leader>wmv :wincmd \|<cr>

" window new: New empty window
nnoremap <leader>wN :new<cr>

" window vertical new: New vertical empty window
nnoremap <leader>wV :bnew<cr>

" window split: Open a horizontal split
nnoremap <leader>ws :sp<cr>

" window vertical split: Open a vertical split
nnoremap <leader>wv :vsp<cr>

" window quit: Close current window
nnoremap <leader>wq :q<cr>

" window breakout: break out split into window
nnoremap <leader>wB :wincmd T<cr>

" window kill others: kill other windows
nnoremap <leader>wo :wincmd o<cr>

" window rotate: swaps windows
nnoremap <leader>wr :wincmd r<cr>

" window left: moves the cursor buffer on the left
nnoremap <leader>wh :wincmd h<cr>

" window down: moves the cursor buffer on the bottom
nnoremap <leader>wj :wincmd j<cr>

" window up: moves the cursor buffer on the top
nnoremap <leader>wk :wincmd k<cr>

" window right: moves the cursor buffer on the right
nnoremap <leader>wl :wincmd l<cr> 

" window move left: moves buffer to the left
nnoremap <leader>wH :wincmd H<cr>

" window move down: moves the buffer to the bottom
nnoremap <leader>wJ :wincmd J<cr>

" window move up: moves the buffer to the top
nnoremap <leader>wK :wincmd K<cr>

" window move right: moves cursor buffer to the right
nnoremap <leader>wL :wincmd L<cr> 

""""""""""
" Files

" file todo: opens TODO.md in a vertical split
nnoremap <leader>ft :vsplit ~/TODO.md<cr>

" find files: searches whole project for a file
nnoremap <leader><leader> :FZF<cr>

" find here: searches for a file in the current directory
nnoremap <leader>. :FZF %:p:h<cr>

" file save: writes the buffer (same as <leader>bs)
nnoremap <leader>fs :w<cr>

""""""""""
" Open

" open dired: open the current folder
nnoremap <leader>o- :e .<cr>

""""""""""
" Code

" Commenting this out because I'm trying to use CoC for this functionality
" nnoremap <leader>cn :tn<cr> " next definition
" nnoremap <leader>cp :tp<cr> " previous definition
" nnoremap <leader>cs :ts<cr> " list definitions
" nnoremap <leader>cD <C-]>   " jump to definition
" nnoremap <leader>cb <C-t>   " jump back from definition
" nnoremap <leader>cP <C-W>}  " preview definition
" nnoremap <leader>cL <C-W>}  " see all definitions

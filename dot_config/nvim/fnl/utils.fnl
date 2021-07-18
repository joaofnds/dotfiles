(fn nnoremap [bind command]
  (vim.api.nvim_buf_set_keymap [0 "n" bind command {"noremap" true "silent" true}]))

(fn inoremap [bind command]
  (vim.api.nvim_buf_set_keymap [0 "i" bind command {"noremap" true "silent" true}]))

{"nnoremap" nnoremap
 "inoremap" inoremap}

(fn nnoremap [bind command]
  (vim.api.nvim_set_keymap "n" bind command {"noremap" true "silent" true}))

(fn inoremap [bind command]
  (vim.api.nvim_set_keymap "i" bind command {"noremap" true "silent" true}))

{"nnoremap" nnoremap
 "inoremap" inoremap}

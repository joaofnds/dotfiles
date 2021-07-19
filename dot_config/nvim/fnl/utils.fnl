(fn nnoremap [bind command]
  (vim.api.nvim_set_keymap "n" bind command {"noremap" true "silent" true}))

(fn inoremap [bind command]
  (vim.api.nvim_set_keymap "i" bind command {"noremap" true "silent" true}))

(fn vnoremap [bind command]
  (vim.api.nvim_set_keymap "v" bind command {"noremap" true "silent" true}))

(fn xnoremap [bind command]
  (vim.api.nvim_set_keymap "x" bind command {"noremap" true "silent" true}))

(fn nmap [bind command]
  (vim.api.nvim_set_keymap "n" bind command {"silent" true}))

(fn xmap [bind command]
  (vim.api.nvim_set_keymap "x" bind command {"silent" true}))

{"nnoremap" nnoremap
 "inoremap" inoremap
 "vnoremap" vnoremap
 "xnoremap" xnoremap
 "nmap"     nmap
 "xmap"     xmap}

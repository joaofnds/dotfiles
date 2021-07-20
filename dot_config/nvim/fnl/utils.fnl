(fn imap [bind command]
  (vim.api.nvim_set_keymap "i" bind command {"silent" true}))

(fn nmap [bind command]
  (vim.api.nvim_set_keymap "n" bind command {"silent" true}))

(fn omap [bind command]
  (vim.api.nvim_set_keymap "o" bind command {"silent" true}))

(fn xmap [bind command]
  (vim.api.nvim_set_keymap "x" bind command {"silent" true}))

(fn noremap [bind command]
  (vim.api.nvim_set_keymap "" bind command {"noremap" true "silent" true}))

(fn inoremap [bind command]
  (vim.api.nvim_set_keymap "i" bind command {"noremap" true "silent" true}))

(fn nnoremap [bind command]
  (vim.api.nvim_set_keymap "n" bind command {"noremap" true "silent" true}))

(fn vnoremap [bind command]
  (vim.api.nvim_set_keymap "v" bind command {"noremap" true "silent" true}))

(fn xnoremap [bind command]
  (vim.api.nvim_set_keymap "x" bind command {"noremap" true "silent" true}))

{"imap"     imap
 "nmap"     nmap
 "omap"     omap
 "xmap"     xmap

 "noremap"  noremap

 "inoremap" inoremap
 "nnoremap" nnoremap
 "vnoremap" vnoremap
 "xnoremap" xnoremap}

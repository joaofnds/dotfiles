(let [u (require :utils)]
  (u.noremap "<C-p>" ":FZF<CR>")
  (u.noremap "<C-b>" ":Buffers<CR>")
  (u.noremap "<leader>zgf" ":GFiles?<CR>")
  (u.noremap "<leader>zl" ":Lines<CR>")
  (u.noremap "<leader>zbl" ":BLines<CR>")
  (u.noremap "<leader>zr" ":Tags<CR>")
  (u.noremap "<leader>zbt" ":BTags<CR>")

  ;; Mapping selecting mappings)
  (u.nmap "<leader><tab>" "<plug>(fzf-maps-n)")
  (u.xmap "<leader><tab>" "<plug>(fzf-maps-x)")
  (u.omap "<leader><tab>" "<plug>(fzf-maps-o)")

  ;; Insert mode completion
  (u.imap "<c-x><c-k>" "<plug>(fzf-complete-word)")
  (u.imap "<c-x><c-f>" "<plug>(fzf-complete-path)")
  (u.imap "<c-x><c-j>" "<plug>(fzf-complete-file-ag)"))

  ;; Global line completion (not just open buffers. ripgrep required.)
  ;; (vim.api.nvim_set_keymap
  ;;  "i"
  ;;  "<c-x><c-l>"
  ;;  "fzf#vim#complete(fzf#wrap({
  ;;  \ 'prefix': '^.*$',
  ;;  \ 'source': 'rg -n ^ --color always',
  ;;  \ 'options': '--ansi --delimiter : --nth 3..',
  ;;  \ 'reducer': { lines -> join(split(lines[0], ':\zs')[2:], '') }}))"
  ;;  {"expr" true "noremap" true "silent" true})

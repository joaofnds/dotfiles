(let [u (require :utils)]
  (u.nmap "<leader><tab>" "<plug>(fzf-maps-n)")
  (u.xmap "<leader><tab>" "<plug>(fzf-maps-x)")
  (u.omap "<leader><tab>" "<plug>(fzf-maps-o)")

  (u.imap "<c-k>w" "<plug>(fzf-complete-word)")
  (u.imap "<c-k>p" "<plug>(fzf-complete-path)")
  (u.imap "<c-k>f" "<plug>(fzf-complete-file)"))

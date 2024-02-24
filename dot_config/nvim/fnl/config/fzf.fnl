{:lazydef
 {1 "junegunn/fzf.vim"
  :cmd [:FZF :Buffers :Files :GFiles :Ag :Rg :Lines :BLines :Tags :BTags :Marks :Windows :Locate :History]
  :dependencies [{1 "junegunn/fzf" :build ":call fzf#install()"}]
  :config
  (let [u (require :utils)]
    (u.nmap "<leader><tab>" "<plug>(fzf-maps-n)")
    (u.xmap "<leader><tab>" "<plug>(fzf-maps-x)")
    (u.omap "<leader><tab>" "<plug>(fzf-maps-o)")

    (u.imap "<c-k>w" "<plug>(fzf-complete-word)")
    (u.imap "<c-k>p" "<plug>(fzf-complete-path)")
    (u.imap "<c-k>f" "<plug>(fzf-complete-file)"))}

 :run #((. vim.fn "fzf#run") ((. vim.fn "fzf#wrap") $1))}

{:lazydef
 {1 "junegunn/fzf.vim"
  :cmd [:FZF :Buffers :Files :GFiles :Ag :Rg :Lines :BLines :Tags :BTags :Marks :Windows :Locate :History]
  :keys [:<leader>pr]
  :dependencies [{1 "junegunn/fzf" :build ":call fzf#install()"}]
  :config
  (fn []
    (vim.keymap.set :n "<leader><tab>" "<plug>(fzf-maps-n)")
    (vim.keymap.set :x "<leader><tab>" "<plug>(fzf-maps-x)")
    (vim.keymap.set :o "<leader><tab>" "<plug>(fzf-maps-o)")

    (vim.keymap.set :i "<c-k>w" "<plug>(fzf-complete-word)")
    (vim.keymap.set :i "<c-k>p" "<plug>(fzf-complete-path)")
    (vim.keymap.set :i "<c-k>f" "<plug>(fzf-complete-file)"))}

 :run #(let [{: vimfn } (require :jf)]
         (->> $1 (vimfn "fzf#wrap") (vimfn "fzf#run")))}

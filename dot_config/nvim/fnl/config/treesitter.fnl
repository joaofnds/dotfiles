(let [ts (require :nvim-treesitter.configs)]
  (ts.setup {"highlight" {"enable" true}})
  (set vim.o.foldexpr "nvim_treesitter#foldexpr()"))

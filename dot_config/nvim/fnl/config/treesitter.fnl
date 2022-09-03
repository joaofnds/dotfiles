(let [ts (require :nvim-treesitter.configs)
      ts-context (require :treesitter-context)]
  (ts.setup
   {"highlight" {"enable" true}
    "indent" {"enable" true}
    "incremental_selection"
     {"enable" true
      "keymaps" {"init_selection" "gnn"
                 "node_incremental" "grn"
                 "scope_incremental" "grc"
                 "node_decremental" "grm"}}})
   (ts-context.setup))

(set vim.opt.foldmethod "expr")
(set vim.opt.foldexpr "nvim_treesitter#foldexpr()")

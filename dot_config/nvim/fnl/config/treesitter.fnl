{:lazydef
 {1 "nvim-treesitter/nvim-treesitter"
  :dependencies ["nvim-treesitter/nvim-treesitter-context"]
  :event [:BufNewFile :BufReadPost]
  :init
  (fn []
    (set vim.opt.foldmethod "expr")
    (set vim.opt.foldexpr "nvim_treesitter#foldexpr()")
    (set vim.opt.foldenable false))
  :config
  (fn []
    (let [ts (require :nvim-treesitter.configs)]
      (ts.setup
       {:ensure_installed "all"
        :highlight {:enable true}
        :indent {:enable true}
        :incremental_selection
        {:enable true
         :keymaps {:init_selection "g>"
                   :node_incremental "g>"
                   :node_decremental "g<"
                   :scope_incremental false}}})))}}

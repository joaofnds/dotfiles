(set vim.o.completeopt "menuone,noselect")

(let [cmp (require :cmp)]
  (cmp.setup
   {:snippet
    {:expand (fn [] nil)}
    :mapping
    {"<C-b>" (cmp.mapping (cmp.mapping.scroll_docs -4) ["i" "c"])
     "<C-f>" (cmp.mapping (cmp.mapping.scroll_docs 4) ["i" "c"])
     "<C-Space>" (cmp.mapping (cmp.mapping.complete) ["i" "c"])
     "<C-y>" cmp.config.disable
     "<C-e>" (cmp.mapping {:i (cmp.mapping.abort)
                           :c (cmp.mapping.close)})
     "<CR>" (cmp.mapping.confirm {:select true})}
    :sources (cmp.config.sources
                [{:name "nvim_lsp"}
                 {:name "buffer"}])}))

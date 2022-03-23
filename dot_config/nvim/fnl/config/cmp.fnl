(set vim.o.completeopt "menuone,noselect")

(let [cmp (require :cmp)]
  (cmp.setup
   {:snippet
    {:expand (fn [] nil)}
    :mapping
    {"<c-b>" (cmp.mapping (cmp.mapping.scroll_docs -4) ["i" "c"])
     "<c-f>" (cmp.mapping (cmp.mapping.scroll_docs 4) ["i" "c"])
     "<c-space>" (cmp.mapping (cmp.mapping.complete) ["i" "c"])
     "<c-y>" cmp.config.disable
     "<c-e>" (cmp.mapping {:i (cmp.mapping.abort)
                           :c (cmp.mapping.close)})
     "<cr>" (cmp.mapping.confirm {:select true})
     "<tab>" (cmp.mapping.confirm {:select true})}
    :sources (cmp.config.sources
                [{:name "nvim_lsp"}
                 {:name "buffer"}])}))

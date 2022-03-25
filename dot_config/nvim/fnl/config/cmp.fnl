(set vim.o.completeopt "menu,menuone,noselect")

(let [cmp (require :cmp)
      luasnip (require :luasnip)]
  (cmp.setup
   {:snippet
    {:expand (fn [args] (luasnip.lsp_expand args.body))}
    :sources (cmp.config.sources [{:name "nvim_lsp"} {:name "buffer"}])
    :mapping
    {"<tab>" (cmp.mapping.confirm {:select true})
     "<c-b>" (cmp.mapping (cmp.mapping.scroll_docs -4) ["i" "c"])
     "<c-f>" (cmp.mapping (cmp.mapping.scroll_docs 4) ["i" "c"])
     "<c-space>" (cmp.mapping (cmp.mapping.complete) ["i" "c"])
     "<c-y>" cmp.config.disable
     "<c-e>" (cmp.mapping {:i (cmp.mapping.abort)
                           :c (cmp.mapping.close)})}}))

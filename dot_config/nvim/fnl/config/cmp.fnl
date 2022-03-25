(set vim.o.completeopt "menu,menuone,noselect")

(fn insert [ctx str]
 (vim.api.nvim_buf_set_text
  ctx.bufnr
  (- ctx.cursor.row 1)
  (- ctx.cursor.col 1)
  (- ctx.cursor.row 1)
  (- ctx.cursor.col 1)
  [str])
 (vim.api.nvim_win_set_cursor 0 [ctx.cursor.row (+ ctx.cursor.col (length str) -1)]))

(let [cmp (require :cmp)
      context (require :cmp.context)]
  (cmp.setup
   {:snippet {:expand (fn [args] (insert (context.new) args.body))}
    :sources (cmp.config.sources [{:name "nvim_lsp"} {:name "buffer"}])
    :mapping
    {"<tab>" (cmp.mapping.confirm {:select true})
     "<c-b>" (cmp.mapping (cmp.mapping.scroll_docs -4) ["i" "c"])
     "<c-f>" (cmp.mapping (cmp.mapping.scroll_docs 4) ["i" "c"])
     "<c-space>" (cmp.mapping (cmp.mapping.complete) ["i" "c"])
     "<c-y>" cmp.config.disable
     "<c-e>" (cmp.mapping {:i (cmp.mapping.abort)
                           :c (cmp.mapping.close)})}}))

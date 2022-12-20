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
     :sources (cmp.config.sources
                [{:name "nvim_lsp"}
                 {:name "path"}
                 {:name "buffer"}
                 {:name "treesitter"}
                 {:name "nvim_lua"}])
     :mapping
     (cmp.mapping.preset.insert
       {"<c-space>" (cmp.mapping.complete)
        "<cr>" (cmp.mapping.confirm {:select true})
        "<c-k>" (cmp.mapping.select_prev_item)
        "<c-j>" (cmp.mapping.select_next_item)
        "<c-d>" (cmp.mapping.scroll_docs -4)
        "<c-u>" (cmp.mapping.scroll_docs 4)
        "<c-e>" (cmp.mapping.abort)})}))

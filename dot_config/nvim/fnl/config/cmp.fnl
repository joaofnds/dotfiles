{1 "hrsh7th/nvim-cmp"
  :event "InsertEnter"
  :dependencies ["hrsh7th/cmp-nvim-lsp" "hrsh7th/cmp-buffer" "hrsh7th/cmp-path" "hrsh7th/cmp-nvim-lua"]
  :init (fn [] (set vim.opt.completeopt "menu,menuone,noselect"))
  :config
    (fn []
      (let [cmp (require :cmp)
            context (require :cmp.context)]

        (fn insert [ctx str]
          (vim.api.nvim_buf_set_text
            ctx.bufnr
            (- ctx.cursor.row 1)
            (- ctx.cursor.col 1)
            (- ctx.cursor.row 1)
            (- ctx.cursor.col 1)
            [str])
          (vim.api.nvim_win_set_cursor 0 [ctx.cursor.row (+ ctx.cursor.col (length str) -1)]))

        (fn parse [str]
          (vim.trim (vim.lsp.util.parse_snippet str)))

        (fn expand [args]
          (insert (context.new) (parse args.body)))

        (cmp.setup
          {:snippet {:expand expand}
           :sources (cmp.config.sources
                     [{:name "nvim_lsp"}
                      {:name "path"} ;; maybe remove this bc fzf has better path completion?
                      {:name "buffer"}
                      {:name "treesitter"}
                      {:name "nvim_lua"}])
           :window {:completion (cmp.config.window.bordered)
                    :documentation (cmp.config.window.bordered)}
           :mapping (cmp.mapping.preset.insert
                     {"<c-space>" (cmp.mapping.complete)
                      "<cr>" (cmp.mapping.confirm {:select true})
                      "<c-k>" (cmp.mapping.select_prev_item)
                      "<c-j>" (cmp.mapping.select_next_item)
                      "<c-d>" (cmp.mapping.scroll_docs -4)
                      "<c-u>" (cmp.mapping.scroll_docs 4)
                      "<c-e>" (cmp.mapping.abort)})})))}

 

(let [wk (require :which-key)
      {: organize-imports} (require :config.lsp)]
  (wk.register
    {:g {:d [vim.lsp.buf.definition "definition"]
         :i [vim.lsp.buf.implementation "implementation"]
         :r [vim.lsp.buf.references "references"]}
     :K [vim.lsp.buf.hover]
     "[" {:name "next"
          :e [":lua vim.lsp.diagnostic.goto_next()<cr>" "error"]}
     "]" {:name "previous"
          :e [":lua vim.lsp.diagnostic.goto_prev()<cr>" "error"]}
     :<leader>
     {:<leader> [":FZF<cr>" "find files: searches whole project for a file"]
      :. [":FZF %:p:h<cr>" "search for a file in the current directory"]
      :w {:name "window"
          :- [ ":wincmd _<cr>:wincmd |<cr>" "zoom in"]
          := [":wincmd =<cr>" "re-balance windows"]
          :_ [":wincmd _<cr>" "max out the height"]
          :| [":wincmd |<cr>" "max out the width"]
          :N [":new<cr>" "new empty window"]
          :V [":bnew<cr>" "new vertical empty window"]
          :s [":sp<cr>" "open a horizontal split"]
          :v [":vsp<cr>" "open a vertical split"]
          :q [":q<cr>" "close current window"]
          :B [":wincmd T<cr>" "break out split into window"]
          :o [":wincmd o<cr>" "kill other windows"]
          :r [":wincmd r<cr>" "swaps windows"]
          :h [":wincmd h<cr>" "moves the cursor buffer on the left"]
          :j [":wincmd j<cr>" "moves the cursor buffer on the bottom"]
          :k [":wincmd k<cr>" "moves the cursor buffer on the top"]
          :l [":wincmd l<cr>" "moves the cursor buffer on the right"]
          :H [":wincmd H<cr>" "moves buffer to the left"]
          :J [":wincmd J<cr>" "moves the buffer to the bottom"]
          :K [":wincmd K<cr>" "moves the buffer to the top"]
          :L [":wincmd L<cr>" "moves cursor buffer to the right"]}
      :f {:name "file"
          :t [":vsplit ~/TODO.md<cr>" "file todo: opens TODO.md in a vertical split"]
          :s [":w<cr>" "writes the buffer"]}
      :g {:name "git"
          :P [":Gitsigns preview_hunk<cr>" "preview hunk"]
          :S [":Gitsigns stage_buffer<cr>" "stage buffer"]
          :X [":Gitsigns reset_buffer<cr>" "discard buffer"]
          :b [":Gitsigns toggle_current_line_blame<cr>" "blame"]
          :d [":Gitsigns diffthis<cr>" "diff"]
          :g [":Neogit<cr>" "neogit"]
          :l [":Gitsigns toggle_linehl<cr>" "line diff"]
          :n [":Gitsigns next_hunk<CR>" "next hunk"]
          :p [":Gitsigns prev_hunk<CR>" "previous hunk"]
          :s [":Gitsigns stage_hunk<cr>" "stage hunk"]
          :v [":Gitsigns select_hunk<cr>" "select hunk"]
          :x [":Gitsigns reset_hunk<cr>" "discard hunk"]}
      :s {:name "search"
          :p [":Ag<cr>" "search project"]}
      :b {:name "buffers"
          :b [":Buffers<cr>" "search buffers"]}
      :o {:name "open"
          :- [":e .<cr>" "Open current folder"]
          :P [":MarkdownPreviewToggle<cr>" "Toggle markdown preview"]
          :p [":NERDTreeToggle<cr>" "NERDTree"]
          :f [":NERDTreeFocus<cr>" "Focus NERDTree"]
          :. [":NERDTreeFind<cr>" "NERDTree here"]}
      :c {:name "code"
          :a [vim.lsp.buf.code_action "action"]
          :r [vim.lsp.buf.rename "rename"]
          :s [vim.lsp.buf.signature_help "signature"]
          :f [vim.lsp.buf.formatting "format"]
          :o [organize-imports "organize imports"]
          :l {:name "lsp"
              :s [":LspStart<cr>" "start"]
              :S [":LspStop<cr>" "stop"]}}
      :x {:name "tmux"
          :- [":VtrOpenRunner { \"orientation\": \"v\", \"percentage\": 50 }<cr>" "open vertical runner"]
          := [":VtrOpenRunner { \"orientation\": \"h\", \"percentage\": 50  }<cr>" "open horizontal runner"]
          :C [":VtrSendCtrlC<cr>" "send ctrl-c"]
          :D [":VtrSendCtrlD<cr>" "send ctrl-d"]
          :F [":VtrFlushCommand<cr>" "flush command"]
          :R [":VtrResizeRunner<cr>" "resize"]
          :a [":VtrAttachToPane<cr>" "attach"]
          :c [":VtrClearRunner<cr>" "clear runner"]
          :d [":VtrDetachRunner<cr>" "detach runner"]
          :f [":VtrFocusRunner<cr>" "focus runner"]
          :k [":VtrKillRunner<cr>" "kill runner"]
          :l [":VtrSendLinesToRunner<cr>" "send lines"]
          :o [":VtrReorientRunner<cr>" "reorient"]
          :r [":VtrSendCommandToRunner<cr>" "send command"]}}})
  (wk.register
    {"<leader>xl" [":VtrSendLinesToRunner<cr>" "send lines"]}
    {:mode "v"}))

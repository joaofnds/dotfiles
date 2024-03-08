{:lazydef
 {1 "folke/which-key.nvim"
  :keys ["<leader>" "<c-r>" "<c-w>" "\"" "'" "`" "c" "v" "g" "z"]
  :init
  (fn []
    (set vim.opt.timeout true)
    (set vim.opt.timeoutlen 500)

    ;; undo breakpoints
    (each [_ c (ipairs ["," "." ";" "(" "[" "{"])]
      (vim.keymap.set :i c (.. c "<c-g>u"))))

  :config
  (fn []
    (let [wk (require :which-key)]
      (wk.register
       {:g {:D [vim.lsp.buf.declaration "declaration"]
            :d [vim.lsp.buf.definition "definition"]
            :i [vim.lsp.buf.implementation "implementation"]
            :r [vim.lsp.buf.references "references"]
            :s [vim.lsp.buf.signature_help "signature help"]}
        :Q ["<nop>" "nop"]
        :K [vim.lsp.buf.hover "hover"]
        :z {:j [":lua require('leap').leap({})<cr>" "leap forward"]
            :k [":lua require('leap').leap({backward = true})<cr>" "leap backward"]}
        "]" {:name "next"
             :e [vim.diagnostic.goto_next "error"]}
        "[" {:name "previous"
             :e [vim.diagnostic.goto_prev "error"]}

        :<esc> ["<esc>:nohl<CR><esc>" "esc"]
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
             :t [":vsplit ~/TODO.md<cr>" "opens TODO.md"]
             :s [":w<cr>" "writes the buffer"]
             :r [":History<cr>" "recent"]}
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
             :t [":Tardis<CR>" "time machine"]
             :v [":Gitsigns select_hunk<cr>" "select hunk"]
             :x [":Gitsigns reset_hunk<cr>" "discard hunk"]
             :f {:name "find"
                 :f [":GFiles<cr>" "git files"]
                 :s [":GFiles?<cr>" "status files"]
                 :c [":Commits<cr>" "commits"]
                 :C [":BCommits<cr>" "buffer commits"]}}
         :h {:name "help"
             :u [#(: (require :jf) :update) "update"]}
         :s {:name "search"
             :b [":Buffers<cr>" "buffers"]
             :f [":Files<cr>" "files"]
             :m [":Marks<cr>" "marks"]
             :p [":Rg<cr>" "search project"]}
         :b {:name "buffers"
             :b [":Buffers<cr>" "search buffers"]
             :p [":BufferPrevious<cr>" "previous"]
             :n [":BufferNext<cr>" "next"]
             :s [":BufferPick<cr>" "search"]
             :< [":BufferMovePrevious<cr>" "move previous"]
             :> [":BufferMoveNext<cr>" "move next"]
             :1 [":BufferGoto 1<CR>" "goto 1"]
             :2 [":BufferGoto 2<CR>" "goto 2"]
             :3 [":BufferGoto 3<CR>" "goto 3"]
             :4 [":BufferGoto 4<CR>" "goto 4"]
             :5 [":BufferGoto 5<CR>" "goto 5"]
             :6 [":BufferGoto 6<CR>" "goto 6"]
             :7 [":BufferGoto 7<CR>" "goto 7"]
             :8 [":BufferGoto 8<CR>" "goto 8"]
             :9 [":BufferLast<CR>" "goto last"]
             :k [":BufferClose<cr>" "kill"]
             :d {:name "delete"
                 :d [":BufferClose<cr>" "current"]
                 :a [":BufferWipeout<cr>" "all"]
                 :o [":BufferCloseAllButCurrent<cr>" "others"]
                 :l [":BufferCloseBuffersLeft<cr>" "left"]
                 :r [":BufferCloseBuffersRight<cr>" "right"]}}
         :o {:name "open"
             :- [":NERDTreeExplore<cr>" "Open current folder"]
             :P [":MarkdownPreviewToggle<cr>" "Toggle markdown preview"]
             :p [":NERDTreeToggle<cr>" "NERDTree"]
             :f [":NERDTreeFocus<cr>" "Focus NERDTree"]
             :. [":NERDTreeFind<cr>" "NERDTree here"]}
         :p {:name "project"
             :r [":Recent<cr>" "recent files"]}
         :c {:name "code"
             :a [vim.lsp.buf.code_action "action"]
             :r [vim.lsp.buf.rename "rename"]
             :s [vim.lsp.buf.signature_help "signature"]
             :f [vim.lsp.buf.format "format"]
             :o [":lua require('config.lsp')['organize-imports']()<cr>" "organize imports"]
             :l {:name "lsp"
                 :s [":LspStart<cr>" "start"]
                 :S [":LspStop<cr>" "stop"]}
             :x {:name "errors"
                 :x ["<cmd>TroubleToggle<cr>" "toggle"]
                 :w ["<cmd>TroubleToggle lsp_workspace_diagnostics<cr>" "workspace errors"]
                 :b ["<cmd>TroubleToggle lsp_document_diagnostics<cr>" "buffer errors"]
                 :q ["<cmd>TroubleToggle quickfix<cr>" "quickfix"]
                 :l ["<cmd>TroubleToggle loclist<cr>" "loclist"]}}
         :t {:name "toggle"
             :c [":TSContextToggle<cr>" "toggle context"]
             :i [":set invlist<cr>" "invisible chars"]
             :j [":TSJToggle<cr>" "split join"]
             :l [":set relativenumber!<cr>" "relative number"]
             :u [":UndotreeToggle<cr>" "undo tree"]
             :w [":set wrap!<cr>" "toggle wrap"]}
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
             :r [":VtrSendCommandToRunner<cr>" "send command"]}}}
       {:mode "n"})

      (wk.register
       {:<leader> {:x {:name "tmux"
                       :l [":VtrSendLinesToRunner<cr>" "send lines"]}}
        :g {:b {:name "base64"
                :e ["c<c-r>=trim(system('base64', @\"))<cr><esc>" "encode"]
                :d ["c<c-r>=system('base64 --decode', @\")<cr><esc>" "decode"]}
            :t ["c<c-r>=strftime(\"%Y-%m-%dT%H:%M:%S%z\", @\"[0:9])<cr><esc>" "encode"]}
        :<c-j> [":m '>+1<cr>gv=gv" "move line up"]
        :<c-k> [":m '<-2<cr>gv=gv" "move line down"]}
       {:mode "v"})))}}

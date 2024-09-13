{:lazydef
 {1 "folke/which-key.nvim"
  :event :VeryLazy
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
      (wk.setup {:icons {:mappings false}})
      (wk.add
       [{1 :g :group "go to"}
        {1 :gD 2 vim.lsp.buf.declaration :desc "declaration"}
        {1 :gd 2 vim.lsp.buf.definition :desc "definition"}
        {1 :gi 2 vim.lsp.buf.implementation :desc "implementation"}
        {1 :gr 2 vim.lsp.buf.references :desc "references"}
        {1 :gs 2 vim.lsp.buf.signature_help :desc "signature help"}

        {1 :Q 2 "<nop>" :desc "nop"}
        {1 :K 2 vim.lsp.buf.hover :desc "hover"}

        {1 :zj 2 ":lua require('leap').leap({})<cr>" :desc "leap forward"}
        {1 :zk 2 ":lua require('leap').leap({backward = true})<cr>" :desc "leap backward"}

        {1 "]" :group "next"}
        {1 "]e" 2 vim.diagnostic.goto_next :desc "error"}

        {1 "[" :group "previous"}
        {1 "[e" 2 vim.diagnostic.goto_prev :desc "error"}

        {1 :<esc> 2 "<esc>:nohl<CR><esc>" :desc "esc"}

        {1 :<leader> :group "leader"}

        {1 :<leader>? 2 wk.show :desc "show"}

        {1 :<leader><leader> 2 ":FzfLua files<cr>" :desc "find files: searches whole project for a file"}
        {1 :<leader>. 2 ":FzfLua files cwd=%:p:h<cr>" :desc "search for a file in the current directory"}

        {1 :<leader>w :group "window"}
        {1 :<leader>w- 2 ":wincmd _<cr>:wincmd |<cr>" :desc "zoom in"}
        {1 :<leader>w= 2 ":wincmd =<cr>" :desc "re-balance windows"}
        {1 :<leader>w_ 2 ":wincmd _<cr>" :desc "max out the height"}
        {1 :<leader>w| 2 ":wincmd |<cr>" :desc "max out the width"}
        {1 :<leader>wN 2 ":new<cr>" :desc "new empty window"}
        {1 :<leader>wV 2 ":bnew<cr>" :desc "new vertical empty window"}
        {1 :<leader>ws 2 ":sp<cr>" :desc "open a horizontal split"}
        {1 :<leader>wv 2 ":vsp<cr>" :desc "open a vertical split"}
        {1 :<leader>wq 2 ":q<cr>" :desc "close current window"}
        {1 :<leader>wB 2 ":wincmd T<cr>" :desc "break out split into window"}
        {1 :<leader>wo 2 ":wincmd o<cr>" :desc "kill other windows"}
        {1 :<leader>wr 2 ":wincmd r<cr>" :desc "swaps windows"}
        {1 :<leader>wh 2 ":wincmd h<cr>" :desc "moves the cursor buffer on the left"}
        {1 :<leader>wj 2 ":wincmd j<cr>" :desc "moves the cursor buffer on the bottom"}
        {1 :<leader>wk 2 ":wincmd k<cr>" :desc "moves the cursor buffer on the top"}
        {1 :<leader>wl 2 ":wincmd l<cr>" :desc "moves the cursor buffer on the right"}
        {1 :<leader>wH 2 ":wincmd H<cr>" :desc "moves buffer to the left"}
        {1 :<leader>wJ 2 ":wincmd J<cr>" :desc "moves the buffer to the bottom"}
        {1 :<leader>wK 2 ":wincmd K<cr>" :desc "moves the buffer to the top"}
        {1 :<leader>wL 2 ":wincmd L<cr>" :desc "moves cursor buffer to the right"}

        {1 :<leader>f :group "file"}
        {1 :<leader>ft 2 ":vsplit ~/TODO.md<cr>" :desc "opens TODO.md"}
        {1 :<leader>fs 2 ":w<cr>" :desc "writes the buffer"}
        {1 :<leader>fr 2 ":FzfLua oldfiles<cr>" :desc "recent"}

        {1 :<leader>g :group "git"}
        {1 :<leader>gP 2 ":Gitsigns preview_hunk<cr>" :desc "preview hunk"}
        {1 :<leader>gS 2 ":Gitsigns stage_buffer<cr>" :desc "stage buffer"}
        {1 :<leader>gX 2 ":Gitsigns reset_buffer<cr>" :desc "discard buffer"}
        {1 :<leader>gb 2 ":Gitsigns toggle_current_line_blame<cr>" :desc "blame"}
        {1 :<leader>gd 2 ":Gitsigns diffthis<cr>" :desc "diff"}
        {1 :<leader>gg 2 ":Neogit<cr>" :desc "neogit"}
        {1 :<leader>gl 2 ":Gitsigns toggle_linehl<cr>" :desc "line diff"}
        {1 :<leader>gn 2 ":Gitsigns next_hunk<CR>" :desc "next hunk"}
        {1 :<leader>gp 2 ":Gitsigns prev_hunk<CR>" :desc "previous hunk"}
        {1 :<leader>gs 2 ":Gitsigns stage_hunk<cr>" :desc "stage hunk"}
        {1 :<leader>gt 2 ":Tardis<CR>" :desc "time machine"}
        {1 :<leader>gv 2 ":Gitsigns select_hunk<cr>" :desc "select hunk"}
        {1 :<leader>gx 2 ":Gitsigns reset_hunk<cr>" :desc "discard hunk"}

        {1 :<leader>gf :group "find"}
        {1 :<leader>gff 2 ":FzfLua git_files<cr>" :desc "git files"}
        {1 :<leader>gfs 2 ":FzfLua git_status<cr>" :desc "status files"}
        {1 :<leader>gfc 2 ":FzfLua git_commits<cr>" :desc "commits"}
        {1 :<leader>gfC 2 ":FzfLua git_bcommits<cr>" :desc "buffer commits"}

        {1 :<leader>h :group "help"}
        {1 :<leader>hu 2 #(: (require :jf) :update) :desc "update"}

        {1 :<leader>s :group "search"}
        {1 :<leader>sb 2 ":FzfLua buffers<cr>" :desc "buffers"}
        {1 :<leader>sf 2 ":FzfLua files<cr>" :desc "files"}
        {1 :<leader>sm 2 ":FzfLua marks<cr>" :desc "marks"}
        {1 :<leader>sp 2 ":FzfLua live_grep<cr>" :desc "search project"}

        {1 :<leader>b :group "buffers"}
        {1 :<leader>bb 2 ":FzfLua buffers<cr>" :desc "search buffers"}
        {1 :<leader>bp 2 ":BufferPrevious<cr>" :desc "previous"}
        {1 :<leader>bn 2 ":BufferNext<cr>" :desc "next"}
        {1 :<leader>bs 2 ":BufferPick<cr>" :desc "search"}
        {1 :<leader>b< 2 ":BufferMovePrevious<cr>" :desc "move previous"}
        {1 :<leader>b> 2 ":BufferMoveNext<cr>" :desc "move next"}
        {1 :<leader>b1 2 ":BufferGoto 1<CR>" :desc "goto 1"}
        {1 :<leader>b2 2 ":BufferGoto 2<CR>" :desc "goto 2"}
        {1 :<leader>b3 2 ":BufferGoto 3<CR>" :desc "goto 3"}
        {1 :<leader>b4 2 ":BufferGoto 4<CR>" :desc "goto 4"}
        {1 :<leader>b5 2 ":BufferGoto 5<CR>" :desc "goto 5"}
        {1 :<leader>b6 2 ":BufferGoto 6<CR>" :desc "goto 6"}
        {1 :<leader>b7 2 ":BufferGoto 7<CR>" :desc "goto 7"}
        {1 :<leader>b8 2 ":BufferGoto 8<CR>" :desc "goto 8"}
        {1 :<leader>b9 2 ":BufferLast<CR>" :desc "goto last"}
        {1 :<leader>bk 2 ":BufferClose<cr>" :desc "kill"}
        {1 :<leader>bd 2 ":BufferClose<cr>" :desc "current"}
        {1 :<leader>ba 2 ":BufferWipeout<cr>" :desc "all"}
        {1 :<leader>bo 2 ":BufferCloseAllButCurrent<cr>" :desc "others"}
        {1 :<leader>bl 2 ":BufferCloseBuffersLeft<cr>" :desc "left"}
        {1 :<leader>br 2 ":BufferCloseBuffersRight<cr>" :desc "right"}

        {1 :<leader>bd :group "delete"}
        {1 :<leader>bdd 2 ":BufferClose<cr>" :desc "current"}
        {1 :<leader>bda 2 ":BufferWipeout<cr>" :desc "all"}
        {1 :<leader>bdo 2 ":BufferCloseAllButCurrent<cr>" :desc "others"}
        {1 :<leader>bdl 2 ":BufferCloseBuffersLeft<cr>" :desc "left"}
        {1 :<leader>bdr 2 ":BufferCloseBuffersRight<cr>" :desc "right"}

        {1 :<leader>o :group "open"}
        {1 :<leader>o- 2 ":NERDTreeExplore<cr>" :desc "Open current folder"}
        {1 :<leader>oP 2 ":MarkdownPreviewToggle<cr>" :desc "Toggle markdown preview"}
        {1 :<leader>op 2 ":NERDTreeToggle<cr>" :desc "NERDTree"}
        {1 :<leader>of 2 ":NERDTreeFocus<cr>" :desc "Focus NERDTree"}
        {1 :<leader>o. 2 ":NERDTreeFind<cr>" :desc "NERDTree here"}
        {1 :<leader>oy 2 ":Yazi cwd<cr>" :desc "Yazi"}

        {1 :<leader>p :group "project"}
        {1 :<leader>pr 2 ":FzfLua oldfiles cwd=%:p:h<cr>" :desc "recent files"}

        {1 :<leader>c :group "code"}
        {1 :<leader>ca 2 vim.lsp.buf.code_action :desc "action"}
        {1 :<leader>cr 2 vim.lsp.buf.rename :desc "rename"}
        {1 :<leader>cs 2 vim.lsp.buf.signature_help :desc "signature"}
        {1 :<leader>cf 2 ":lua require('conform').format({ lsp_fallback = true })<cr>" :desc "format"}
        {1 :<leader>co 2 ":lua require('config.lsp')['organize-imports']()<cr>" :desc "organize imports"}
        {1 :<leader>cl :group "lsp"}
        {1 :<leader>cls 2 ":LspStart<cr>" :desc "start"}
        {1 :<leader>clS 2 ":LspStop<cr>" :desc "stop"}
        {1 :<leader>cx :group "errors"}
        {1 :<leader>cxx 2 ":TroubleToggle<cr>" :desc "toggle"}
        {1 :<leader>cw 2 ":TroubleToggle lsp_workspace_diagnostics<cr>" :desc "workspace errors"}
        {1 :<leader>cb 2 ":TroubleToggle lsp_document_diagnostics<cr>" :desc "buffer errors"}
        {1 :<leader>cq 2 ":TroubleToggle quickfix<cr>" :desc "quickfix"}
        {1 :<leader>cl 2 ":TroubleToggle loclist<cr>" :desc "loclist"}

        {1 :<leader>t :group "toggle"}
        {1 :<leader>tc 2 ":TSContextToggle<cr>" :desc "toggle context"}
        {1 :<leader>ti 2 ":set invlist<cr>" :desc "invisible chars"}
        {1 :<leader>tj 2 ":TSJToggle<cr>" :desc "split join"}
        {1 :<leader>tl 2 ":set relativenumber!<cr>" :desc "relative number"}
        {1 :<leader>tu 2 ":UndotreeToggle<cr>" :desc "undo tree"}
        {1 :<leader>tw 2 ":set wrap!<cr>" :desc "toggle wrap"}

        {1 :<leader>x :group "tmux"}
        {1 :<leader>x- 2 ":VtrOpenRunner { \"orientation\": \"v\", \"percentage\": 50 }<cr>" :desc "open vertical runner"}
        {1 :<leader>x= 2 ":VtrOpenRunner { \"orientation\": \"h\", \"percentage\": 50  }<cr>" :desc "open horizontal runner"}
        {1 :<leader>xC 2 ":VtrSendCtrlC<cr>" :desc "send ctrl-c"}
        {1 :<leader>xD 2 ":VtrSendCtrlD<cr>" :desc "send ctrl-d"}
        {1 :<leader>xF 2 ":VtrFlushCommand<cr>" :desc "flush command"}
        {1 :<leader>xR 2 ":VtrResizeRunner<cr>" :desc "resize"}
        {1 :<leader>xa 2 ":VtrAttachToPane<cr>" :desc "attach"}
        {1 :<leader>xc 2 ":VtrClearRunner<cr>" :desc "clear runner"}
        {1 :<leader>xd 2 ":VtrDetachRunner<cr>" :desc "detach runner"}
        {1 :<leader>xf 2 ":VtrFocusRunner<cr>" :desc "focus runner"}
        {1 :<leader>xk 2 ":VtrKillRunner<cr>" :desc "kill runner"}
        {1 :<leader>xl 2 ":VtrSendLinesToRunner<cr>" :desc "send lines"}
        {1 :<leader>xo 2 ":VtrReorientRunner<cr>" :desc "reorient"}
        {1 :<leader>xr 2 ":VtrSendCommandToRunner<cr>" :desc "send command"}

        {:mode :v 1 :<c-j> 2 ":m '>+1<cr>gv=gv" :desc "move line up"}
        {:mode :v 1 :<c-k> 2 ":m '<-2<cr>gv=gv" :desc "move line down"}

        {:mode :v 1 :gb :group "base64"}
        {:mode :v 1 :gbe 2 "c<c-r>=trim(system('base64', @\"))<cr><esc>" :desc "encode"}
        {:mode :v 1 :gbd 2 "c<c-r>=system('base64 --decode', @\")<cr><esc>" :desc "decode"}

        {:mode :v 1 :gt 2 "c<c-r>=strftime(\"%Y-%m-%dT%H:%M:%S%z\", @\"[0:9])<cr><esc>" :desc "encode"}

        {:mode :v 1 :<leader>x :group "tmux"}
        {:mode :v 1 :<leader>xl 2 ":VtrSendLinesToRunner<cr>" :desc "send lines"}])))}}

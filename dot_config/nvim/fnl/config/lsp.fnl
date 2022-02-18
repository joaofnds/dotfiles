(fn on_attach []
  (let [saga (require :lspsaga)
        {: nnoremap : vnoremap} (require :utils)]
    (saga.init_lsp_saga
      {"max_preview_lines" 10

       "finder_action_keys"
       {"open" ["o" "<cr>"]
        "vsplit" "s"
        "split" "i"
        "quit" ["q" "<esc>"]
        "scroll_down" "<c-f>"
        "scroll_up" "<c-b>"}

       "code_action_keys"   {"quit" ["q" "<esc>"] "exec" "<cr>"}
       "rename_action_keys" {"quit" ["q" "<esc>"] "exec" "<cr>"}})

    (nnoremap "gd" "<cmd>lua vim.lsp.buf.definition()<cr>")
    (nnoremap "gi" "<cmd>lua vim.lsp.buf.implementation()<cr>")
    (nnoremap "gh" ":Lspsaga lsp_finder<CR>")
    (nnoremap "gr" "<cmd>lua vim.lsp.buf.references()<cr>")
    (nnoremap "K" "<cmd>lua require('lspsaga.hover').render_hover_doc()<CR>")

    (nnoremap "<silent><leader>ca" "<cmd>lua require('lspsaga.codeaction').code_action()<CR>")
    (vnoremap "<silent><leader>ca" ":<C-U>lua require('lspsaga.codeaction').range_code_action()<CR>")
    (nnoremap "<leader>cr" "<cmd>lua require('lspsaga.rename').rename()<cr>")
    (nnoremap "<leader>cs" "<cmd>lua require('lspsaga.signaturehelp').signature_help()<cr>")
    (nnoremap "<leader>cp" "<cmd>lua require('lspsaga.provider').preview_definition()<cr>")
    (nnoremap "<leader>cd" "<cmd>lua require('lspsaga.diagnostic').show_line_diagnostics()<cr>")

    (nnoremap "<leader>cls" ":LspStart<cr>")
    (nnoremap "<leader>clS" ":LspStop<cr>")))


(fn init []
  (let [lspinstall (require :nvim-lsp-installer)]
    (lspinstall.on_server_ready
     (lambda [server]
       (server:setup {"on_attach" on_attach})))))

{"init" init}

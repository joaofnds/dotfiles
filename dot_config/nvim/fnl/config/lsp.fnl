(fn on_attach []
  (let [saga (require :lspsaga)
        {: nnoremap : vnoremap} (require :utils)]
    (saga.init_lsp_saga)

    (nnoremap "gd" "<cmd>lua vim.lsp.buf.definition()<CR>")
    (nnoremap "<leader>ca" "<cmd>lua require('lspsaga.codeaction').code_action()<CR>")
    (vnoremap "<leader>ca" ":<C-U>lua require('lspsaga.codeaction').range_code_action()<CR>")
    (nnoremap "<leader>cr" "<cmd>lua require('lspsaga.rename').rename()<CR>")
    (nnoremap "<leader>cs" "<cmd>lua require('lspsaga.signaturehelp').signature_help()<CR>")
    (nnoremap "<leader>cp" "<cmd>lua require'lspsaga.provider'.preview_definition()<CR>")
    (nnoremap "<leader>cd" "<cmd>lua require'lspsaga.diagnostic'.show_line_diagnostics()<CR>")
    (nnoremap "K" "<cmd>lua require('lspsaga.hover').render_hover_doc()<CR>")))

(fn init []
  (let [lspconfig (require :lspconfig)
        lspinstall (require :lspinstall)]
    (lspinstall.setup)

    (each [_ server (pairs (lspinstall.installed_servers))]
      (let [config (. lspconfig server)]
        (config.setup { "on_attach" on_attach})))))

{"init" init}

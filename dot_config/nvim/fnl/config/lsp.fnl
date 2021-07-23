(fn on_attach []
  (let [saga (require :lspsaga)
        {: nnoremap : vnoremap} (require :utils)]
    (saga.init_lsp_saga)

    (nnoremap "gd" "<cmd>lua vim.lsp.buf.definition()<cr>")
    (nnoremap "gi" "<cmd>lua vim.lsp.buf.implementation()<cr>")
    (nnoremap "gr" "<cmd>lua vim.lsp.buf.references()<cr>")

    (nnoremap "<leader>ca" "<cmd>lua require('lspsaga.codeaction').code_action()<cr>")
    (vnoremap "<leader>ca" ":<C-U>lua require('lspsaga.codeaction').range_code_action()<cr>")
    (nnoremap "<leader>cr" "<cmd>lua require('lspsaga.rename').rename()<cr>")
    (nnoremap "<leader>cs" "<cmd>lua require('lspsaga.signaturehelp').signature_help()<cr>")
    (nnoremap "<leader>cp" "<cmd>lua require'lspsaga.provider'.preview_definition()<cr>")
    (nnoremap "<leader>cd" "<cmd>lua require'lspsaga.diagnostic'.show_line_diagnostics()<cr>")
    (nnoremap "<leader>cf" "<cmd>lua vim.lsp.buf.formatting()<cr>")

    (nnoremap "<leader>cls" ":LspStart<cr>")
    (nnoremap "<leader>clS" ":LspStop<cr>")

    (nnoremap "K" "<cmd>lua require('lspsaga.hover').render_hover_doc()<cr>")))

(fn init []
  (let [lspconfig (require :lspconfig)
        lspinstall (require :lspinstall)]
    (lspinstall.setup)

    (each [_ server (pairs (lspinstall.installed_servers))]
      (let [config (. lspconfig server)]
        (config.setup { "on_attach" on_attach})))))

{"init" init}

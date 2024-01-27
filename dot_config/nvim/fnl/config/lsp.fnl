(let [mason (require :mason)
      mason-lspconfig (require :mason-lspconfig)
      lspconfig (require :lspconfig)
      lsp_signature (require :lsp_signature)
      cmp (require :cmp_nvim_lsp)
      capabilities (vim.lsp.protocol.make_client_capabilities)
      cmp-capabilities (cmp.default_capabilities capabilities)]

  (mason.setup)
  (mason-lspconfig.setup {})
  (mason-lspconfig.setup_handlers
    [(fn [server-name] ((. lspconfig server-name :setup) {:capabilities cmp-capabilities}))])

  (lsp_signature.setup {:hint_enable false :toggle_key "<C-k>"}))

(fn organize-imports [bufnr post]
  (let [buf (vim.api.nvim_buf_get_name (vim.api.nvim_get_current_buf))]
    (vim.lsp.buf_request_all
      bufnr
      "workspace/executeCommand"
      {:command "_typescript.organizeImports"
       :arguments [buf]}
      (fn [err]
        (when (and (not err) post)
          (post))))))

{:organize-imports organize-imports}

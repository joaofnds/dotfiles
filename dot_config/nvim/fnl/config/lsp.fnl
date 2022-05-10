(let [lsp_signature (require :lsp_signature)]
  (lsp_signature.setup
    {:hint_enable false
     :toggle_key "<C-k>"}))

(fn on-attach [client buffer]
  (let [{: find} (require :lume)]
    (when (find ["tsserver" "gopls" "solargraph" "pyright"] client.name)
      (set client.resolved_capabilities.document_formatting false))))

(fn config []
  (let [installer (require :nvim-lsp-installer)
        lspconfig (require :lspconfig)
        opts {:on_attach on-attach}]
    (installer.setup {:ensure_installed ["gopls" "tsserver" "solargraph"]})
    (lspconfig.gopls.setup opts)
    (lspconfig.tsserver.setup opts)
    (lspconfig.solargraph.setup opts)))

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

{:config config
 :organize-imports organize-imports}

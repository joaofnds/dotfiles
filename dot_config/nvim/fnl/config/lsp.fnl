(fn config []
  (let [{: find} (require :lume)
        installer (require :nvim-lsp-installer)
        lspconfig (require :lspconfig)
        lsp_signature (require :lsp_signature)
        servers ["tsserver" "gopls"]]

    (lsp_signature.setup {:hint_enable false :toggle_key "<C-k>"})

    (installer.setup {:ensure_installed servers})

    (fn on-attach [client buffer]
      (when (find servers client.name)
        (set client.server_capabilities.document_formatting false)))

    (each [_ server (ipairs servers)]
      ((. lspconfig server "setup") {:on_attach on-attach}))))

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

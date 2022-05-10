(let [lsp_signature (require :lsp_signature)]
  (lsp_signature.setup
    {:hint_enable false
     :toggle_key "<C-k>"}))

(fn on-attach [client buffer]
  (let [{: find} (require :lume)]
    (when (find ["tsserver" "gopls" "solargraph" "pyright"] client.name)
      (set client.resolved_capabilities.document_formatting false))))

(fn init []
  (let [lspinstall (require :nvim-lsp-installer)]
    (lspinstall.on_server_ready
     (lambda [server]
       (server:setup {:on_attach on-attach})))))

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

{:init init
 :organize-imports organize-imports}

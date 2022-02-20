(fn on-attach [client buffer]
  (let [{: find} (require :lume)]
    (when (find ["tsserver" "gopls" "solargraph"] client.name)
      (set client.resolved_capabilities.document_formatting false))))

(fn init []
  (let [lspinstall (require :nvim-lsp-installer)]
    (lspinstall.on_server_ready
     (lambda [server]
       (server:setup {:on_attach on-attach})))))

{:init init}

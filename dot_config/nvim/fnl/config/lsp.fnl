(fn init []
  (let [lspinstall (require :nvim-lsp-installer)]
    (lspinstall.on_server_ready
     (lambda [server]
       (server:setup {})))))

{:init init}

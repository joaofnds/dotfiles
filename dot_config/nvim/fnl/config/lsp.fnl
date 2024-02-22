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

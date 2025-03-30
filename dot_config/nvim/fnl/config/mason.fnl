{:lazydef
 {1 "williamboman/mason.nvim"
  :event :BufReadPost
  :cmd [:Mason :MasonUpdate]
  :dependencies
  ["williamboman/mason-lspconfig.nvim"
   "neovim/nvim-lspconfig"]
  :config
  (fn []
    (let [mason (require :mason)
          mason-lspconfig (require :mason-lspconfig)
          lspconfig (require :lspconfig)
          util (require :lspconfig.util)
          cmp (require :cmp_nvim_lsp)
          capabilities (vim.lsp.protocol.make_client_capabilities)
          cmp-capabilities (cmp.default_capabilities capabilities)

          deno-root (util.root_pattern "deno.json")
          biome-root (util.root_pattern "biome.json")
          ts-root (util.root_pattern "tsconfig.json")]

      (vim.diagnostic.config {:virtual_lines {:current_line true}})

      (vim.api.nvim_create_autocmd :LspAttach
       {:callback
        (fn [ev]
          (let [client (vim.lsp.get_client_by_id ev.data.client_id)]
            (when (client.supports_method :textDocument/completion)
              (vim.lsp.completion.enable true client.id ev.buf {:autotrigger true}))))})

      (local lsp-options
       {:capabilities cmp-capabilities
        :settings {:fennel {:diagnostics {:globals [:vim]}
                            :workspace {:library (vim.api.nvim_list_runtime_paths)}}}}) 

      (fn setup-server [name]
        ((. lspconfig name :setup) lsp-options))

      (mason.setup)
      (mason-lspconfig.setup
       {:handlers
        {1 setup-server
         :denols #(when (deno-root $1) (lspconfig.denols.setup {}))
         :biome #(when (biome-root $1) (lspconfig.biome.setup {}))
         :ts_ls #(when (ts-root $1) (lspconfig.ts_ls.setup {}))}})

      (setup-server :gleam)))}}

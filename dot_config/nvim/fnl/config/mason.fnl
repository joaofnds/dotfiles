{:lazydef
 {1 "williamboman/mason.nvim"
  :event "BufReadPost"
  :cmd "Mason"
  :dependencies
  ["williamboman/mason-lspconfig.nvim"
   "neovim/nvim-lspconfig"
   "ray-x/lsp_signature.nvim"
   "nvimtools/none-ls.nvim"]
  :config
  (fn []
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
       [(fn [server-name]
          ((. lspconfig server-name :setup) {:capabilities cmp-capabilities}))])
      (lsp_signature.setup {:hint_enable false :toggle_key "<C-k>"})))}}

(let [null-ls (require :null-ls)]
 (null-ls.setup
  {:sources
   [null-ls.builtins.diagnostics.cue_fmt
    null-ls.builtins.diagnostics.eslint
    null-ls.builtins.diagnostics.golangci_lint
    null-ls.builtins.diagnostics.shellcheck
    null-ls.builtins.formatting.goimports
    null-ls.builtins.formatting.rubocop
    null-ls.builtins.formatting.shfmt
    null-ls.builtins.formatting.prettier]}))

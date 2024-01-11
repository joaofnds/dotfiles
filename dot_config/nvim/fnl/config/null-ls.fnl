(let [null-ls (require :null-ls)]
  (null-ls.setup
    {:sources
     [null-ls.builtins.diagnostics.eslint
      null-ls.builtins.diagnostics.golangci_lint
      null-ls.builtins.diagnostics.shellcheck
      (null-ls.builtins.diagnostics.sqlfluff.with {:extra_args ["--dialect" "postgres"]})
      null-ls.builtins.formatting.prettier
      null-ls.builtins.formatting.goimports
      null-ls.builtins.formatting.shfmt
      null-ls.builtins.formatting.sqlfluff
      (null-ls.builtins.formatting.sqlfluff.with {:extra_args ["--dialect" "postgres"]})]}))

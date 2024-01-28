(local {: any } (require :lume))

(fn root-has [& files]
  (fn [utils]
    (any files utils.root_has_file)))

(fn root-has-not [& files]
  (fn [utils]
    (not (any files utils.root_has_file))))

(let [null-ls (require :null-ls)]
  (null-ls.setup
    {:sources
     [null-ls.builtins.diagnostics.golangci_lint
      null-ls.builtins.diagnostics.shellcheck
      (null-ls.builtins.diagnostics.sqlfluff.with {:extra_args ["--dialect" "postgres"]})

      null-ls.builtins.formatting.goimports
      null-ls.builtins.formatting.shfmt
      (null-ls.builtins.formatting.prettier.with {:condition (root-has-not "biome.json")})
      (null-ls.builtins.formatting.biome.with {:condition (root-has "biome.json")})
      (null-ls.builtins.formatting.sqlfluff.with {:extra_args ["--dialect" "postgres"]})]}))

(let [null-ls (require :null-ls)]
 (null-ls.setup
  {:sources
   [null-ls.builtins.code_actions.gitsigns
    null-ls.builtins.diagnostics.cue_fmt
    null-ls.builtins.diagnostics.eslint
    null-ls.builtins.diagnostics.shellcheck
    null-ls.builtins.formatting.black
    null-ls.builtins.formatting.goimports
    null-ls.builtins.formatting.rubocop
    null-ls.builtins.formatting.shfmt
    null-ls.builtins.formatting.prettier
    null-ls.builtins.formatting.fnlfmt]}))

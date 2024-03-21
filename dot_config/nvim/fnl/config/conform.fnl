{:lazydef
 {1 "stevearc/conform.nvim"
  :lazy true
  :opts {:formatters_by_ft
         {:go [:goimports :gofmt]
          :sh [:shfmt]
          :gleam [:gleam]
          :python [:black]
          :sql [:sqlfluff]
          :javascript [:prettier]
          :typescript [:prettier]}}}}

{:lazydef
 {1 "stevearc/conform.nvim"
  :lazy true
  :opts
  {:formatters_by_ft
   {:go [:goimports :gofmt]
    :sh [:shfmt]
    :gleam [:gleam]
    :python [:black]
    :sql [:sqlfluff]
    :json {0 :biome 1 :prettier :stop_after_first true}
    :javascript {0 :biome 1 :prettier :stop_after_first true}
    :typescript {0 :biome 1 :prettier :stop_after_first true}}
   :default_format_opts
   {:timeout_ms 2_000}}}}

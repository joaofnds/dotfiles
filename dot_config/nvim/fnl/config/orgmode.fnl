(let [orgmode (require :orgmode)
      configs (require :nvim-treesitter.configs)
      parsers (require :nvim-treesitter.parsers)
      parser-configs (parsers.get_parser_configs)]

  (set parser-configs.org
       {"install_info"
        {"url" "https://github.com/milisims/tree-sitter-org"
         "revision" "f110024d539e676f25b72b7c80b0fd43c34264ef"
         "files" ["src/parser.c" "src/scanner.cc"]}
        "filetype" "org"})

  (configs.setup
   {"highlight"
    {"enable" true
     "disable" ["org"]
     "additional_vim_regex_highlighting" ["org"]}
    "ensure_installed" ["org"]})

  (orgmode.setup))

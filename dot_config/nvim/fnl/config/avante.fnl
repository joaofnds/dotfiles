{:lazydef
 {1 "yetone/avante.nvim"
  :event :VeryLazy
  :build :make
  :dependencies
  ["nvim-treesitter/nvim-treesitter"
   "stevearc/dressing.nvim"
   "nvim-lua/plenary.nvim"
   "MunifTanjim/nui.nvim"
   "zbirenbaum/copilot.lua"]
  :opts
  {:provider "copilot"
   :auto_suggestions_provider "copilot"
   :providers
   {:copilot {:model "claude-sonnet-4"}}}}}

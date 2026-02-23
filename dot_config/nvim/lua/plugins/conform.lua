return {
	"stevearc/conform.nvim",
	lazy = true,
	opts = {
		formatters_by_ft = {
			go = { "goimports", "gofmt" },
			sh = { "shfmt" },
			gleam = { "gleam" },
			python = { "black" },
			sql = { "sqlfluff" },
			nix = { "alejandra" },
			json = { "biome", "prettier", stop_after_first = true },
			javascript = { "biome", "prettier", stop_after_first = true },
			typescript = { "biome", "prettier", stop_after_first = true },
		},
		default_format_opts = {
			timeout_ms = 2000,
		},
	},
}

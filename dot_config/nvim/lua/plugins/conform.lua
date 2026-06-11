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
			json = { "biome", "oxfmt", stop_after_first = true },
			javascript = { "biome", "oxfmt", stop_after_first = true },
			typescript = { "biome", "oxfmt", stop_after_first = true },
			yaml = { "oxfmt" },
		},
		default_format_opts = {
			timeout_ms = 2000,
		},
	},
}

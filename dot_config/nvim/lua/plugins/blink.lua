return {
	"Saghen/blink.cmp",
	version = "1.*",
	event = "InsertEnter",
	dependencies = { "folke/lazydev.nvim" },
	opts = {
		keymap = { preset = "enter" },
		signature = { enabled = true },
		completion = {
			documentation = { auto_show = true },
		},
		sources = {
			default = { "lsp", "path", "snippets", "buffer", "lazydev" },
			providers = {
				lazydev = {
					name = "LazyDev",
					module = "lazydev.integrations.blink",
					score_offset = 100,
				},
			},
		},
	},
}

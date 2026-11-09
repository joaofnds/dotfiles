return {
	"Saghen/blink.cmp",
	version = "1.*",
	event = "InsertEnter",
	opts = {
		keymap = { preset = "enter" },
		signature = { enabled = true },
		completion = {
			documentation = { auto_show = true },
		},
		sources = {
			default = { "lsp", "path", "snippets", "buffer" },
			per_filetype = {
				lua = { inherit_defaults = true, "lazydev" },
			},
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

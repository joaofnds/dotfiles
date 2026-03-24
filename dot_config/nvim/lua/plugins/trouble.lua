return {
	"folke/trouble.nvim",
	cmd = "Trouble",
	keys = {
		{ "<leader>cd", "<cmd>Trouble diagnostics toggle<cr>", desc = "diagnostics" },
		{ "<leader>cD", "<cmd>Trouble diagnostics toggle filter.buf=0<cr>", desc = "buffer diagnostics" },
	},
	opts = {
		icons = {
			indent = {
				middle = " ",
				last = " ",
				top = " ",
				ws = "  ",
			},
			folder_closed = "> ",
			folder_open = "v ",
			kinds = {},
		},
	},
}

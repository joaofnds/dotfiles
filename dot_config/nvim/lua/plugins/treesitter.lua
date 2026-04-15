local buf = require("util.buf")

return {
	"nvim-treesitter/nvim-treesitter",
	branch = "master",
	dependencies = { "nvim-treesitter/nvim-treesitter-context" },
	event = { "BufNewFile", "BufReadPost" },
	cmd = "TSUpdate",
	keys = {
		{ "<leader>tc", "<cmd>TSContextToggle<cr>", desc = "toggle context" },
	},
	main = "nvim-treesitter.configs",
	opts = {
		auto_install = true,
		highlight = { enable = true, disable = buf.is_big_file },
		indent = { enable = true, disable = buf.is_big_file },
		incremental_selection = {
			enable = true,
			disable = buf.is_big_file,
			keymaps = {
				init_selection = "g>",
				node_incremental = "g>",
				node_decremental = "g<",
				scope_incremental = false,
			},
		},
	},
}

return {
	"nvim-treesitter/nvim-treesitter-context",
	event = "User LazyFile",
	cmd = "TSContext",
	keys = {
		{ "<leader>tc", "<cmd>TSContext toggle<cr>", desc = "toggle context" },
	},
}

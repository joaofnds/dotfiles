return {
	"Wansmer/treesj",
	dependencies = { "nvim-treesitter/nvim-treesitter" },
	cmd = "TSJToggle",
	keys = {
		{ "<leader>tj", "<cmd>TSJToggle<cr>", desc = "split join" },
	},
	opts = {},
}

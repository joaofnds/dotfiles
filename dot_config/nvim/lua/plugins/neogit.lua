return {
	"NeogitOrg/neogit",
	dependencies = { "sindrets/diffview.nvim", "nvim-lua/plenary.nvim" },
	cmd = "Neogit",
	keys = {
		{ "<leader>gg", "<cmd>Neogit<cr>", desc = "neogit" },
	},
	opts = {
		integrations = {
			diffview = true,
		},
	},
}

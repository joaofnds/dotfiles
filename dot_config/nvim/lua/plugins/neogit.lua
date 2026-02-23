return {
	"NeogitOrg/neogit",
	dependencies = { "sindrets/diffview.nvim", "nvim-lua/plenary.nvim" },
	cmd = "Neogit",
	opts = {
		integrations = {
			diffview = true,
		},
	},
}

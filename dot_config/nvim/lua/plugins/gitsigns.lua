return {
	"lewis6991/gitsigns.nvim",
	event = { "BufNewFile", "BufReadPost" },
	cmd = "Gitsigns",
	opts = {
		signcolumn = false,
		numhl = true,
	},
}

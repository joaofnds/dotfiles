return {
	"sindrets/diffview.nvim",
	cmd = {
		"DiffviewOpen",
		"DiffviewClose",
		"DiffviewToggleFiles",
		"DiffviewFocusFiles",
		"DiffviewRefresh",
		"DiffviewFileHistory",
	},
	opts = {
		use_icons = false,
		keymaps = {
			view = {
				{ "n", "q", "<Cmd>DiffviewClose<CR>", { desc = "Close Diffview" } },
			},
			file_panel = {
				{ "n", "q", "<Cmd>DiffviewClose<CR>", { desc = "Close Diffview" } },
			},
			file_history_panel = {
				{ "n", "q", "<Cmd>DiffviewClose<CR>", { desc = "Close Diffview" } },
			},
		},
	},
}

return {
	"sindrets/diffview.nvim",
	cmd = {
		"DiffviewOpen",
		"DiffviewClose",
		"DiffviewToggleFiles",
		"DiffviewFocusFiles",
		"DiffviewRefresh",
		"DiffviewFileHistory",
		"DiffviewLog",
	},
	keys = {
		{ "<leader>gt", "<cmd>DiffviewFileHistory %<cr>", desc = "file history" },
	},
	opts = {
		use_icons = false,
		enhanced_diff_hl = true,
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

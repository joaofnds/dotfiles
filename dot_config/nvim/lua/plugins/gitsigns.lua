return {
	"lewis6991/gitsigns.nvim",
	event = { "BufNewFile", "BufReadPost" },
	cmd = "Gitsigns",
	keys = {
		{ "<leader>gP", "<cmd>Gitsigns preview_hunk<cr>", desc = "preview hunk" },
		{ "<leader>gS", "<cmd>Gitsigns stage_buffer<cr>", desc = "stage buffer" },
		{ "<leader>gX", "<cmd>Gitsigns reset_buffer<cr>", desc = "discard buffer" },
		{ "<leader>gb", "<cmd>Gitsigns toggle_current_line_blame<cr>", desc = "blame" },
		{ "<leader>gd", "<cmd>Gitsigns diffthis<cr>", desc = "diff" },
		{ "<leader>gl", "<cmd>Gitsigns toggle_linehl<cr>", desc = "line diff" },
		{ "<leader>gn", "<cmd>Gitsigns next_hunk<cr>", desc = "next hunk" },
		{ "<leader>gp", "<cmd>Gitsigns prev_hunk<cr>", desc = "previous hunk" },
		{ "<leader>gs", "<cmd>Gitsigns stage_hunk<cr>", desc = "stage hunk" },
		{ "<leader>gv", "<cmd>Gitsigns select_hunk<cr>", desc = "select hunk" },
		{ "<leader>gx", "<cmd>Gitsigns reset_hunk<cr>", desc = "discard hunk" },
	},
	opts = {
		signcolumn = false,
		numhl = true,
	},
}

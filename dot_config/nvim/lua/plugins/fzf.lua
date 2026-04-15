return {
	"ibhagwan/fzf-lua",
	cmd = { "FzfLua" },
	keys = {
		{ "<leader><leader>", "<cmd>FzfLua files<cr>", desc = "find files" },
		{ "<leader>.", "<cmd>FzfLua files cwd=%:p:h<cr>", desc = "files in current dir" },
		{ "<leader>fr", "<cmd>FzfLua oldfiles<cr>", desc = "recent" },
		{ "<leader>sm", "<cmd>FzfLua marks<cr>", desc = "marks" },
		{ "<leader>sp", "<cmd>FzfLua live_grep<cr>", desc = "search project" },
		{ "<leader>bb", "<cmd>FzfLua buffers<cr>", desc = "search buffers" },
		{ "<leader>pr", "<cmd>FzfLua oldfiles cwd=%:p:h<cr>", desc = "recent files" },
		{ "<leader>gff", "<cmd>FzfLua git_files<cr>", desc = "git files" },
		{ "<leader>gfs", "<cmd>FzfLua git_status<cr>", desc = "status files" },
		{ "<leader>gfc", "<cmd>FzfLua git_commits<cr>", desc = "commits" },
		{ "<leader>gfC", "<cmd>FzfLua git_bcommits<cr>", desc = "buffer commits" },
	},
	opts = {
		lsp = {
			jump1 = true,
		},
	},
}

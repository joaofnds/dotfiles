return {
	"iamcco/markdown-preview.nvim",
	build = function()
		vim.call("mkdp#util#install")
	end,
	cmd = { "MarkdownPreviewToggle", "MarkdownPreview", "MarkdownPreviewStop" },
	ft = { "markdown" },
	keys = {
		{ "<leader>oP", "<cmd>MarkdownPreviewToggle<cr>", desc = "toggle markdown preview" },
	},
}

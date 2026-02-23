return {
	"iamcco/markdown-preview.nvim",
	build = function()
		vim.call("mkdp#util#install")
	end,
	cmd = { "MarkdownPreviewToggle", "MarkdownPreview", "MarkdownPreviewStop" },
	ft = { "markdown" },
}

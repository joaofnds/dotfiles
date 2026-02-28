return {
	"maxmx03/solarized.nvim",
	lazy = false,
	priority = 1000,
	---@type solarized.config
	opts = {},
	init = function()
		vim.o.termguicolors = true
		vim.o.background = "dark"
		vim.cmd.colorscheme("solarized")
	end,
}

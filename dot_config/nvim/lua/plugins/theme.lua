return {
	"ishan9299/nvim-solarized-lua",
	event = "UIEnter",
	init = function()
		vim.cmd.colorscheme("solarized")
		vim.api.nvim_set_hl(0, "Visual", { bg = "#073642", fg = "NONE" })
		vim.api.nvim_set_hl(0, "VisualNOS", { bg = "#073642", fg = "NONE" })
		vim.api.nvim_set_hl(0, "VisualMode", { bg = "#073642", fg = "NONE" })
		vim.api.nvim_set_hl(0, "Search", {
			bg = "#073642",
			fg = "NONE",
			undercurl = true,
			italic = true,
		})
		vim.api.nvim_set_hl(0, "IncSearch", {
			bg = "#073642",
			fg = "NONE",
			undercurl = true,
			italic = true,
		})
		vim.api.nvim_set_hl(0, "LeapLabel", { fg = "#d33682" })
	end,
}

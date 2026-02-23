return {
	"romgrk/barbar.nvim",
	event = "UIEnter",
	init = function()
		vim.g.barbar_auto_setup = false
	end,
	opts = {
		animation = false,
		icons = {
			filetype = { enabled = false },
			separator = { left = "▎", right = "" },
			button = "✗ ",
			inactive = { button = "×" },
			modified = { button = "● " },
			current = { buffer_index = true },
			visible = { modified = { buffer_number = false } },
		},
	},
}

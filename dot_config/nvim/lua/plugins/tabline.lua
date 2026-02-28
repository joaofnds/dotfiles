return {
	"akinsho/bufferline.nvim",
	event = "UIEnter",
	opts = {
		options = {
			numbers = "ordinal",
			show_buffer_icons = false,
			show_buffer_close_icons = true,
			show_close_icon = false,
			close_icon = "✗",
			buffer_close_icon = "✗",
			modified_icon = "●",
			separator_style = { "▎", "" },
			indicator = { style = "none" },
		},
	},
}

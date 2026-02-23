return {
	"echasnovski/mini.notify",
	event = { "LspAttach" },
	init = function()
		local function temp_notify(...)
			local notify = require("mini.notify")
			vim.notify = notify.make_notify()
			vim.notify(...)
		end
		vim.notify = temp_notify
	end,
	config = function()
		local notify = require("mini.notify")
		notify.setup({
			content = {
				format = function(n)
					return n.msg
				end,
			},
			window = {
				config = { border = "none" },
				winblend = 100,
			},
		})
	end,
}

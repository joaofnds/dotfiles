return {
	"maxmx03/solarized.nvim",
	lazy = false,
	priority = 1000,
	---@type solarized.config
	opts = {},
	init = function()
		local function state_theme()
			local state = vim.env.XDG_STATE_HOME or (vim.env.HOME .. "/.local/state")
			local ok, lines = pcall(vim.fn.readfile, state .. "/theme")
			if ok and lines[1] == "light" then
				return "light"
			end
			return "dark"
		end

		local function apply_theme()
			vim.o.background = state_theme()
			vim.cmd.colorscheme("solarized")
		end

		vim.o.termguicolors = true
		apply_theme()

		vim.api.nvim_create_autocmd("Signal", {
			pattern = "SIGUSR1",
			callback = apply_theme,
		})
	end,
}

local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
	vim.fn.system({
		"git",
		"clone",
		"--filter=blob:none",
		"--branch=stable",
		"https://github.com/folke/lazy.nvim.git",
		lazypath,
	})
end
vim.opt.rtp:prepend(lazypath)

require("lazy").setup({
	import = "plugins",
	rocks = { enabled = false, hererocks = false },
	performance = {
		rtp = {
			disabled_plugins = {
				"gzip",
				"matchit",
				"netrwPlugin",
				"netrwSettings",
				"netrwFileHandlers",
				"rplugin",
				"spellfile",
				"tarPlugin",
				"tohtml",
				"tutor",
				"zipPlugin",
			},
		},
	},
	ui = {
		icons = {
			cmd = "[cmd]",
			config = "[config]",
			event = "[event]",
			ft = "[ft]",
			init = "[init]",
			import = "[import]",
			keys = "[keys]",
			lazy = "💤",
			loaded = "[+]",
			not_loaded = "[-]",
			plugin = "[plugin]",
			runtime = "[runtime]",
			require = "[require]",
			source = "[source]",
			start = "[start]",
			task = "[task]",
			list = { "*", "+", "-", "." },
		},
	},
})

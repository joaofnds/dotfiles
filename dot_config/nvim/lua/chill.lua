local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.uv.fs_stat(lazypath) then
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

local lazy_file_group = vim.api.nvim_create_augroup("jf_lazy_file", { clear = true })

local fire_lazy_file = function()
	vim.api.nvim_exec_autocmds("User", { pattern = "LazyFile", modeline = false })
end

vim.api.nvim_create_autocmd({ "BufReadPost", "BufNewFile" }, {
	group = lazy_file_group,
	callback = function()
		vim.api.nvim_del_augroup_by_id(lazy_file_group)

		if vim.v.vim_did_enter == 1 then
			fire_lazy_file()
			return
		end

		vim.api.nvim_create_autocmd("User", { pattern = "VeryLazy", once = true, callback = fire_lazy_file })
	end,
})

require("lazy").setup({
	spec = { { import = "plugins" } },
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

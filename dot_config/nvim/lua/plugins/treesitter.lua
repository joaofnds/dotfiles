-- TODO: delete the Lua below and go back to a plain options spec as soon as we can.
-- nvim-treesitter's master branch (the old `opts` config) is frozen and crashes on
-- Neovim 0.12, and its main branch dropped the highlight, indent, auto_install and
-- incremental_selection options, so this file rebuilds them by hand. When main, a
-- maintained companion plugin, or Neovim itself offers them as config again, switch
-- to that and restore the old shape (see this file at commit 1d59813e).
local buf = require("util.buf")

local copy_builtin_keymap = function(from_lhs, to_lhs, desc)
	local keymap = vim.fn.maparg(from_lhs, "x", false, true)
	assert(keymap.callback, "Neovim no longer maps " .. from_lhs .. " in visual mode")

	vim.keymap.set("x", to_lhs, function()
		if not buf.is_big_file(0) then
			keymap.callback()
		end
	end, { desc = desc })
end

local attach = function(bufnr, lang)
	if not vim.treesitter.language.add(lang) then
		return false
	end

	vim.treesitter.start(bufnr, lang)

	if #vim.treesitter.query.get_files(lang, "indents") > 0 then
		vim.bo[bufnr].indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"
	end

	return true
end

local still_wants = function(bufnr, lang)
	return vim.api.nvim_buf_is_loaded(bufnr) and vim.treesitter.language.get_lang(vim.bo[bufnr].filetype) == lang
end

local install_and_attach = function(bufnr, lang)
	local treesitter = require("nvim-treesitter")
	if not vim.list_contains(treesitter.get_available(), lang) then
		return
	end

	treesitter.install(lang):await(function(err)
		if err then
			error(err)
		end

		vim.schedule(function()
			if still_wants(bufnr, lang) then
				attach(bufnr, lang)
			end
		end)
	end)
end

local on_filetype = function(args)
	local lang = vim.treesitter.language.get_lang(args.match)
	if buf.is_big_file(args.buf) or not lang then
		vim.treesitter.stop(args.buf)
		return
	end

	if not attach(args.buf, lang) then
		vim.treesitter.stop(args.buf)
		install_and_attach(args.buf, lang)
	end
end

return {
	"nvim-treesitter/nvim-treesitter",
	branch = "main",
	lazy = false,
	build = ":TSUpdate",
	init = function()
		copy_builtin_keymap("an", "g>", "select parent node")
		copy_builtin_keymap("in", "g<", "select child node")
		vim.keymap.set("n", "g>", "vg>", { remap = true, desc = "select node" })
	end,
	config = function()
		vim.api.nvim_create_autocmd("FileType", {
			group = vim.api.nvim_create_augroup("jf_treesitter", { clear = true }),
			callback = on_filetype,
		})
	end,
}

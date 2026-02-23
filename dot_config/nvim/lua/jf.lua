local oldfiles = function()
	local cwd = vim.fn.getcwd()
	local files = vim.v.oldfiles
	files = vim.tbl_filter(function(v)
		return vim.startswith(v, cwd)
	end, files)
	files = vim.tbl_map(function(v)
		return vim.fn.fnamemodify(v, ":.")
	end, files)
	return files
end

local vimfn = function(name, ...)
	return vim.api.nvim_call_function(name, { ... })
end

local update = function()
	vim.cmd("Lazy update")
	vim.cmd("MasonUpdate")
	vim.cmd("TSUpdate all")
end

return {
	oldfiles = oldfiles,
	vimfn = vimfn,
	update = update,
}

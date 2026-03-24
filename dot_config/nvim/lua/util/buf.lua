local max_file_size = 100 * 1024 -- 100KB

local is_big_file = function(_, buf)
	local ok, stats = pcall(vim.uv.fs_stat, vim.api.nvim_buf_get_name(buf))
	return ok and stats and stats.size > max_file_size
end

return {
	is_big_file = is_big_file,
}

local complete = function()
	vim.api.nvim_exec_autocmds("User", { pattern = "MasonUpdateAllComplete" })
end

local update_installed = function(registry)
	local packages = registry.get_installed_packages()
	local pending = #packages
	local done_one = function()
		pending = pending - 1
		if pending == 0 then
			complete()
		end
	end

	if pending == 0 then
		complete()
		return
	end

	for _, pkg in ipairs(packages) do
		if pkg:get_installed_version() ~= pkg:get_latest_version() then
			pkg:install():on("closed", done_one)
		else
			done_one()
		end
	end
end

local update_all = function()
	local registry = require("mason-registry")
	if not require("mason-core.platform").is_headless then
		require("mason.ui").open()
	end

	registry.update(function(success, err)
		if not success then
			vim.notify("MasonUpdateAll: " .. err, vim.log.levels.ERROR)
			complete()
			return
		end

		update_installed(registry)
	end)
end

return {
	update_all = update_all,
}

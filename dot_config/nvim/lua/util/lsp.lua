local organize_imports = function(bufnr, post)
	bufnr = bufnr or 0
	local params = {
		command = "_typescript.organizeImports",
		arguments = { vim.api.nvim_buf_get_name(bufnr) },
	}
	vim.lsp.buf_request(bufnr, "workspace/executeCommand", params, function(err)
		if not err and post then
			post()
		end
	end)
end

local capabilities = function()
	local ok, blink = pcall(require, "blink.cmp")
	if ok then
		return blink.get_lsp_capabilities()
	else
		return vim.lsp.protocol.make_client_capabilities()
	end
end

local on_attach = function(client, bufnr)
	local map = function(mode, lhs, rhs, desc)
		vim.keymap.set(mode, lhs, rhs, { buffer = bufnr, desc = desc })
	end

	map("n", "gD", vim.lsp.buf.declaration, "declaration")
	map("n", "gd", vim.lsp.buf.definition, "definition")
	map("n", "gi", vim.lsp.buf.implementation, "implementation")
	map("n", "gr", vim.lsp.buf.references, "references")
	map("n", "gs", vim.lsp.buf.signature_help, "signature help")
	map("n", "K", vim.lsp.buf.hover, "hover")
	map("n", "]e", vim.diagnostic.goto_next, "error")
	map("n", "[e", vim.diagnostic.goto_prev, "error")

	map("n", "<leader>ca", ":FzfLua lsp_code_actions<cr>", "action")
	map("n", "<leader>cr", vim.lsp.buf.rename, "rename")
	map("n", "<leader>cs", vim.lsp.buf.signature_help, "signature")
	map("n", "<leader>cf", function()
		require("conform").format({ lsp_fallback = true })
	end, "format")
	map("n", "<leader>co", function()
		require("util.lsp").organize_imports()
	end, "organize imports")
end

local server_settings = {
	vtsls = {
		settings = {
			typescript = { format = { enable = false } },
			javascript = { format = { enable = false } },
		},
	},
	gopls = {
		settings = {
			gopls = {
				analyses = {
					nilness = true,
					shadow = true,
					unusedparams = true,
					unusedwrite = true,
				},
				gofumpt = true,
				staticcheck = true,
				usePlaceholders = true,
			},
		},
	},
}

return {
	organize_imports = organize_imports,
	capabilities = capabilities,
	on_attach = on_attach,
	server_settings = server_settings,
}

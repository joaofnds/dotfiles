return {
	"williamboman/mason.nvim",
	event = "BufReadPost",
	cmd = { "Mason", "MasonUpdate" },
	dependencies = {
		"williamboman/mason-lspconfig.nvim",
		"neovim/nvim-lspconfig",
	},
	config = function()
		local mason = require("mason")
		local mason_lspconfig = require("mason-lspconfig")
		local lsp = require("util.lsp")

		vim.diagnostic.config({
			virtual_text = { current_line = true },
			float = {
				border = "rounded",
				source = "if_many",
				focusable = false,
			},
			severity_sort = true,
		})

		mason.setup()
		mason_lspconfig.setup({
			ensure_installed = {
				"lua_ls",
				"vtsls",
				"gopls",
				"bashls",
				"jsonls",
				"yamlls",
				"pyright",
				"html",
				"cssls",
				"tailwindcss",
				"elixirls",
				"sqlls",
				"nil_ls",
			},
			handlers = {
				function(server_name)
					local server = require("lspconfig")[server_name]
					local server_config = lsp.server_settings[server_name] or {}

					server.setup(vim.tbl_deep_extend("force", {
						capabilities = lsp.capabilities(),
						on_attach = lsp.on_attach,
					}, server_config))
				end,
			},
		})
	end,
}

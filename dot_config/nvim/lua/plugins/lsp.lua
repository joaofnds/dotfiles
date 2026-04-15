return {
	"williamboman/mason.nvim",
	event = "BufReadPost",
	cmd = { "Mason", "MasonUpdate" },
	keys = {
		{ "<leader>cls", "<cmd>LspStart<cr>", desc = "start" },
		{ "<leader>clS", "<cmd>LspStop<cr>", desc = "stop" },
	},
	dependencies = {
		"williamboman/mason-lspconfig.nvim",
		"neovim/nvim-lspconfig",
		"Saghen/blink.cmp",
	},
	config = function()
		vim.diagnostic.config({
			virtual_text = { current_line = true },
			float = {
				border = "rounded",
				source = "if_many",
				focusable = false,
			},
			severity_sort = true,
		})

		vim.lsp.config("*", {
			capabilities = require("blink.cmp").get_lsp_capabilities(),
		})

		vim.api.nvim_create_autocmd("LspAttach", {
			callback = function(args)
				local bufnr = args.buf
				local map = function(mode, lhs, rhs, desc)
					vim.keymap.set(mode, lhs, rhs, { buffer = bufnr, desc = desc })
				end

				map("n", "gd", "<cmd>FzfLua lsp_definitions<cr>", "definition")
				map("n", "gD", "<cmd>FzfLua lsp_declarations<cr>", "declaration")
				map("n", "gr", "<cmd>FzfLua lsp_references<cr>", "references")
				map("n", "gi", "<cmd>FzfLua lsp_implementations<cr>", "implementations")
				map("n", "gy", "<cmd>FzfLua lsp_typedefs<cr>", "type definition")
				map("n", "]e", function() vim.diagnostic.jump({ count = 1 }) end, "next diagnostic")
				map("n", "[e", function() vim.diagnostic.jump({ count = -1 }) end, "prev diagnostic")

				map("n", "<leader>ca", "<cmd>FzfLua lsp_code_actions<cr>", "action")
				map("n", "<leader>cr", vim.lsp.buf.rename, "rename")
				map("n", "<leader>cf", function()
					require("conform").format({ lsp_fallback = true })
				end, "format")
				map("n", "<leader>co", function()
					local params = {
						command = "_typescript.organizeImports",
						arguments = { vim.api.nvim_buf_get_name(bufnr) },
					}
					vim.lsp.buf_request(bufnr, "workspace/executeCommand", params)
				end, "organize imports")
			end,
		})

		require("mason").setup()
		require("mason-lspconfig").setup({
			ensure_installed = {
				"biome",
				"lua_ls",
				"vtsls",
				"gopls",
				"bashls",
				"jsonls",
				"yamlls",
				"pyright",
				"html",
				"cssls",
				"elixirls",
				"sqlls",
				"nil_ls",
			},
			-- mason-lspconfig v2: auto-calls vim.lsp.enable() for installed servers
			automatic_enable = true,
		})
	end,
}

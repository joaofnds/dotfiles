return {
	"mason-org/mason.nvim",
	event = "User LazyFile",
	cmd = { "Mason", "MasonUpdate", "MasonUpdateAll" },
	keys = {
		{ "<leader>cls", "<cmd>doautocmd nvim.lsp.enable FileType<cr>", desc = "start" },
		{ "<leader>clS", "<cmd>lsp stop<cr>", desc = "stop" },
	},
	dependencies = {
		"mason-org/mason-lspconfig.nvim",
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

		vim.api.nvim_create_autocmd("LspAttach", {
			callback = function(args)
				local bufnr = args.buf
				local map = function(mode, lhs, rhs, desc)
					vim.keymap.set(mode, lhs, rhs, { buffer = bufnr, nowait = true, desc = desc })
				end

				local client = vim.lsp.get_client_by_id(args.data.client_id)
				if client and client:supports_method("textDocument/inlayHint") then
					vim.lsp.inlay_hint.enable(true, { bufnr = bufnr })
					map("n", "<leader>th", function()
						vim.lsp.inlay_hint.enable(
							not vim.lsp.inlay_hint.is_enabled({ bufnr = bufnr }),
							{ bufnr = bufnr }
						)
					end, "inlay hints")
				end

				map("n", "gd", "<cmd>FzfLua lsp_definitions<cr>", "definition")
				map("n", "gD", "<cmd>FzfLua lsp_declarations<cr>", "declaration")
				map("n", "gr", "<cmd>FzfLua lsp_references<cr>", "references")
				map("n", "gi", "<cmd>FzfLua lsp_implementations<cr>", "implementations")
				map("n", "gy", "<cmd>FzfLua lsp_typedefs<cr>", "type definition")
				map("n", "]e", function()
					vim.diagnostic.jump({ count = 1 })
				end, "next diagnostic")
				map("n", "[e", function()
					vim.diagnostic.jump({ count = -1 })
				end, "prev diagnostic")

				map("n", "<leader>ca", "<cmd>FzfLua lsp_code_actions<cr>", "action")
				map("n", "<leader>cs", "<cmd>FzfLua lsp_document_symbols<cr>", "document symbols")
				map("n", "<leader>cS", "<cmd>FzfLua lsp_workspace_symbols<cr>", "workspace symbols")
				map("n", "<leader>cr", vim.lsp.buf.rename, "rename")
				map("n", "<leader>cf", function()
					require("conform").format({ lsp_format = "fallback" })
				end, "format")
				map("n", "<leader>co", function()
					vim.lsp.buf.code_action({ context = { only = { "source.organizeImports" } }, apply = true })
				end, "organize imports")
			end,
		})

		vim.lsp.config("lua_ls", {
			settings = { Lua = { hint = { enable = true } } },
		})

		vim.lsp.config("gopls", {
			settings = {
				gopls = {
					hints = {
						assignVariableTypes = true,
						compositeLiteralFields = true,
						compositeLiteralTypes = true,
						constantValues = true,
						functionTypeParameters = true,
						parameterNames = true,
						rangeVariableTypes = true,
					},
				},
			},
		})

		vim.lsp.config("tsc", {
			settings = { ["js/ts"] = { inlayHints = { parameterNames = { enabled = "all" } } } },
		})


		require("mason").setup()
		vim.api.nvim_create_user_command("MasonUpdateAll", require("util.mason").update_all, {})

		require("mason-lspconfig").setup({
			ensure_installed = {
				"biome",
				"lua_ls",
				"tsc",
				"gopls",
				"bashls",
				"jsonls",
				"yamlls",
				"basedpyright",
				"html",
				"cssls",
				"expert",
			},
			automatic_enable = false,
		})
		vim.lsp.enable(vim.list_extend(require("mason-lspconfig").get_installed_servers(), { "nixd" }))
	end,
}

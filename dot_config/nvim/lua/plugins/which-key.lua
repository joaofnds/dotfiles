return {
	"folke/which-key.nvim",
	event = "VeryLazy",
	init = function()
		-- undo breakpoints
		for _, c in ipairs({ ",", ".", ";", "(", "[", "{" }) do
			vim.keymap.set("i", c, c .. "<c-g>u")
		end
	end,
	config = function()
		local wk = require("which-key")
		wk.setup({ icons = { mappings = false } })
		wk.add({
			-- groups
			{ "g", group = "go to" },
			{ "]", group = "next" },
			{ "[", group = "previous" },
			{ "<leader>", group = "leader" },
			{ "<leader>w", group = "window" },
			{ "<leader>f", group = "file" },
			{ "<leader>g", group = "git" },
			{ "<leader>gf", group = "find" },
			{ "<leader>h", group = "help" },
			{ "<leader>s", group = "search" },
			{ "<leader>b", group = "buffers" },
			{ "<leader>bd", group = "delete" },
			{ "<leader>o", group = "open" },
			{ "<leader>p", group = "project" },
			{ "<leader>c", group = "code" },
			{ "<leader>cl", group = "lsp" },
			{ "<leader>t", group = "toggle" },
			{ "<leader>x", group = "tmux" },

			-- general
			{ "Q", "<nop>", desc = "nop" },
			{ "<esc>", "<esc>:nohl<CR><esc>", desc = "esc" },
			{ "<leader>?", wk.show, desc = "show" },

			-- window management
			{ "<leader>w-", "<cmd>wincmd _<cr><cmd>wincmd |<cr>", desc = "zoom in" },
			{ "<leader>w=", "<cmd>wincmd =<cr>", desc = "re-balance windows" },
			{ "<leader>w_", "<cmd>wincmd _<cr>", desc = "max out the height" },
			{ "<leader>w|", "<cmd>wincmd |<cr>", desc = "max out the width" },
			{ "<leader>wN", "<cmd>new<cr>", desc = "new empty window" },
			{ "<leader>wV", "<cmd>vnew<cr>", desc = "new vertical empty window" },
			{ "<leader>ws", "<cmd>sp<cr>", desc = "open a horizontal split" },
			{ "<leader>wv", "<cmd>vsp<cr>", desc = "open a vertical split" },
			{ "<leader>wq", "<cmd>q<cr>", desc = "close current window" },
			{ "<leader>wB", "<cmd>wincmd T<cr>", desc = "break out split into window" },
			{ "<leader>wo", "<cmd>wincmd o<cr>", desc = "kill other windows" },
			{ "<leader>wr", "<cmd>wincmd r<cr>", desc = "swaps windows" },
			{ "<leader>wH", "<cmd>wincmd H<cr>", desc = "moves buffer to the left" },
			{ "<leader>wJ", "<cmd>wincmd J<cr>", desc = "moves the buffer to the bottom" },
			{ "<leader>wK", "<cmd>wincmd K<cr>", desc = "moves the buffer to the top" },
			{ "<leader>wL", "<cmd>wincmd L<cr>", desc = "moves buffer to the right" },

			-- file
			{ "<leader>fs", "<cmd>w<cr>", desc = "writes the buffer" },
			{ "<leader>ft", "<cmd>vsplit ~/TODO.md<cr>", desc = "opens TODO.md" },

			-- help
			{
				"<leader>hu",
				function()
					vim.cmd("Lazy update")
					vim.cmd("MasonUpdate")
					vim.cmd("TSUpdate all")
				end,
				desc = "update",
			},

			-- toggle
			{ "<leader>ti", "<cmd>set invlist<cr>", desc = "invisible chars" },
			{ "<leader>tl", "<cmd>set relativenumber!<cr>", desc = "relative number" },
			{ "<leader>tw", "<cmd>set wrap!<cr>", desc = "toggle wrap" },

			-- visual mode
			{ "<c-j>", ":m '>+1<cr>gv=gv", desc = "move line down", mode = "v" },
			{ "<c-k>", ":m '<-2<cr>gv=gv", desc = "move line up", mode = "v" },
			{ "gb", group = "base64", mode = "v" },
			{ "gbe", 'c<c-r>=trim(system("base64", @"))<cr><esc>', desc = "encode", mode = "v" },
			{ "gbd", 'c<c-r>=trim(system("base64 --decode", @"))<cr><esc>', desc = "decode", mode = "v" },
			{ "gt", 'c<c-r>=strftime("%Y-%m-%dT%H:%M:%S%z", @")[0:9]<cr><esc>', desc = "epoch → date", mode = "v" },
		})
	end,
}

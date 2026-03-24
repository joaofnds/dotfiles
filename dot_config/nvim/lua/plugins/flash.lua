return {
	"folke/flash.nvim",
	opts = {},
	keys = {
		{ "zj", mode = { "n", "x", "o" }, function() require("flash").jump() end, desc = "flash forward" },
		{ "zk", mode = { "n", "x", "o" }, function() require("flash").jump({ search = { forward = false } }) end, desc = "flash backward" },
		{ "s", mode = { "n", "x", "o" }, function() require("flash").jump() end, desc = "flash" },
		{ "S", mode = { "n", "o" }, function() require("flash").treesitter() end, desc = "flash treesitter" },
		{ "r", mode = "o", function() require("flash").remote() end, desc = "remote flash" },
		{ "R", mode = { "o", "x" }, function() require("flash").treesitter_search() end, desc = "treesitter search" },
	},
}

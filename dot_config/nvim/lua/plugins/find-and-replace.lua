return {
  "MagicDuck/grug-far.nvim",
  cmd = { "GrugFar", "GrugFarWithin" },
  opts = {},
  keys = {
    {
      "<leader>sR",
      function() require("grug-far").open() end,
      mode = "n",
      desc = "search & replace"
    },
    {
      "<leader>sR",
      function() require("grug-far").with_visual_selection() end,
      mode = "x",
      desc = "search & replace selection"
    },
  },
}

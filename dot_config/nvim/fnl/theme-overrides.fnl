(fn dark []
  (vim.cmd.highlight "Visual     gui=NONE guibg=#073642 guifg=NONE")
  (vim.cmd.highlight "VisualNOS  gui=NONE guibg=#073642 guifg=NONE")
  (vim.cmd.highlight "VisualMode gui=NONE guibg=#073642 guifg=NONE")
  (vim.cmd.highlight "Search     gui=NONE guibg=#073642 guifg=NONE gui=undercurl,italic")
  (vim.cmd.highlight "IncSearch  gui=NONE guibg=#073642 guifg=NONE gui=undercurl,italic"))

(fn light []
  (vim.cmd.highlight "Visual     gui=NONE guibg=#eee9d4 guifg=NONE")
  (vim.cmd.highlight "VisualNOS  gui=NONE guibg=#eee9d4 guifg=NONE")
  (vim.cmd.highlight "VisualMode gui=NONE guibg=#eee9d4 guifg=NONE")
  (vim.cmd.highlight "Search     gui=NONE guibg=#eee9d4 guifg=NONE gui=undercurl,italic")
  (vim.cmd.highlight "IncSearch  gui=NONE guibg=#eee9d4 guifg=NONE gui=undercurl,italic"))

{:dark  dark
 :light light}

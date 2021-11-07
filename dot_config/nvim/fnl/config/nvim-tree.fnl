(let [{: nnoremap} (require :utils)]
  (nnoremap "<leader>op" ":NvimTreeToggle<cr>")
  (nnoremap "<leader>o." ":NvimTreeFindFile<cr>"))

(set vim.g.nvim_tree_gitignore 1)
(set vim.g.nvim_tree_group_empty 1)
(set vim.g.nvim_tree_show_icons
     {"files"   1
      "folders" 1
      "git"     1})

(set vim.g.nvim_tree_icons
     {"default" ""
      "symlink" ""
      "git"
      {"unstaged" "✗"
       "staged" "✓"
       "unmerged" ""
       "renamed" "➜"
       "untracked" "★"
       "deleted" ""
       "ignored" "◌"}
      "folder"
      {"default" ""
       "open" ""
       "empty" ""
       "empty_open" ""
       "symlink" ""
       "symlink_open" ""}})

(let [cb (. (require :nvim-tree.config) "nvim_tree_callback")
      nvim-tree (require :nvim-tree)]
  (nvim-tree.setup
   {"auto_close" true
    "tree_follow" true
    "nvim_tree_ignore" [".git" "node_modules" ".DS_Store"]
    "bindings" [{"key" ["<CR>" "o" "<2-LeftMouse>"] "cb" (cb "edit")}
                {"key" ["<2-RightMouse>" "<C-]>"]   "cb" (cb "cd")}
                {"key" "<C-v>"  "cb" (cb "vsplit")}
                {"key" "<C-x>"  "cb" (cb "split")}
                {"key" "<C-t>"  "cb" (cb "tabnew")}
                {"key" "<"      "cb" (cb "prev_sibling")}
                {"key" ">"      "cb" (cb "next_sibling")}
                {"key" "P"      "cb" (cb "parent_node")}
                {"key" "<BS>"   "cb" (cb "close_node")}
                {"key" "<S-CR>" "cb" (cb "close_node")}
                {"key" "<Tab>"  "cb" (cb "preview")}
                {"key" "K"      "cb" (cb "first_sibling")}
                {"key" "J"      "cb" (cb "last_sibling")}
                {"key" "I"      "cb" (cb "toggle_ignored")}
                {"key" "H"      "cb" (cb "toggle_dotfiles")}
                {"key" "R"      "cb" (cb "refresh")}
                {"key" "a"      "cb" (cb "create")}
                {"key" "d"      "cb" (cb "remove")}
                {"key" "r"      "cb" (cb "rename")}
                {"key" "<C-r>"  "cb" (cb "full_rename")}
                {"key" "x"      "cb" (cb "cut")}
                {"key" "c"      "cb" (cb "copy")}
                {"key" "p"      "cb" (cb "paste")}
                {"key" "y"      "cb" (cb "copy_name")}
                {"key" "Y"      "cb" (cb "copy_path")}
                {"key" "gy"     "cb" (cb "copy_absolute_path")}
                {"key" "[c"     "cb" (cb "prev_git_item")}
                {"key" "]c"     "cb" (cb "next_git_item")}
                {"key" "-"      "cb" (cb "dir_up")}
                {"key" "s"      "cb" (cb "system_open")}
                {"key" "q"      "cb" (cb "close")}
                {"key" "g?"     "cb" (cb "toggle_help")}]}))

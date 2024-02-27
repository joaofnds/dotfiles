(fn oldfiles []
  (let [cwd (vim.fn.getcwd)]
    (-> vim.v.oldfiles
        (vim.fn.filter #(vim.startswith $2 cwd))
        (vim.fn.map #(vim.fn.fnamemodify $2 ":.")))))

(fn vimfn [name & args]
  (vim.api.nvim_call_function name args))

(fn update []
  (vim.cmd "Lazy update")
  (vim.cmd "MasonUpdate")
  (vim.cmd "TSUpdate all"))

{:oldfiles oldfiles
 :vimfn vimfn
 :update update}

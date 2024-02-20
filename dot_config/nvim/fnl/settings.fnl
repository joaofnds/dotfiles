(set vim.g.mapleader " ")

;; general config
(set vim.opt.number true)
(set vim.opt.relativenumber true)
(set vim.opt.wrap false)
(set vim.opt.visualbell true)
(set vim.opt.colorcolumn "80")
(set vim.opt.clipboard "unnamedplus")
(set vim.opt.foldnestmax 3)
(set vim.opt.wildmode ["full" "list:longest"])
(vim.opt.diffopt:append ["algorithm:patience" "indent-heuristic"])

;; indentation
(set vim.opt.shiftwidth 2)
(set vim.opt.softtabstop 2)
(set vim.opt.tabstop 2)
(set vim.opt.expandtab true)
(set vim.opt.listchars {:tab "▸ " :trail "·" :eol "↴"})
(set vim.opt.fillchars {:eob " "}) ;; remove ~ from end of buffer

;; persistent undo
(set vim.opt.backupdir  (.. (vim.fn.stdpath "data") "/backups"))

(when (not (vim.fn.isdirectory vim.o.backupdir))
  (os.execute (.. "mkdir -p " vim.o.backupdir)))

(set vim.opt.backup false)
(set vim.opt.backupcopy "yes")
(set vim.opt.swapfile false)
(set vim.opt.undodir vim.o.backupdir)
(set vim.opt.undofile true)
(set vim.opt.wb false)

;; don't create root-owned files
(when (os.getenv "SUDO_USER")
  (set vim.opt.backup false)
  (set vim.opt.writebackup false))

;; sources to ignore when tab completing
(set vim.opt.wildignore
  ["*.o"
   "*.obj"
   "*~"
   "*vim/backups*"
   "*sass-cache*"
   "*DS_Store*"
   "vendor/rails/**"
   "vendor/cache/**"
   "*.gem"
   "log/**"
   "tmp/**"])

;; search
(set vim.opt.incsearch true)  ;; find the next match as we type the search
(set vim.opt.hlsearch true)   ;; highlight searches by default
(set vim.opt.ignorecase true) ;; ignore case when searching...
(set vim.opt.smartcase true)  ;; ...unless we type a capital

(set vim.opt.background "dark")
(set vim.opt.termguicolors true)

(vim.cmd.filetype "plugin indent on")

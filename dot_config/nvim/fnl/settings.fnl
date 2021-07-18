(set vim.g.mapleader " ")

;; General Config
(set vim.opt.encoding       "utf8")   ;; Set encoding
(set vim.opt.laststatus     2)        ;; Always show status line
(set vim.opt.number         true)     ;; Enable line Numbers
(set vim.opt.relativenumber true)     ;; Enable relative line numbers
(set vim.opt.wrap           false)    ;; Disable line wrap
(set vim.opt.showcmd        true)     ;; Show incomplete cmds down the bottom
(set vim.opt.showmode       true)     ;; Show current mode down the bottom
(set vim.opt.visualbell     true)     ;; No sounds"
(set vim.opt.autochdir      true)     ;; Don't set CWD when as rootdir when opening vim
(set vim.opt.autoread       true)     ;; Reload files changed outside vim
(set vim.opt.hidden         true)     ;; This makes vim act like all other editors, buffers can exist in the background without being in a window. http://items.sjbach.com/319/configuring-vim-right
(set vim.opt.colorcolumn    "80")     ;; Display a column at the 80th column
(set vim.opt.tags           "./tags")
(set vim.opt.compatible     false)
(set vim.opt.splitbelow     true)     ;; Default horizontal split direction
(set vim.opt.splitright     true)     ;; Default vertical split direction

;; Better diff algorithms
(vim.opt.diffopt:append { "algorithm:patience" "indent-heuristic" })

;; Indentation
(set vim.opt.autoindent  true)
(set vim.opt.smartindent true)
(set vim.opt.smarttab    true)
(set vim.opt.shiftwidth  2)
(set vim.opt.softtabstop 2)
(set vim.opt.tabstop     2)
(set vim.opt.expandtab   true)
(set vim.opt.list        true)
(vim.opt.listchars:append {"tab" "  "
                           "trail" "·"})

;; turn off swap files
(set vim.opt.swapfile false)
(set vim.opt.backup   false)
(set vim.opt.wb       false)

;; persistent undo
;; keep undo history across sessions, by storing in file.
(when (not (vim.fn.isdirectory "backups"))
  (os.execute "mkdir backups"))

(set vim.opt.swapfile   false)
(set vim.opt.backup     false)
(set vim.opt.backupdir  (vim.fn.expand "~/.config/nvim/backups"))
(set vim.opt.backupcopy "yes") ;; overwrite files to update, instead of renaming + rewriting
(set vim.opt.undodir    vim.o.backupdir)
(set vim.opt.undofile   true)

;; don't create root-owned files
(when (os.getenv "SUDO_USER")
  (set vim.o.backup false)
  (set vim.o.writebackup false))

;; folds
(set vim.opt.foldmethod "expr") ;; fold based on indent
(set vim.opt.foldnestmax 3)     ;;  deepest fold is 3 levels
(set vim.opt.foldenable false)  ;; don't fold by default

;; completion
(vim.opt.wildmode:append ["list:longest"])
(set vim.opt.wildmenu true) ;; enable ctrl-n and ctrl-p to scroll thru matches

;; stuff to ignore when tab completing
(vim.opt.wildignore:append
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

(vim.opt.rtp:append ["/usr/local/opt/fzf"])

;; search
(set vim.opt.incsearch  true) ;; Find the next match as we type the search
(set vim.opt.hlsearch   true) ;; Highlight searches by default
(set vim.opt.ignorecase true) ;; Ignore case when searching...
(set vim.opt.smartcase  true) ;; ...unless we type a capital

vim.g.mapleader = ' '

-- General Config
vim.opt.encoding       = 'utf8'   -- Set encoding
vim.opt.laststatus     = 2        -- Always show status line
vim.opt.number         = true     -- Enable line Numbers
vim.opt.relativenumber = true     -- Enable relative line numbers
vim.opt.wrap           = false    -- Disable line wrap
vim.opt.showcmd        = true     -- Show incomplete cmds down the bottom
vim.opt.showmode       = true     -- Show current mode down the bottom
vim.opt.visualbell     = true     -- No sounds"
vim.opt.autochdir      = true     -- Don't set CWD when as rootdir when opening vim
vim.opt.autoread       = true     -- Reload files changed outside vim
vim.opt.hidden         = true     -- This makes vim act like all other editors, buffers can exist in the background without being in a window. http://items.sjbach.com/319/configuring-vim-right
vim.opt.colorcolumn    = '80'     -- Display a column at the 80th column
vim.opt.tags           = './tags'
vim.opt.compatible     = false
vim.opt.splitbelow     = true     -- Default horizontal split direction
vim.opt.splitright     = true     -- Default vertical split direction

-- Better diff algorithms
vim.opt.diffopt:append({ 'algorithm:patience', 'indent-heuristic' })

-- Indentation
vim.opt.autoindent  = true
vim.opt.smartindent = true
vim.opt.smarttab    = true
vim.opt.shiftwidth  = 2
vim.opt.softtabstop = 2
vim.opt.tabstop     = 2
vim.opt.expandtab   = true
vim.opt.list        = true
vim.opt.listchars:append({
  tab   = '  ',
  trail = '·'
})

-- turn off swap files
vim.opt.swapfile = false
vim.opt.backup   = false
vim.opt.wb       = false

-- persistent undo
-- keep undo history across sessions, by storing in file.
if not vim.fn.isdirectory('backups') then
  os.execute("mkdir backups")
end

vim.opt.swapfile   = false
vim.opt.backup     = false
vim.opt.backupdir  = vim.fn.expand('~/.config/nvim/backups')
vim.opt.backupcopy = 'yes' -- overwrite files to update, instead of renaming + rewriting
vim.opt.undodir    = vim.o.backupdir
vim.opt.undofile   = true

if os.getenv("SUDO_USER") then
  -- don't create root-owned files
  vim.o.backup = false
  vim.o.writebackup = false
end

-- folds
vim.opt.foldmethod  = 'expr'  -- fold based on indent
vim.opt.foldnestmax = 3     --  deepest fold is 3 levels
vim.opt.foldenable  = false -- don't fold by default

-- completion
vim.opt.wildmode:append({ 'list:longest' })
vim.opt.wildmenu = true -- enable ctrl-n and ctrl-p to scroll thru matches

-- stuff to ignore when tab completing
vim.opt.wildignore:append({
  '*.o',
  '*.obj',
  '*~',
  '*vim/backups*',
  '*sass-cache*',
  '*DS_Store*',
  'vendor/rails/**',
  'vendor/cache/**',
  '*.gem',
  'log/**',
  'tmp/**'
})

vim.opt.rtp:append({ '/usr/local/opt/fzf' })

-- search
vim.opt.incsearch  = true -- Find the next match as we type the search
vim.opt.hlsearch   = true -- Highlight searches by default
vim.opt.ignorecase = true -- Ignore case when searching...
vim.opt.smartcase  = true -- ...unless we type a capital

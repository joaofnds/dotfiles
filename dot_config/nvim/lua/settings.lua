local nvim_home = os.getenv("HOME") .. '/.config/nvim'

vim.g.mapleader = ' '

-- General Config
vim.o.encoding       = 'utf8'   -- Set encoding
vim.o.laststatus     = 2        -- Always show status line
vim.o.number         = true     -- Enable line Numbers
vim.o.relativenumber = true     -- Enable relative line numbers
vim.o.wrap           = false    -- Disable line wrap
vim.o.showcmd        = true     -- Show incomplete cmds down the bottom
vim.o.showmode       = true     -- Show current mode down the bottom
vim.o.visualbell     = true     -- No sounds"
vim.o.autochdir      = true     -- Don't set CWD when as rootdir when opening vim
vim.o.autoread       = true     -- Reload files changed outside vim
vim.o.hidden         = true     -- This makes vim act like all other editors, buffers can exist in the background without being in a window. http://items.sjbach.com/319/configuring-vim-right
vim.o.colorcolumn    = '80'     -- Display a column at the 80th column
vim.o.tags           = './tags'
vim.o.compatible     = false
vim.o.splitbelow     = true     -- Default horizontal split direction
vim.o.splitright     = true     -- Default vertical split direction

-- Better diff algorithms
vim.opt.diffopt:append({ 'algorithm:patience', 'indent-heuristic' })

-- Indentation
vim.o.autoindent  = true
vim.o.smartindent = true
vim.o.smarttab    = true
vim.o.shiftwidth  = 2
vim.o.softtabstop = 2
vim.o.tabstop     = 2
vim.o.expandtab   = true
vim.o.list = true
vim.opt.listchars:append({
  tab   = '  ',
  trail = '·'
})

-- turn off swap files
vim.o.swapfile = false
vim.o.backup = false
vim.o.wb = false

-- persistent undo
-- keep undo history across sessions, by storing in file.
if not vim.fn.isdirectory('backups') then
  os.execute("mkdir backups")
end

vim.o.swapfile   = false
vim.o.backup     = false
vim.o.undodir    = nvim_home .. '/backups'
vim.o.undofile   = true
vim.o.backupcopy = 'yes' -- overwrite files to update, instead of renaming + rewriting
vim.o.backupdir  = nvim_home .. '/backups/'

if os.getenv("SUDO_USER") then
  -- don't create root-owned files
  vim.o.backup = false
  vim.o.writebackup = false
end

-- folds
vim.o.foldmethod  = 'expr'  -- fold based on indent
vim.o.foldnestmax = 3     --  deepest fold is 3 levels
vim.o.foldenable  = false -- don't fold by default

-- completion
vim.opt.wildmode:append({ 'list:longest' })
vim.o.wildmenu = true -- enable ctrl-n and ctrl-p to scroll thru matches

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

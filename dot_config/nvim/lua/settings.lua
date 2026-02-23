vim.g.mapleader = " "
vim.g.maplocalleader = ","

-- general config
vim.opt.number = true
vim.opt.relativenumber = true
vim.opt.wrap = false
vim.opt.visualbell = true
vim.opt.updatetime = 250
vim.opt.colorcolumn = "80"
vim.opt.clipboard = "unnamedplus"
vim.opt.foldlevel = 99
vim.opt.foldlevelstart = 99
vim.opt.foldenable = true
vim.opt.wildmode = { "full", "list:longest" }
vim.opt.diffopt:append({ "algorithm:patience", "indent-heuristic" })

-- indentation
vim.opt.shiftwidth = 2
vim.opt.softtabstop = 2
vim.opt.tabstop = 2
vim.opt.expandtab = true
vim.opt.listchars = { tab = "▸ ", trail = "·", eol = "↴" }
vim.opt.fillchars = { eob = " " }

-- remove ~ from end of buffer

-- refresh buffer when file changes
vim.opt.autoread = true
vim.api.nvim_create_autocmd({ "FocusGained", "TermClose", "TermLeave" }, {
	group = vim.api.nvim_create_augroup("jf_checktime", { clear = true }),
	command = "checktime",
})

-- persistent undo
vim.opt.backupdir = vim.fn.stdpath("data") .. "/backups"

if vim.fn.isdirectory(vim.o.backupdir) == 0 then
	vim.fn.mkdir(vim.o.backupdir, "p")
end

vim.opt.backup = false
vim.opt.backupcopy = "yes"
vim.opt.swapfile = false
vim.opt.undodir = vim.o.backupdir
vim.opt.undofile = true
vim.opt.wb = false

-- don't create root-owned files
if os.getenv("SUDO_USER") then
	vim.opt.writebackup = false
end

-- sources to ignore when tab completing
vim.opt.wildignore = {
	"*.o",
	"*.obj",
	"*~",
	"*vim/backups*",
	"*sass-cache*",
	"*DS_Store*",
	"vendor/rails/**",
	"vendor/cache/**",
	"*.gem",
	"log/**",
	"tmp/**",
}

-- search
vim.opt.incsearch = true

-- find the next match as we type the search
vim.opt.hlsearch = true

-- highlight searches by default
vim.opt.ignorecase = true

-- ignore case when searching...
vim.opt.smartcase = true

-- ...unless we type a capital

vim.opt.timeout = true
vim.opt.timeoutlen = 500

vim.opt.background = "dark"
vim.opt.termguicolors = true

vim.cmd.filetype("plugin indent on")

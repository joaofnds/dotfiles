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
vim.opt.signcolumn = "yes"
vim.opt.scrolloff = 8
vim.opt.sidescrolloff = 8
vim.opt.splitbelow = true
vim.opt.splitright = true
vim.opt.cursorline = true
vim.opt.diffopt:append({ "algorithm:patience", "indent-heuristic", "linematch:60" })

-- indentation
vim.opt.shiftwidth = 2
vim.opt.softtabstop = 2
vim.opt.tabstop = 2
vim.opt.expandtab = true
vim.opt.listchars = { tab = "▸ ", trail = "·", eol = "↴" }

-- remove ~ from end of buffer
vim.opt.fillchars = { eob = " " }

-- refresh buffer when file changes
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

-- ignore case when searching...
vim.opt.ignorecase = true
-- ...unless we type a capital
vim.opt.smartcase = true

vim.opt.timeoutlen = 500

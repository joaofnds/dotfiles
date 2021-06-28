local lsp = {}

local lspconfig = require "lspconfig"
local lspinstall = require "lspinstall"
local saga = require "lspsaga"
local utils = require("utils")

function on_attach()
    saga.init_lsp_saga()
    utils.nnoremap("gd", "<cmd>lua vim.lsp.buf.definition()<CR>")
    utils.nnoremap("<leader>cr", "<cmd>lua require('lspsaga.rename').rename()<CR>")
    utils.nnoremap("<leader>cs", "<cmd>lua require('lspsaga.signaturehelp').signature_help()<CR>")
    utils.nnoremap("<leader>cp", "<cmd>lua require'lspsaga.provider'.preview_definition()<CR>")
    utils.nnoremap("<leader>cd", "<cmd>lua require'lspsaga.diagnostic'.show_line_diagnostics()<CR>")
    utils.nnoremap("K", "<cmd>lua require('lspsaga.hover').render_hover_doc()<CR>")
end

function lsp.init()
    lspinstall.setup()

    local servers = lspinstall.installed_servers()
    for _, server in pairs(servers) do
        lspconfig[server].setup {
            on_attach = on_attach
        }
    end
end

return lsp

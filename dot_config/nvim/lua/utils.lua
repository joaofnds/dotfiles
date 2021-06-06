local utils = {}

function utils.nnoremap(bind, command)
    vim.api.nvim_buf_set_keymap(0, "n", bind, command, {noremap = true, silent = true})
end

function utils.inoremap(bind, command)
    vim.api.nvim_buf_set_keymap(0, "i", bind, command, {noremap = true, silent = true})
end

return utils

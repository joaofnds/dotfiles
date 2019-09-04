nnoremap <leader>v- :VtrOpenRunner { "orientation": "v", "percentage": 50 }<cr>
nnoremap <leader>v= :VtrOpenRunner { "orientation": "h", "percentage": 50  }<cr>
nnoremap <leader>va :VtrAttachToPane<cr>

nnoremap <leader>rr :VtrResizeRunner<cr>
nnoremap <leader>ror :VtrReorientRunner<cr>
nnoremap <leader>sc :VtrSendCommandToRunner<cr>
nnoremap <leader>sl :VtrSendLinesToRunner<cr>
nnoremap <leader>or :VtrOpenRunner<cr>
nnoremap <leader>kr :VtrKillRunner<cr>
nnoremap <leader>fr :VtrFocusRunner<cr>
nnoremap <leader>dr :VtrDetachRunner<cr>
nnoremap <leader>ar :VtrReattachRunner<cr>
nnoremap <leader>cr :VtrClearRunner<cr>
nnoremap <leader>fc :VtrFlushCommand<cr>

vnoremap <leader>sl :VtrSendLinesToRunner<cr>

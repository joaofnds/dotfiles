let g:rspec_command = "call VtrSendCommand('rspec {spec}')"
map <Leader>rf :call RunCurrentSpecFile()<CR>
map <Leader>rn :call RunNearestSpec()<CR>

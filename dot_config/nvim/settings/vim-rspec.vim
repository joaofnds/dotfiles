let g:rspec_command = "call VtrSendCommand('rspec {spec}')"
map <Leader>tf :call RunCurrentSpecFile()<CR>
map <Leader>tn :call RunNearestSpec()<CR>

let g:ale_completion_enabled = 1
let g:ale_lint_on_save = 1
let g:ale_lint_on_text_changed = 0
let g:ale_open_list = 1

let b:ale_linters = {
  \ 'go': ['golangserver'],
  \ 'ruby': ['solargraph']
  \ }
let b:ale_fixers = {
  \ 'javascript': ['prettier', 'eslint'],
  \ 'go': ['gofmt']
  \ }

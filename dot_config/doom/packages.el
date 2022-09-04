;; -*- lexical-binding: t; -*-

(package! dash)              ; a modern list library for emacs
(package! s)                 ; the long lost emacs string manipulation library
(package! f)                 ; modern api for working with files and directories

(package! vmd-mode)

(package! org-mac-link)      ; insert org-mode links to items selected in various mac apps
(package! org-appear)        ; automatic visibility of various org elements depending on cursor position

(package! string-inflection) ; underscore_case -> UPCASE -> camelCase -> PascalCase conversion of names
(package! package-lint)      ; a linting library for elisp package authors
(package! spongebob-case     ; YoU cAn’T wRiTe A pAcKaGe ThIs StUpId!
  :recipe (:host github :repo "duckwork/spongebob-case.el" :files ("*.el")))

(package! tmux-pane)         ; negivate seamlessly between tmux and emacs
(package! emacs-tmux-runner ; my port of christoomey/vim-tmux-runner
  :recipe (:host github :repo "joaofnds/emacs-tmux-runner"))


(unpin! format-all)
